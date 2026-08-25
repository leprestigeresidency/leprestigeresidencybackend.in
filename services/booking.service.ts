import { adminFirestore } from '../firebase/admin';
import { COLLECTIONS } from '../firebase/collections';
import { Booking, BookingStatus } from '../firebase/types';
import { createBookingSchema, CreateBookingInput } from '../schemas/booking.schema';
import { RoomService } from './room.service';
import { OfferService } from './offer.service';
import { generateBookingId } from '../utils/bookingId';
import { calculateNights, doDateRangesOverlap, getTodayDateString } from '../utils/date';
import { DEFAULT_GST_PERCENTAGE } from '../firebase/constants';
import {
  RoomUnavailableError,
  ValidationError,
  NotFoundError,
  BookingFailedError
} from '../firebase/errors';

export class BookingService {
  /**
   * Check room availability for given dates
   */
  static async checkRoomAvailability(
    roomId: string,
    checkIn: string,
    checkOut: string,
    excludeBookingId?: string
  ): Promise<boolean> {
    if (checkOut <= checkIn) {
      throw new ValidationError('Check-out date must be strictly after check-in date.');
    }

    const today = getTodayDateString();
    if (checkIn < today) {
      throw new ValidationError('Check-in date cannot be in the past.');
    }

    // Ensure room exists and is marked available
    const room = await RoomService.getRoomById(roomId);
    if (!room.available || room.status !== 'available') {
      return false;
    }

    // Query active bookings for this room
    const snap = await adminFirestore
      .collection(COLLECTIONS.BOOKINGS)
      .where('roomId', '==', roomId)
      .where('bookingStatus', 'in', ['pending', 'confirmed', 'checked_in'])
      .get();

    for (const doc of snap.docs) {
      if (excludeBookingId && doc.id === excludeBookingId) continue;
      const existing = doc.data() as Booking;

      if (doDateRangesOverlap(checkIn, checkOut, existing.checkIn, existing.checkOut)) {
        return false; // Overlap found
      }
    }

    return true;
  }

  /**
   * Create Booking inside a Firestore Transaction to guarantee double-booking prevention
   */
  static async createBooking(input: CreateBookingInput): Promise<Booking> {
    const validated = createBookingSchema.parse(input);

    const nights = calculateNights(validated.checkIn, validated.checkOut);
    if (nights <= 0) {
      throw new ValidationError('Check-out date must be after check-in date.');
    }

    // Execute in transaction for concurrency safety
    return await adminFirestore.runTransaction(async (transaction) => {
      // 1. Fetch Room inside transaction
      const roomRef = adminFirestore.collection(COLLECTIONS.ROOMS).doc(validated.roomId);
      const roomDoc = await transaction.get(roomRef);

      if (!roomDoc.exists) {
        throw new NotFoundError(`Room with ID ${validated.roomId}`);
      }

      const room = roomDoc.data() as any;
      if (!room.available || room.status !== 'available') {
        throw new RoomUnavailableError('Room is currently unavailable or under maintenance.');
      }

      // Check capacity
      if (validated.adults > room.adults) {
        throw new ValidationError(`Adult count exceeds room capacity of ${room.adults}.`);
      }

      // 2. Check overlapping active bookings
      const bookingsQuery = adminFirestore
        .collection(COLLECTIONS.BOOKINGS)
        .where('roomId', '==', validated.roomId)
        .where('bookingStatus', 'in', ['pending', 'confirmed', 'checked_in']);

      const existingSnap = await transaction.get(bookingsQuery);

      for (const doc of existingSnap.docs) {
        const existing = doc.data() as Booking;
        if (
          doDateRangesOverlap(
            validated.checkIn,
            validated.checkOut,
            existing.checkIn,
            existing.checkOut
          )
        ) {
          throw new RoomUnavailableError(
            'Room is already booked for the selected dates. Please choose different dates or another room.'
          );
        }
      }

      // 3. SERVER-SIDE PRICE CALCULATION (Never trust frontend amounts!)
      const roomRate = room.price;
      const subtotal = roomRate * nights;

      let discount = 0;
      if (validated.couponCode) {
        discount = await OfferService.validateAndCalculateCouponDiscount(
          validated.couponCode,
          subtotal
        );
      }

      const discountedSubtotal = Math.max(0, subtotal - discount);
      const tax = Math.round((discountedSubtotal * DEFAULT_GST_PERCENTAGE) / 100);
      const gst = 0; // Included in tax
      const total = discountedSubtotal + tax;

      const bookingRef = adminFirestore.collection(COLLECTIONS.BOOKINGS).doc();
      const bookingId = generateBookingId();
      const now = new Date().toISOString();

      const bookingData: Booking = {
        id: bookingRef.id,
        bookingId,
        customerId: validated.customerId,
        guestName: validated.guestName,
        email: validated.email.toLowerCase(),
        phone: validated.phone,
        roomId: validated.roomId,
        roomName: room.name,
        branchId: validated.branchId,
        checkIn: validated.checkIn,
        checkOut: validated.checkOut,
        adults: validated.adults,
        children: validated.children,
        specialRequest: validated.specialRequest || '',
        roomRate,
        nights,
        subtotal,
        discount,
        couponCode: validated.couponCode || undefined,
        tax,
        gst,
        total,
        paymentStatus: 'pending',
        bookingStatus: 'pending',
        createdAt: now,
        updatedAt: now
      };

      transaction.set(bookingRef, bookingData);

      // Update the room to be occupied immediately to lock it in real-time
      transaction.update(roomRef, {
        status: 'occupied',
        available: false,
        updatedAt: now
      });

      return bookingData;
    });
  }

