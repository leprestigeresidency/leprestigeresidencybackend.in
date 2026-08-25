import { validateDateRange, validateEmail, validatePositivePrice } from '../firebase/validators';
import { createBookingSchema } from '../schemas/booking.schema';
import { roomSchema } from '../schemas/room.schema';
import { razorpayOrderSchema, verifyPaymentSchema } from '../schemas/payment.schema';

describe('Backend Validators & Schemas', () => {
  test('validateDateRange throws error if checkOut <= checkIn', () => {
    expect(() => validateDateRange('2026-08-15', '2026-08-10')).toThrow();
    expect(() => validateDateRange('2026-08-10', '2026-08-10')).toThrow();
    expect(() => validateDateRange('2026-08-10', '2026-08-12')).not.toThrow();
  });

  test('validateEmail checks email formatting', () => {
    expect(validateEmail('guest@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
  });

  test('createBookingSchema validates booking inputs', () => {
    const validBooking = {
      guestName: 'John Doe',
      email: 'john@example.com',
      phone: '9876543210',
      roomId: 'room_123',
      branchId: 'branch_main',
      checkIn: '2026-09-01',
      checkOut: '2026-09-05',
      adults: 2,
      children: 1
    };

    const parsed = createBookingSchema.parse(validBooking);
    expect(parsed.guestName).toBe('John Doe');
    expect(parsed.adults).toBe(2);
  });

  test('verifyPaymentSchema validates razorpay payload', () => {
    const payload = {
      bookingId: 'bk_123',
      razorpayOrderId: 'order_123',
      razorpayPaymentId: 'pay_123',
      razorpaySignature: 'sig_123'
    };

    expect(() => verifyPaymentSchema.parse(payload)).not.toThrow();
  });
});
