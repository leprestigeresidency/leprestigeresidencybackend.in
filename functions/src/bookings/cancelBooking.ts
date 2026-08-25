import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { BookingService } from '../../../services/booking.service';
import { formatErrorForClient } from '../../../firebase/errors';

export const cancelBookingFunction = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const { bookingId, reason } = request.data || {};
    if (!bookingId) {
      throw new HttpsError('invalid-argument', 'bookingId is required.');
    }

    const booking = await BookingService.getBookingById(bookingId);

    // Verify ownership or staff/admin privileges
    const isOwner = booking.customerId === request.auth.uid || booking.email === request.auth.token.email;
    const isStaff = request.auth.token.role === 'staff' || request.auth.token.role === 'admin';

    if (!isOwner && !isStaff) {
      throw new HttpsError('permission-denied', 'You do not have permission to cancel this booking.');
    }

    const cancelledBooking = await BookingService.cancelBooking(bookingId, reason);
    return { success: true, booking: cancelledBooking };
  } catch (error: any) {
    const formatted = formatErrorForClient(error);
    throw new HttpsError('invalid-argument', formatted.message, formatted);
  }
});
