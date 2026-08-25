import { getRazorpayInstance, verifyRazorpaySignature, verifyRazorpayWebhookSignature } from '../utils/razorpay';
import { adminFirestore } from '../firebase/admin';
import { COLLECTIONS } from '../firebase/collections';
import { Payment, Booking } from '../firebase/types';
import { BookingService } from './booking.service';
import { NotificationService } from './notification.service';
import { generateInvoicePdfBuffer } from '../utils/invoice';
import { uploadAdminFile } from '../firebase/storage';
import { toPaise } from '../utils/currency';
import {
  PaymentFailedError,
  PaymentVerificationFailedError,
  NotFoundError,
  RefundFailedError
} from '../firebase/errors';
import { logger } from '../utils/logger';

export class PaymentService {
  /**
   * Create Razorpay Order on server based on Firestore Booking record (Never trust frontend amount!)
   */
  static async createRazorpayOrder(bookingId: string): Promise<{
    orderId: string;
    amount: number; // in paise
    currency: string;
    bookingId: string;
  }> {
    const booking = await BookingService.getBookingById(bookingId);

    if (booking.paymentStatus === 'paid') {
      throw new PaymentFailedError('Booking is already paid.');
    }

    const amountInPaise = toPaise(booking.total);
    const razorpay = getRazorpayInstance();

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${booking.bookingId}`,
      notes: {
        bookingId: booking.id,
        bookingRef: booking.bookingId,
        guestEmail: booking.email
      }
    };

    const order = await razorpay.orders.create(options);
    const now = new Date().toISOString();

    // Store payment intent record in Firestore
    const paymentRef = adminFirestore.collection(COLLECTIONS.PAYMENTS).doc();
    const paymentData: Payment = {
      id: paymentRef.id,
      paymentId: order.id,
      bookingId: booking.id,
      customerId: booking.customerId,
      razorpayOrderId: order.id,
      amount: booking.total,
      currency: 'INR',
      status: 'created',
      createdAt: now,
      updatedAt: now
    };

    await paymentRef.set(paymentData);

    return {
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      bookingId: booking.id
    };
  }

  /**
   * Verify Razorpay Payment Signature on Server and execute fulfillment workflow
   */
  static async verifyPayment(
    bookingId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string
  ): Promise<{ success: boolean; booking: Booking; invoiceUrl?: string }> {
    // 1. Verify HMAC SHA256 Signature
    verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, signature);

    const booking = await BookingService.getBookingById(bookingId);
    const now = new Date().toISOString();

    // 2. Record payment confirmation in Firestore
    const paymentQuery = await adminFirestore
      .collection(COLLECTIONS.PAYMENTS)
      .where('razorpayOrderId', '==', razorpayOrderId)
      .limit(1)
      .get();

    if (!paymentQuery.empty) {
      const paymentDoc = paymentQuery.docs[0];
      await paymentDoc.ref.update({
        razorpayPaymentId,
        signature,
        status: 'captured',
        updatedAt: now
      });
    } else {
      await adminFirestore.collection(COLLECTIONS.PAYMENTS).add({
        paymentId: razorpayPaymentId,
        bookingId: booking.id,
        customerId: booking.customerId,
        razorpayOrderId,
        razorpayPaymentId,
        signature,
        amount: booking.total,
        currency: 'INR',
        status: 'captured',
        createdAt: now,
        updatedAt: now
      });
    }

    // 3. Generate Tax Invoice PDF & upload to private Firebase Storage
    let invoiceUrl: string | undefined;
    try {
      const invoiceBuffer = await generateInvoicePdfBuffer(booking);
      const invoiceFileName = `invoice_${booking.bookingId}.pdf`;
      invoiceUrl = await uploadAdminFile('invoices', invoiceFileName, invoiceBuffer, 'application/pdf');
    } catch (err) {
      logger.error('Failed to generate invoice PDF during payment verification:', err);
    }

    // 4. Update Booking status to confirmed & paid
    const updatedBooking = await BookingService.updateBookingStatus(booking.id, 'confirmed', {
      razorpayOrderId,
      razorpayPaymentId,
      invoiceUrl
    });

    // 5. Dispatch notification
    await NotificationService.sendBookingConfirmation(updatedBooking);

    return {
      success: true,
      booking: updatedBooking,
      invoiceUrl
    };
  }

  /**
   * Idempotent Webhook Handler for Razorpay Async Events
   */
  static async handleRazorpayWebhook(
    rawBody: Buffer | string,
    signature: string,
    payload: any
  ): Promise<{ processed: boolean; reason?: string }> {
    // 1. Verify authenticity
    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new PaymentVerificationFailedError('Invalid webhook signature.');
    }

    const event = payload.event;
    const eventId = payload.event_id || `${payload.created_at}_${event}`;

    // 2. Check Idempotency in Firestore
    const eventRef = adminFirestore.collection(COLLECTIONS.WEBHOOK_EVENTS).doc(eventId);
    const eventDoc = await eventRef.get();

    if (eventDoc.exists) {
      logger.info(`Webhook event ${eventId} already processed. Skipping duplicate.`);
      return { processed: true, reason: 'Duplicate event' };
    }

    // Process event
    if (event === 'payment.captured') {
      const entity = payload.payload.payment.entity;
      const razorpayOrderId = entity.order_id;
      const razorpayPaymentId = entity.id;
      const notes = entity.notes || {};
      const bookingId = notes.bookingId;

      if (bookingId) {
        await this.verifyPayment(
          bookingId,
          razorpayOrderId,
          razorpayPaymentId,
          'webhook_verified'
        );
      }
    } else if (event === 'payment.failed') {
      const entity = payload.payload.payment.entity;
      const razorpayOrderId = entity.order_id;
      const paymentQuery = await adminFirestore
        .collection(COLLECTIONS.PAYMENTS)
        .where('razorpayOrderId', '==', razorpayOrderId)
        .limit(1)
        .get();

      if (!paymentQuery.empty) {
        await paymentQuery.docs[0].ref.update({
          status: 'failed',
          errorReason: entity.error_description || 'Payment failed',
          updatedAt: new Date().toISOString()
        });
      }
    } else if (event === 'refund.created') {
      const entity = payload.payload.refund.entity;
      const razorpayPaymentId = entity.payment_id;
      const paymentQuery = await adminFirestore
        .collection(COLLECTIONS.PAYMENTS)
        .where('razorpayPaymentId', '==', razorpayPaymentId)
        .limit(1)
        .get();

      if (!paymentQuery.empty) {
        await paymentQuery.docs[0].ref.update({
          status: 'refunded',
          updatedAt: new Date().toISOString()
        });
      }
    }

    // 3. Store processed webhook event for idempotency
    await eventRef.set({
      eventId,
      event,
      processedAt: new Date().toISOString()
    });

    return { processed: true };
  }

  /**
   * Refund payment for a cancelled booking
   */
  static async refundPayment(bookingId: string, reason: string): Promise<any> {
    const booking = await BookingService.getBookingById(bookingId);

    if (!booking.razorpayPaymentId) {
      throw new RefundFailedError('No Razorpay payment record associated with this booking.');
    }

    const razorpay = getRazorpayInstance();
    const refund = await razorpay.payments.refund(booking.razorpayPaymentId, {
      notes: {
        reason,
        bookingId: booking.id
      }
    });

    await BookingService.updateBookingStatus(booking.id, 'refunded');

    const now = new Date().toISOString();
    await adminFirestore.collection(COLLECTIONS.PAYMENTS).add({
      paymentId: refund.id,
      bookingId: booking.id,
      razorpayPaymentId: booking.razorpayPaymentId,
      amount: booking.total,
      currency: 'INR',
      status: 'refunded',
      reason,
      createdAt: now,
      updatedAt: now
    });

    return refund;
  }
}
