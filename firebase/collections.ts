export const COLLECTIONS = {
  ADMINS: 'admins',
  STAFF: 'staff',
  CUSTOMERS: 'customers',
  ROOMS: 'rooms',
  ROOM_CATEGORIES: 'room_categories',
  BRANCHES: 'branches',
  BOOKINGS: 'bookings',
  PAYMENTS: 'payments',
  OFFERS: 'offers',
  GALLERY: 'gallery',
  REVIEWS: 'reviews',
  NEWS: 'news',
  CONTACT_MESSAGES: 'contact_messages',
  NEWSLETTER: 'newsletter',
  FAQ: 'faq',
  AMENITIES: 'amenities',
  FACILITIES: 'facilities',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
  COUPONS: 'coupons',
  WEBHOOK_EVENTS: 'webhook_events'
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
