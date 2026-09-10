import { z } from 'zod';

export const createBookingSchema = z.object({
  guestName: z.string().min(2, 'Guest name must be at least 2 characters').optional().or(z.string().default('Guest')),
  email: z.string().email('Invalid email address').optional().or(z.string().default('guest@example.com')),
  phone: z.string().min(1, 'Phone number must be at least 10 digits').optional().or(z.string().default('9876543210')),
  roomType: z.string().min(1, 'Room Type is required'),
  branch: z.string().min(1, 'Branch is required'),
  checkIn: z.string(),
  checkOut: z.string(),
  adults: z.number().int().min(1, 'At least 1 adult is required'),
  children: z.number().int().min(0, 'Children cannot be negative'),
  specialRequest: z.string().optional(),
  couponCode: z.string().optional(),
  customerId: z.string().optional(),
  guestDetails: z.any().optional(),
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
