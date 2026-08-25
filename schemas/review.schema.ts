import { z } from 'zod';

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  review: z.string().min(10, 'Review must be at least 10 characters long'),
  guestName: z.string().min(2, 'Guest name is required'),
  bookingId: z.string().optional(),
  roomId: z.string().optional(),
  customerId: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  approved: z.boolean().default(false)
});

export type ReviewInput = z.infer<typeof reviewSchema>;
