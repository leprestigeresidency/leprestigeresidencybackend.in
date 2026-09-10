import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, connectFirestoreEmulator, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDVQsA2A0j_aw1XG2NsE83OFkEDdP-VW_I",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "leprestigeresidency-87e1f.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "leprestigeresidency-87e1f",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "leprestigeresidency-87e1f.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "545155829013",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:545155829013:web:3f01dbf63680baa498ad1c",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

if (process.env.FIRESTORE_EMULATOR_HOST || process.env.VITE_USE_EMULATORS === 'true') {
  const hostport = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  const [host, port] = hostport.split(':');
  connectFirestoreEmulator(db, host || 'localhost', parseInt(port || '8080', 10));
  console.log(`📡 Connected to Firestore Emulator`);
}

async function runSeed() {
  console.log('🌱 Seeding Physical Room Inventory...');
  
  const rooms = [];
  
  // Pondicherry (20 Deluxe, 2 Twin)
  for (let i = 1; i <= 20; i++) {
    rooms.push({
      roomNumber: `1${i.toString().padStart(2, '0')}`,
      name: `Deluxe ${i}`,
      type: 'Deluxe',
      branchId: 'Pondicherry',
      basePrice: 4500,
      active: true,
      status: 'Available',
      createdAt: new Date().toISOString()
    });
  }
  for (let i = 1; i <= 2; i++) {
    rooms.push({
      roomNumber: `2${i.toString().padStart(2, '0')}`,
      name: `Twin ${i}`,
      type: 'Twin',
      branchId: 'Pondicherry',
      basePrice: 4000,
      active: true,
      status: 'Available',
      createdAt: new Date().toISOString()
    });
  }
  
  // Tindivanam (12 Superior, 5 Premium)
  for (let i = 1; i <= 12; i++) {
    rooms.push({
      roomNumber: `T1${i.toString().padStart(2, '0')}`,
      name: `Superior Room ${i}`,
      type: 'Superior',
      branchId: 'Tindivanam',
      basePrice: 3800,
      active: true,
      status: 'Available',
      createdAt: new Date().toISOString()
    });
  }
  for (let i = 1; i <= 5; i++) {
    rooms.push({
      roomNumber: `T2${i.toString().padStart(2, '0')}`,
      name: `Premium Room ${i}`,
      type: 'Premium',
      branchId: 'Tindivanam',
      basePrice: 3500,
      active: true,
      status: 'Available',
      createdAt: new Date().toISOString()
    });
  }

  for (const room of rooms) {
    const docRef = doc(collection(db, 'rooms'));
    await setDoc(docRef, room, { merge: true });
  }

  console.log('🎉 Seeded ' + rooms.length + ' physical rooms!');
}

runSeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  });
