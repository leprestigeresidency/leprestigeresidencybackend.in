/**
 * Convert Rupees (INR) to Paise (lowest currency subunit for Razorpay)
 */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert Paise to Rupees (INR)
 */
export function toRupees(paise: number): number {
  return paise / 100;
}

/**
 * Format currency amount into INR string representation
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
}
