import { calculateNights, doDateRangesOverlap } from '../utils/date';
import { toPaise, toRupees, formatINR } from '../utils/currency';
import { generateBookingId } from '../utils/bookingId';

describe('Date and Currency Utilities', () => {
  test('calculateNights calculates stay duration in nights', () => {
    expect(calculateNights('2026-08-10', '2026-08-15')).toBe(5);
    expect(calculateNights('2026-08-10', '2026-08-11')).toBe(1);
    expect(calculateNights('2026-08-10', '2026-08-10')).toBe(0);
  });

  test('doDateRangesOverlap accurately detects overlaps', () => {
    // Range A: Aug 10 - Aug 15
    // Range B: Aug 12 - Aug 17 (Overlap)
    expect(doDateRangesOverlap('2026-08-10', '2026-08-15', '2026-08-12', '2026-08-17')).toBe(true);

    // Range C: Aug 15 - Aug 20 (No overlap: check-out of A = check-in of C)
    expect(doDateRangesOverlap('2026-08-10', '2026-08-15', '2026-08-15', '2026-08-20')).toBe(false);

    // Range D: Aug 05 - Aug 10 (No overlap: check-out of D = check-in of A)
    expect(doDateRangesOverlap('2026-08-10', '2026-08-15', '2026-08-05', '2026-08-10')).toBe(false);
  });

  test('toPaise and toRupees currency conversion', () => {
    expect(toPaise(5000)).toBe(500000);
    expect(toRupees(500000)).toBe(5000);
    expect(formatINR(5000)).toContain('5,000');
  });

  test('generateBookingId produces LPR formatted unique ID', () => {
    const id = generateBookingId();
    expect(id).toMatch(/^LPR-\d{8}-[A-Z0-9]{6}$/);
  });
});
