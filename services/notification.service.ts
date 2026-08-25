import { adminFirestore } from '../firebase/admin';
import { COLLECTIONS } from '../firebase/collections';
import { Booking, AppNotification } from '../firebase/types';
import { logger } from '../utils/logger';

export class NotificationService {
  /**
   * Dispatch booking confirmation notification
   */
  static async sendBookingConfirmation(booking: Booking): Promise<AppNotification> {
    const now = new Date().toISOString();
    const ref = adminFirestore.collection(COLLECTIONS.NOTIFICATIONS).doc();

    const notification: AppNotification = {
      id: ref.id,
      recipientId: booking.customerId,
      recipientEmail: booking.email,
      title: 'Booking Confirmed - Le Prestige Residency',
      body: `Dear ${booking.guestName}, your reservation (Ref: ${booking.bookingId}) for ${booking.roomName} from ${booking.checkIn} to ${booking.checkOut} has been confirmed. Total Paid: ₹${booking.total}.`,
      type: 'booking',
      read: false,
      metadata: {
        bookingId: booking.id,
        bookingRef: booking.bookingId,
        invoiceUrl: booking.invoiceUrl
      },
      createdAt: now
    };

    await ref.set(notification);
    logger.info(`Sent booking confirmation notification to ${booking.email}`, { bookingId: booking.bookingId });

    return notification;
  }
}
