export type UserRole = 'admin' | 'staff' | 'customer';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'refunded';



export type RoomStatus = 'available' | 'occupied' | 'maintenance';

export type DiscountType = 'percentage' | 'fixed';

export interface AdminUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'admin';
  phone?: string;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StaffUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'staff';
  phone?: string;
  branchId?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'customer';
  phone?: string;
  address?: string;
  idProofType?: string;
  idProofNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  name: string;
  slug: string;
  roomNumber: string;
  roomType: string;
  description: string;
  shortDescription: string;
  price: number;
  capacity: number;
  adults: number;
  children: number;
  area: string; // e.g. "350 sq ft"
  bedType: string; // e.g. "King Size"
  amenities: string[];
  images: string[];
  branchId: string;
  available: boolean;
  featured: boolean;
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RoomCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  maxAdults: number;
  maxChildren: number;
  amenities: string[];
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  bookingId: string;
  customerId?: string;
  guestName: string;
  email: string;
  phone: string;
  roomId: string;
  roomType?: string;
  roomName: string;
  branchId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  children: number;
  specialRequest?: string;
  roomRate: number;
  nights: number;
  subtotal: number;
  discount: number;
  couponCode?: string;
  tax: number;
  gst: number;
  total: number;
  bookingStatus: BookingStatus;
  createdAt: string;
  updatedAt: string;
}



export interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number; // percentage or fixed
  couponCode: string;
  bannerImage: string;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minimumAmount: number;
  maximumDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'rooms' | 'dining' | 'amenities' | 'exterior' | 'events';
  imageUrl: string;
  caption?: string;
  branchId?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  rating: number; // 1-5
  review: string;
  guestName: string;
  bookingId?: string;
  roomId?: string;
  customerId?: string;
  images?: string[];
  approved: boolean;
  createdAt: string;
}

export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image?: string;
  publishedAt: string;
  author: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  status: 'subscribed' | 'unsubscribed';
  createdAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export interface Amenity {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export interface Facility {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export interface AppNotification {
  id: string;
  recipientId?: string;
  recipientEmail?: string;
  title: string;
  body: string;
  type: 'booking' | 'offer' | 'system';
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SystemSettings {
  id: string;
  propertyName: string;
  gstPercentage: number;
  serviceTaxPercentage: number;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  cancellationPolicy: string;
  updatedAt: string;
}
