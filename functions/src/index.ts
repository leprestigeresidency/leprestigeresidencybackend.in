import { checkAvailabilityFunction } from './bookings/checkAvailability';
import { createBookingFunction } from './bookings/createBooking';
import { cancelBookingFunction } from './bookings/cancelBooking';

import { createRazorpayOrderFunction } from './payments/createRazorpayOrder';
import { verifyPaymentFunction } from './payments/verifyPayment';
import { razorpayWebhookFunction } from './payments/razorpayWebhook';
import { refundPaymentFunction } from './payments/refundPayment';

import { generateInvoiceFunction } from './invoices/generateInvoice';
import { sendBookingConfirmationFunction } from './notifications/sendBookingConfirmation';

export const checkAvailability = checkAvailabilityFunction;
export const createBooking = createBookingFunction;
export const cancelBooking = cancelBookingFunction;

export const createRazorpayOrder = createRazorpayOrderFunction;
export const verifyPayment = verifyPaymentFunction;
export const razorpayWebhook = razorpayWebhookFunction;
export const refundPayment = refundPaymentFunction;

export const generateInvoice = generateInvoiceFunction;
export const sendBookingConfirmation = sendBookingConfirmationFunction;
