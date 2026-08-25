import * as admin from 'firebase-admin';

function initAdmin(): admin.app.App {
  if (admin.apps.length > 0 && admin.apps[0]) {
    return admin.apps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Replace escaped newlines in private key string
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`
    });
  }

  // Fallback to default application credentials or emulator mode
  return admin.initializeApp({
    projectId: projectId || 'le-prestige-residency'
  });
}

const adminApp = initAdmin();

export const adminAuth = adminApp.auth();
export const adminFirestore = adminApp.firestore();
export const adminStorage = adminApp.storage();

export default adminApp;
