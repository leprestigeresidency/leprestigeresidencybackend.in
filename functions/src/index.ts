import { checkAvailabilityFunction } from './bookings/checkAvailability';
import { createBookingFunction } from './bookings/createBooking';
import { cancelBookingFunction } from './bookings/cancelBooking';



import { generateInvoiceFunction } from './invoices/generateInvoice';
import { sendBookingConfirmationFunction } from './notifications/sendBookingConfirmation';

export const checkAvailability = checkAvailabilityFunction;
export const createBooking = createBookingFunction;
export const cancelBooking = cancelBookingFunction;



export const generateInvoice = generateInvoiceFunction;
export const sendBookingConfirmation = sendBookingConfirmationFunction;
