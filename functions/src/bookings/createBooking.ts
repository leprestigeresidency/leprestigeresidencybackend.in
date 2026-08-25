import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { BookingService } from '../../../services/booking.service';
import { formatErrorForClient } from '../../../firebase/errors';

export const createBookingFunction = onCall(async (request) => {
  try {
    const input = request.data;
    if (request.auth) {
      input.customerId = request.auth.uid;
    }

    const booking = await BookingService.createBooking(input);
    return { success: true, booking };
  } catch (error: any) {
    const formatted = formatErrorForClient(error);
    throw new HttpsError('aborted', formatted.message, formatted);
  }
});
