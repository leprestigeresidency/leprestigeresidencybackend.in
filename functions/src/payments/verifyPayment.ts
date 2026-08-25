import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { PaymentService } from '../../../services/payment.service';
import { formatErrorForClient } from '../../../firebase/errors';

export const verifyPaymentFunction = onCall(async (request) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = request.data || {};
    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new HttpsError('invalid-argument', 'All payment verification fields are required.');
    }

    const result = await PaymentService.verifyPayment(
      bookingId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    return result;
  } catch (error: any) {
    const formatted = formatErrorForClient(error);
    throw new HttpsError('unauthenticated', formatted.message, formatted);
  }
});
