export const DEFAULT_GST_PERCENTAGE = 18; // 18% GST for hotel bookings in India
export const DEFAULT_CURRENCY = 'INR';

export const STORAGE_PATHS = {
  HERO: 'hero',
  ROOMS: 'rooms',
  GALLERY: 'gallery',
  OFFERS: 'offers',
  BRANCHES: 'branches',
  REVIEWS: 'reviews',
  INVOICES: 'invoices'
} as const;

export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  CUSTOMER: 'customer'
} as const;

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  AUTHORIZED: 'authorized',
  CAPTURED: 'captured'
} as const;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
