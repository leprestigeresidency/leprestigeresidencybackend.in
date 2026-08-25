import { ValidationError } from './errors';

export function validateDateRange(checkIn: string, checkOut: string): void {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);

  if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
    throw new ValidationError('Invalid check-in or check-out date format. Use YYYY-MM-DD.');
  }

  if (outDate <= inDate) {
    throw new ValidationError('Check-out date must be strictly after check-in date.');
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

export function validatePositivePrice(price: number, fieldName: string = 'Price'): void {
  if (typeof price !== 'number' || isNaN(price) || price <= 0) {
    throw new ValidationError(`${fieldName} must be a positive number.`);
  }
}
