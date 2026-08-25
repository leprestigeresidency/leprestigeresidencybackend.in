import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { BookingService } from '../../../services/booking.service';
import { NotificationService } from '../../../services/notification.service';
import { formatErrorForClient } from '../../../firebase/errors';

export const sendBookingConfirmationFunction = onCall(async (request) => {
  try {
    const { bookingId } = request.data || {};
    if (!bookingId) {
      throw new HttpsError('invalid-argument', 'bookingId is required.');
    }

    const booking = await BookingService.getBookingById(bookingId);
    const notification = await NotificationService.sendBookingConfirmation(booking);

    return { success: true, notification };
  } catch (error: any) {
    const formatted = formatErrorForClient(error);
    throw new HttpsError('internal', formatted.message, formatted);
  }
});