  /**
   * Get booking by ID
   */
  static async getBookingById(id: string): Promise<Booking> {
    const doc = await adminFirestore.collection(COLLECTIONS.BOOKINGS).doc(id).get();
    if (!doc.exists) {
      throw new NotFoundError(`Booking ${id}`);
    }
    return { id: doc.id, ...doc.data() } as Booking;
  }

  /**
   * Get booking by human-readable Booking Reference ID
   */
  static async getBookingByReference(bookingId: string): Promise<Booking> {
    const snap = await adminFirestore
      .collection(COLLECTIONS.BOOKINGS)
      .where('bookingId', '==', bookingId)
      .limit(1)
      .get();

    if (snap.empty) {
      throw new NotFoundError(`Booking with reference '${bookingId}'`);
    }
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as Booking;
  }

  /**
   * Update booking status
   */
  static async updateBookingStatus(
    id: string,
    status: BookingStatus,
    razorpayInfo?: { razorpayOrderId?: string; razorpayPaymentId?: string; invoiceUrl?: string }
  ): Promise<Booking> {
    const booking = await this.getBookingById(id);
    const now = new Date().toISOString();

    const updates: Partial<Booking> = {
      bookingStatus: status,
      updatedAt: now,
      ...(razorpayInfo?.razorpayOrderId ? { razorpayOrderId: razorpayInfo.razorpayOrderId } : {}),
      ...(razorpayInfo?.razorpayPaymentId ? { razorpayPaymentId: razorpayInfo.razorpayPaymentId } : {}),
      ...(razorpayInfo?.invoiceUrl ? { invoiceUrl: razorpayInfo.invoiceUrl } : {})
    };

    if (status === 'confirmed' && booking.paymentStatus === 'pending') {
      updates.paymentStatus = 'paid';
    }

    await adminFirestore.collection(COLLECTIONS.BOOKINGS).doc(id).update(updates);
    return { ...booking, ...updates };
  }

  /**
   * Cancel booking
   */
  static async cancelBooking(id: string, reason?: string): Promise<Booking> {
    const booking = await this.getBookingById(id);

    if (booking.bookingStatus === 'cancelled') {
      throw new BookingFailedError('Booking is already cancelled.');
    }
    if (booking.bookingStatus === 'checked_out') {
      throw new BookingFailedError('Cannot cancel a completed booking.');
    }

    return await this.updateBookingStatus(id, 'cancelled');
  }

  /**
   * List bookings for admin/staff or specific customer
   */
  static async getBookings(filters?: {
    customerId?: string;
    email?: string;
    status?: BookingStatus;
    roomId?: string;
  }): Promise<Booking[]> {
    let query: FirebaseFirestore.Query = adminFirestore.collection(COLLECTIONS.BOOKINGS);

    if (filters?.customerId) {
      query = query.where('customerId', '==', filters.customerId);
    }
    if (filters?.email) {
      query = query.where('email', '==', filters.email.toLowerCase());
    }
    if (filters?.status) {
      query = query.where('bookingStatus', '==', filters.status);
    }
    if (filters?.roomId) {
      query = query.where('roomId', '==', filters.roomId);
    }

    const snap = await query.get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
  }
}
