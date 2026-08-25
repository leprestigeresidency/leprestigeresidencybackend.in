import { z } from 'zod';

export const roomSchema = z.object({
  name: z.string().min(2, 'Room name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug is required'),
  roomNumber: z.string().min(1, 'Room number is required'),
  roomType: z.string().min(1, 'Room type is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().min(5, 'Short description is required'),
  price: z.number().positive('Price must be greater than 0'),
  capacity: z.number().int().positive('Capacity must be at least 1'),
  adults: z.number().int().positive('Adults capacity must be at least 1'),
  children: z.number().int().min(0, 'Children capacity cannot be negative'),
  area: z.string().min(1, 'Room area is required'),
  bedType: z.string().min(1, 'Bed type is required'),
  amenities: z.array(z.string()),
  images: z.array(z.string().url('Invalid image URL')),
  branchId: z.string().min(1, 'Branch ID is required'),
  available: z.boolean().default(true),
  featured: z.boolean().default(false),
  status: z.enum(['available', 'occupied', 'maintenance']).default('available')
});

export const updateRoomSchema = roomSchema.partial();

export type RoomInput = z.infer<typeof roomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
