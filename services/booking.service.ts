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
  static async checkRoomAvailability(
    roomType: string,
    branch: string,
    checkIn: string,
    checkOut: string,
    excludeBookingId?: string
  ): Promise<{ available: boolean, availableCount: number }> {
    if (checkOut <= checkIn) {
      throw new ValidationError('Check-out date must be strictly after check-in date.');
    }

    const today = getTodayDateString();
    if (checkIn < today) {
      throw new ValidationError('Check-in date cannot be in the past.');
    }

    // 1. Find all active physical rooms of this type/branch
    const roomsSnap = await adminFirestore
      .collection(COLLECTIONS.ROOMS)
      .where('branchId', '==', branch)
      .where('type', '==', roomType)
      .where('active', '==', true)
      .get();

    if (roomsSnap.empty) {
      return { available: false, availableCount: 0 };
    }

    const physicalRooms = roomsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    // 2. Query active bookings matching these criteria
    const bookingsSnap = await adminFirestore
      .collection(COLLECTIONS.BOOKINGS)
      .where('branchId', '==', branch)
      .where('roomType', '==', roomType) // Ensure bookings store roomType
      .where('bookingStatus', 'in', ['pending', 'confirmed', 'checked_in'])
      .get();

    // 3. Filter overlapping bookings
    const overlappingBookings = bookingsSnap.docs.map(doc => {
      if (excludeBookingId && doc.id === excludeBookingId) return null;
      const b = doc.data() as any;
      if (doDateRangesOverlap(checkIn, checkOut, b.checkIn, b.checkOut)) {
        return b;
      }
      return null;
    }).filter(b => b !== null);

    const availableCount = physicalRooms.length - overlappingBookings.length;
    return { available: availableCount > 0, availableCount: Math.max(0, availableCount) };
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
      // 1. Fetch physical rooms of this type
      const roomsQuery = adminFirestore.collection(COLLECTIONS.ROOMS)
        .where('type', '==', validated.roomType)
        .where('branchId', '==', validated.branch)
        .where('active', '==', true);
      
      const roomsSnap = await transaction.get(roomsQuery);
      if (roomsSnap.empty) {
        throw new NotFoundError(`Room type ${validated.roomType} in ${validated.branch}`);
      }

      const physicalRooms = roomsSnap.docs.map(d => ({ id: d.id, ref: d.ref, data: d.data() as any }));

      // 2. Check overlapping active bookings
      const bookingsQuery = adminFirestore
        .collection(COLLECTIONS.BOOKINGS)
        .where('branchId', '==', validated.branch)
        .where('roomType', '==', validated.roomType)
        .where('bookingStatus', 'in', ['pending', 'confirmed', 'checked_in']);

      const existingSnap = await transaction.get(bookingsQuery);
      let overlappingCount = 0;
      
      const bookedRoomIds = new Set<string>();

      for (const doc of existingSnap.docs) {
        const existing = doc.data() as any;
        if (doDateRangesOverlap(validated.checkIn, validated.checkOut, existing.checkIn, existing.checkOut)) {
          overlappingCount++;
          if (existing.roomId) bookedRoomIds.add(existing.roomId);
        }
      }
      
      if (overlappingCount >= physicalRooms.length) {
        throw new RoomUnavailableError(
          'Room is already fully booked for the selected dates. Please choose different dates or another room type.'
        );
      }

      // Assign an available specific physical room
      const availableRoom = physicalRooms.find(r => !bookedRoomIds.has(r.id));
      if (!availableRoom) {
         throw new RoomUnavailableError('Unexpected error: No specific physical room available.');
      }

      const room = availableRoom.data;

      // 3. SERVER-SIDE PRICE CALCULATION (Never trust frontend amounts!)
      const roomRate = room.basePrice || 3000;
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

      const bookingStatus = "confirmed";

      const bookingData: Booking = {
        id: bookingRef.id,
        bookingId,
        customerId: validated.customerId,
        guestName: validated.guestName || "Guest",
        email: (validated.email || "guest@example.com").toLowerCase(),
        phone: validated.phone || "9876543210",
        roomId: availableRoom.id,
        roomType: validated.roomType,
        roomName: room.name,
        branchId: validated.branch,
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
        bookingStatus,
        createdAt: now,
        updatedAt: now
      };

      transaction.set(bookingRef, bookingData as any);

      // We do NOT mark the physical room as 'unavailable' unless it's a permanent status update, 
      // because rooms can have multiple non-overlapping bookings.
      
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
    status: BookingStatus
  ): Promise<Booking> {
    const booking = await this.getBookingById(id);
    const now = new Date().toISOString();

    const updates: Partial<Booking> = {
      bookingStatus: status,
      updatedAt: now
    };

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
