import { z } from 'zod';

export const customerSchema = z.object({
  uid: z.string().min(1, 'UID is required'),
  email: z.string().email('Invalid email address'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  phone: z.string().optional(),
  address: z.string().optional(),
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional()
});

export const updateCustomerSchema = customerSchema.partial().omit({ uid: true });

export type CustomerInput = z.infer<typeof customerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
