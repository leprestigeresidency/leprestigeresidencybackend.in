import { z } from 'zod';

export const razorpayOrderSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  amount: z.number().positive('Amount must be positive')
});

export const verifyPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  razorpayOrderId: z.string().min(1, 'Razorpay Order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay Payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay Signature is required')
});

export const refundPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  reason: z.string().min(3, 'Refund reason is required'),
  amount: z.number().positive().optional()
});

export type RazorpayOrderInput = z.infer<typeof razorpayOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
