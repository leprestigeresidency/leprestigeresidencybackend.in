import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { PaymentService } from '../../../services/payment.service';
import { formatErrorForClient } from '../../../firebase/errors';

export const createRazorpayOrderFunction = onCall(async (request) => {
  try {
    const { bookingId } = request.data || {};
    if (!bookingId) {
      throw new HttpsError('invalid-argument', 'bookingId is required.');
    }

    const orderData = await PaymentService.createRazorpayOrder(bookingId);
    return { success: true, ...orderData };
  } catch (error: any) {
    const formatted = formatErrorForClient(error);
    throw new HttpsError('internal', formatted.message, formatted);
  }
});
