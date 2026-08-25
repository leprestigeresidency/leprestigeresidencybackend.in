import { z } from 'zod';

export const offerSchema = z.object({
  title: z.string().min(2, 'Offer title is required'),
  description: z.string().min(5, 'Description is required'),
  discount: z.number().positive('Discount must be greater than 0'),
  couponCode: z.string().min(2, 'Coupon code is required'),
  bannerImage: z.string().url('Banner image must be a valid URL'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  active: z.boolean().default(true)
});

export const couponSchema = z.object({
  code: z.string().min(3, 'Coupon code must be at least 3 characters'),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive('Discount value must be greater than 0'),
  minimumAmount: z.number().min(0, 'Minimum amount cannot be negative'),
  maximumDiscount: z.number().positive().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  usageLimit: z.number().int().positive().optional(),
  usedCount: z.number().int().min(0).default(0),
  active: z.boolean().default(true)
});

export type OfferInput = z.infer<typeof offerSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
