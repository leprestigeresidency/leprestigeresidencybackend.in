/**
 * Create URL-friendly slug from string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
}

/**
 * Clean undefined values from object before saving to Firestore
 */
export function sanitizeFirestoreData<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned as Partial<T>;
}

/**
 * Format timestamp to ISO string
 */
export function getIsoTimestamp(): string {
  return new Date().toISOString();
}
