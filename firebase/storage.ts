import { storage } from './config';
import { adminStorage } from './admin';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  StorageReference
} from 'firebase/storage';
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_DOCUMENT_SIZE_BYTES,
  STORAGE_PATHS
} from './constants';
import { ValidationError } from './errors';

export type StorageFolder =
  | 'hero'
  | 'rooms'
  | 'gallery'
  | 'offers'
  | 'branches'
  | 'reviews'
  | 'invoices';

/**
 * Validate file type and size before uploading
 */
export function validateStorageFile(
  folder: StorageFolder,
  contentType: string,
  sizeBytes: number
): void {
  if (folder === 'invoices') {
    if (!ALLOWED_DOCUMENT_TYPES.includes(contentType)) {
      throw new ValidationError('Invoices must be PDF files.', { contentType });
    }
    if (sizeBytes > MAX_DOCUMENT_SIZE_BYTES) {
      throw new ValidationError('Invoice PDF must not exceed 10MB.', { sizeBytes });
    }
  } else {
    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      throw new ValidationError('Allowed image formats: JPG, JPEG, PNG, WEBP.', { contentType });
    }
    if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
      throw new ValidationError('Image file size must not exceed 5MB.', { sizeBytes });
    }
  }
}

/**
 * Client upload helper
 */
export async function uploadPublicFile(
  folder: StorageFolder,
  fileName: string,
  fileBuffer: Buffer | Uint8Array | ArrayBuffer,
  contentType: string
): Promise<string> {
  validateStorageFile(folder, contentType, fileBuffer.byteLength);

  const storageRef = ref(storage, `${folder}/${fileName}`);
  await uploadBytes(storageRef, fileBuffer, { contentType });
  return await getDownloadURL(storageRef);
}

/**
 * SERVER-SIDE: Upload file using Admin SDK to Firebase Storage
 */
export async function uploadAdminFile(
  folder: StorageFolder,
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> {
  validateStorageFile(folder, contentType, fileBuffer.length);

  const bucket = adminStorage.bucket();
  const file = bucket.file(`${folder}/${fileName}`);

  await file.save(fileBuffer, {
    metadata: {
      contentType
    },
    resumable: false
  });

  // If public image, return public media link or signed URL
  if (folder !== 'invoices') {
    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${folder}/${fileName}`;
  }

  // Private invoice: generate 1-hour signed download URL
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000 // 1 hour
  });

  return signedUrl;
}

/**
 * SERVER-SIDE: Get signed URL for private file (e.g. Invoices)
 */
export async function getPrivateSignedUrl(
  folder: StorageFolder,
  fileName: string,
  expiresInMinutes: number = 60
): Promise<string> {
  const bucket = adminStorage.bucket();
  const file = bucket.file(`${folder}/${fileName}`);

  const [exists] = await file.exists();
  if (!exists) {
    throw new ValidationError(`File ${folder}/${fileName} does not exist in storage.`);
  }

  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000
  });

  return signedUrl;
}

/**
 * SERVER-SIDE: Delete file from Storage
 */
export async function deleteAdminFile(folder: StorageFolder, fileName: string): Promise<void> {
  const bucket = adminStorage.bucket();
  const file = bucket.file(`${folder}/${fileName}`);
  const [exists] = await file.exists();
  if (exists) {
    await file.delete();
  }
}
