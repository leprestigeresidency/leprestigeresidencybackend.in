import * as admin from 'firebase-admin';

// Connect to Emulator if FIRESTORE_EMULATOR_HOST is set, or initialize Firebase Admin
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log(`📡 Connecting to Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'leprestigeresidency-87e1f',
  });
}

const db = admin.firestore();

export const seedRooms = [
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

export const seedOffers = [
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

export const seedUsers = [
  {
    uid: 'user-admin-01',
    email: 'admin@leprestige.com',
    displayName: 'General Manager',
    role: 'admin',
    phone: '+91 9876543210',
  },
  {
    uid: 'user-staff-01',
    email: 'staff@leprestige.com',
    displayName: 'Front Desk Reception',
    role: 'staff',
    phone: '+91 9876543211',
  },
];

async function runSeed() {
  console.log('🌱 Seeding database...');

  // Seed Rooms
  for (const room of seedRooms) {
    const { id, ...data } = room;
    await db.collection('rooms').doc(id).set(data, { merge: true });
    console.log(`  ✓ Room seeded: ${room.name} (${room.roomNumber})`);
  }

  // Seed Offers
  for (const offer of seedOffers) {
    const { id, ...data } = offer;
    await db.collection('offers').doc(id).set(data, { merge: true });
    console.log(`  ✓ Offer seeded: ${offer.code}`);
  }

  // Seed Users
  for (const user of seedUsers) {
    const { uid, ...data } = user;
    await db.collection('users').doc(uid).set(data, { merge: true });
    console.log(`  ✓ User seeded: ${user.email} (${user.role})`);
  }

  console.log('🎉 Database seeding complete!');
}

if (require.main === module) {
  runSeed().catch((err) => {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  });
}
