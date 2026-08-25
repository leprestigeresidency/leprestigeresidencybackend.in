import { z } from 'zod';

export const createBookingSchema = z.object({
  guestName: z.string().min(2, 'Guest name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  roomId: z.string().min(1, 'Room ID is required'),
  branchId: z.string().min(1, 'Branch ID is required'),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-in must be YYYY-MM-DD format'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-out must be YYYY-MM-DD format'),
  adults: z.number().int().min(1, 'At least 1 adult is required'),
  children: z.number().int().min(0, 'Children cannot be negative'),
  specialRequest: z.string().optional(),
  couponCode: z.string().optional(),
  customerId: z.string().optional()
});

export const updateBookingStatusSchema = z.object({
  bookingStatus: z.enum([
    'pending',
    'confirmed',
    'checked_in',
    'checked_out',
    'cancelled',
    'refunded'
  ]),
  cancellationReason: z.string().optional()
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
