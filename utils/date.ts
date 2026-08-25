/**
 * Calculate total number of nights between check-in and check-out
 */
export function calculateNights(checkInStr: string, checkOutStr: string): number {
  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);

  const diffTime = checkOut.getTime() - checkIn.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

/**
 * Check if two date ranges overlap
 * Overlap occurs if (startA < endB) and (endA > startB)
 */
export function doDateRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aStart = new Date(startA).getTime();
  const aEnd = new Date(endA).getTime();
  const bStart = new Date(startB).getTime();
  const bEnd = new Date(endB).getTime();

  return aStart < bEnd && aEnd > bStart;
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}
