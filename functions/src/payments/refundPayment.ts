import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { PaymentService } from '../../../services/payment.service';
import { formatErrorForClient } from '../../../firebase/errors';

export const refundPaymentFunction = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const isStaffOrAdmin =
      request.auth.token.role === 'admin' ||
      request.auth.token.role === 'staff' ||
      request.auth.token.admin === true;

    if (!isStaffOrAdmin) {
      throw new HttpsError('permission-denied', 'Only admin or staff can process refunds.');
    }

    const { bookingId, reason } = request.data || {};
    if (!bookingId || !reason) {
      throw new HttpsError('invalid-argument', 'bookingId and reason are required.');
    }

    const refund = await PaymentService.refundPayment(bookingId, reason);
    return { success: true, refund };
  } catch (error: any) {
    const formatted = formatErrorForClient(error);
    throw new HttpsError('internal', formatted.message, formatted);
  }
});
