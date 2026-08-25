import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { BookingService } from '../../../services/booking.service';
import { generateInvoicePdfBuffer } from '../../../utils/invoice';
import { uploadAdminFile } from '../../../firebase/storage';
import { formatErrorForClient } from '../../../firebase/errors';

export const generateInvoiceFunction = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const { bookingId } = request.data || {};
    if (!bookingId) {
      throw new HttpsError('invalid-argument', 'bookingId is required.');
    }

    const booking = await BookingService.getBookingById(bookingId);

    // Verify permission
    const isOwner = booking.customerId === request.auth.uid || booking.email === request.auth.token.email;
    const isStaff = request.auth.token.role === 'staff' || request.auth.token.role === 'admin';

    if (!isOwner && !isStaff) {
      throw new HttpsError('permission-denied', 'Permission denied.');
    }

    const pdfBuffer = await generateInvoicePdfBuffer(booking);
    const invoiceFileName = `invoice_${booking.bookingId}.pdf`;
    const invoiceUrl = await uploadAdminFile('invoices', invoiceFileName, pdfBuffer, 'application/pdf');

    return { success: true, invoiceUrl };
  } catch (error: any) {
    const formatted = formatErrorForClient(error);
    throw new HttpsError('internal', formatted.message, formatted);
  }
});
