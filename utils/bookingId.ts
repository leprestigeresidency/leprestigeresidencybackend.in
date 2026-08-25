import crypto from 'crypto';

/**
 * Generate human-readable booking ID format: LPR-YYYYMMDD-XXXX
 */
export function generateBookingId(): string {
  const prefix = 'LPR';
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomChars = crypto.randomBytes(3).toString('hex').toUpperCase();

  return `${prefix}-${dateStr}-${randomChars}`;
}
