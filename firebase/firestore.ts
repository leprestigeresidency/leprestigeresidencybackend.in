import { firestore } from './config';
import { adminFirestore } from './admin';
import { COLLECTIONS, CollectionName } from './collections';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint,
  runTransaction
} from 'firebase/firestore';

/**
 * Get client Firestore collection reference
 */
export function getCollectionRef(collectionName: CollectionName) {
  return collection(firestore, collectionName);
}

/**
 * Get client Firestore document reference
 */
export function getDocRef(collectionName: CollectionName, docId: string) {
  return doc(firestore, collectionName, docId);
}

/**
 * SERVER-SIDE: Run transaction on Firestore using Admin SDK
 */
export async function runAdminTransaction<T>(
  updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<T>
): Promise<T> {
  return adminFirestore.runTransaction(updateFunction);
}

/**
 * CLIENT/SHARED: Fetch single document by ID
 */
export async function fetchDocumentById<T>(
  collectionName: CollectionName,
  docId: string
): Promise<T | null> {
  const docRef = doc(firestore, collectionName, docId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as T;
}

/**
 * SERVER-SIDE: Fetch single document using Admin SDK
 */
export async function fetchAdminDocumentById<T>(
  collectionName: CollectionName,
  docId: string
): Promise<T | null> {
  const snap = await adminFirestore.collection(collectionName).doc(docId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as T;
}

/**
 * SERVER-SIDE: Create document using Admin SDK
 */
export async function createAdminDocument<T extends Record<string, any>>(
  collectionName: CollectionName,
  docId: string | null,
  data: T
): Promise<T & { id: string }> {
  const now = new Date().toISOString();
  const documentData = {
    ...data,
    createdAt: data.createdAt || now,
    updatedAt: now
  };

  if (docId) {
    await adminFirestore.collection(collectionName).doc(docId).set(documentData, { merge: true });
    return { id: docId, ...documentData };
  } else {
    const ref = await adminFirestore.collection(collectionName).add(documentData);
    return { id: ref.id, ...documentData };
  }
}

/**
 * SERVER-SIDE: Update document using Admin SDK
 */
export async function updateAdminDocument(
  collectionName: CollectionName,
  docId: string,
  data: Record<string, any>
): Promise<void> {
  const now = new Date().toISOString();
  await adminFirestore.collection(collectionName).doc(docId).update({
    ...data,
    updatedAt: now
  });
}

/**
 * SERVER-SIDE: Delete document using Admin SDK
 */
export async function deleteAdminDocument(
  collectionName: CollectionName,
  docId: string
): Promise<void> {
  await adminFirestore.collection(collectionName).doc(docId).delete();
}
