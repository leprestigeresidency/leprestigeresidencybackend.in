import { adminFirestore } from '../firebase/admin';

async function runSeed() {
  console.log('🌱 Seeding Physical Room Inventory via Admin API...');
  
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

  const batch = adminFirestore.batch();
  for (const room of rooms) {
    const docRef = adminFirestore.collection('rooms').doc();
    batch.set(docRef, room);
  }
  
  await batch.commit();

  console.log('🎉 Seeded ' + rooms.length + ' physical rooms!');
}

runSeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  });
