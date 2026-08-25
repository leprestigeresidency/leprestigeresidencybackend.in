import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDVQsA2A0j_aw1XG2NsE83OFkEDdP-VW_I",
  authDomain: "leprestigeresidency-87e1f.firebaseapp.com",
  projectId: "leprestigeresidency-87e1f",
  storageBucket: "leprestigeresidency-87e1f.firebasestorage.app",
  messagingSenderId: "545155829013",
  appId: "1:545155829013:web:3f01dbf63680baa498ad1c",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

if (process.env.FIRESTORE_EMULATOR_HOST) {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  connectFirestoreEmulator(db, host || 'localhost', parseInt(port || '8080', 10));
  console.log(`📡 Client script connected to Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

const seedRooms = [
  {
    id: 'room-deluxe-101',
    roomNumber: '101',
    name: 'Deluxe King Room',
    type: 'Deluxe',
    branch: 'Puducherry',
    basePrice: 3000,
    maxAdults: 2,
    maxChildren: 1,
    status: 'AVAILABLE',
    description: 'Elegantly appointed Deluxe Room featuring a king bed, warm ambient lighting, marble bathroom, and high-speed Wi-Fi.',
    features: ['Free High-Speed Wi-Fi', 'King Size Bed', '43-inch Smart TV', 'Mini Bar', 'Climate Control', '24/7 Room Service'],
    images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80'],
    active: true,
  },
  {
    id: 'room-twin-201',
    roomNumber: '201',
    name: 'Luxury Twin Room',
    type: 'Twin',
    branch: 'Puducherry',
    basePrice: 3500,
    maxAdults: 2,
    maxChildren: 2,
    status: 'AVAILABLE',
    description: 'Spacious suite with twin single beds, ergonomic work desk, premium linens, and quiet garden courtyard view.',
    features: ['Free High-Speed Wi-Fi', 'Twin Beds', 'Work Desk & Chair', 'Espresso Machine', 'Luxury Toiletries', 'Daily Housekeeping'],
    images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'],
    active: true,
  },
  {
    id: 'room-suite-301',
    roomNumber: '301',
    name: 'Presidential Suite',
    type: 'Suite',
    branch: 'Puducherry',
    basePrice: 6500,
    maxAdults: 3,
    maxChildren: 2,
    status: 'AVAILABLE',
    description: 'Opulent suite featuring a separate living room, plush king bed, private balcony, and personal concierge service.',
    features: ['Free High-Speed Wi-Fi', 'Private Balcony', 'Jacuzzi Bath', 'Living Lounge Area', 'Butler Service', 'Complimentary Breakfast'],
    images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'],
    active: true,
  },
];

const seedOffers = [
  {
    id: 'offer-welcome10',
    code: 'WELCOME10',
    description: '10% discount on first reservation',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minNights: 1,
    active: true,
  },
  {
    id: 'offer-prestige20',
    code: 'PRESTIGE20',
    description: '20% discount on stays of 3 nights or more',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minNights: 3,
    active: true,
  },
];

const seedUsers = [
  {
    id: 'user-admin-01',
    email: 'admin@leprestige.com',
    displayName: 'General Manager',
    role: 'admin',
    phone: '+91 9876543210',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-customer-01',
    email: 'customer@example.com',
    displayName: 'John Doe',
    role: 'customer',
    phone: '+91 9876543212',
    createdAt: new Date().toISOString(),
  },
];

const seedBookings = [
  {
    id: 'booking-001',
    roomId: 'room-deluxe-101',
    userId: 'user-customer-01',
    checkIn: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    checkOut: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days later
    guests: { adults: 2, children: 0 },
    totalAmount: 6000,
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    createdAt: new Date().toISOString(),
  }
];

const seedPayments = [
  {
    id: 'payment-001',
    bookingId: 'booking-001',
    amount: 6000,
    currency: 'INR',
    method: 'CARD',
    status: 'SUCCESS',
    transactionId: 'txn_1234567890',
    createdAt: new Date().toISOString(),
  }
];

const seedReviews = [
  {
    id: 'review-001',
    userId: 'user-customer-01',
    userName: 'John Doe',
    roomId: 'room-deluxe-101',
    rating: 5,
    comment: 'Excellent stay! Very clean and hygienic.',
    createdAt: new Date().toISOString(),
    status: 'APPROVED'
  }
];

const seedContacts = [
  {
    id: 'contact-001',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+91 9876543213',
    subject: 'Corporate Booking Enquiry',
    message: 'We are looking to book 5 rooms for our corporate event.',
    status: 'NEW',
    createdAt: new Date().toISOString(),
  }
];

async function runSeed() {
  console.log('🌱 Seeding database via Client SDK...');

  for (const room of seedRooms) {
    const { id, ...data } = room;
    await setDoc(doc(db, 'rooms', id), data, { merge: true });
    console.log(`  ✓ Room seeded: ${room.name} (${room.roomNumber})`);
  }

  for (const offer of seedOffers) {
    const { id, ...data } = offer;
    await setDoc(doc(db, 'offers', id), data, { merge: true });
    console.log(`  ✓ Offer seeded: ${offer.code}`);
  }

  for (const user of seedUsers) {
    const { id, ...data } = user;
    await setDoc(doc(db, 'users', id), data, { merge: true });
    console.log(`  ✓ User seeded: ${user.email}`);
  }

  for (const booking of seedBookings) {
    const { id, ...data } = booking;
    await setDoc(doc(db, 'bookings', id), data, { merge: true });
    console.log(`  ✓ Booking seeded: ${booking.id}`);
  }

  for (const payment of seedPayments) {
    const { id, ...data } = payment;
    await setDoc(doc(db, 'payments', id), data, { merge: true });
    console.log(`  ✓ Payment seeded: ${payment.id}`);
  }

  for (const review of seedReviews) {
    const { id, ...data } = review;
    await setDoc(doc(db, 'reviews', id), data, { merge: true });
    console.log(`  ✓ Review seeded: ${review.id}`);
  }

  for (const contact of seedContacts) {
    const { id, ...data } = contact;
    await setDoc(doc(db, 'contact', id), data, { merge: true });
    console.log(`  ✓ Contact seeded: ${contact.id}`);
  }

  console.log('🎉 Database seeding complete!');
}

runSeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  });
