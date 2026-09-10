import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { BookingService } from '../../../services/booking.service';
import { formatErrorForClient } from '../../../firebase/errors';

export const checkAvailabilityFunction = onCall(async (request) => {
  try {
    const { roomType, branch, checkIn, checkOut } = request.data || {};
    if (!roomType || !branch || !checkIn || !checkOut) {
      throw new HttpsError('invalid-argument', 'roomType, branch, checkIn, and checkOut are required.');
    }

    const res = await BookingService.checkRoomAvailability(roomType, branch, checkIn, checkOut);
    return { available: res.available, availableCount: res.availableCount, roomType, branch, checkIn, checkOut };
  } catch (error: any) {
    const formatted = formatErrorForClient(error);
    throw new HttpsError('failed-precondition', formatted.message, formatted);
  }
});
