import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { BookingService } from '../../../services/booking.service';
import { formatErrorForClient } from '../../../firebase/errors';

export const checkAvailabilityFunction = onCall(async (request) => {
  try {
    const { roomId, checkIn, checkOut } = request.data || {};
    if (!roomId || !checkIn || !checkOut) {
      throw new HttpsError('invalid-argument', 'roomId, checkIn, and checkOut are required.');
    }

    const available = await BookingService.checkRoomAvailability(roomId, checkIn, checkOut);
    return { available, roomId, checkIn, checkOut };
  } catch (error: any) {
    const formatted = formatErrorForClient(error);
    throw new HttpsError('failed-precondition', formatted.message, formatted);
  }
});
