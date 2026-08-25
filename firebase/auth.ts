import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './config';
import { adminAuth, adminFirestore } from './admin';
import { COLLECTIONS } from './collections';
import { UserRole, AdminUser, StaffUser, CustomerUser } from './types';
import { AuthRequiredError, PermissionDeniedError } from './errors';

/**
 * Sign in user with email & password
 */
export async function loginWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Get current authenticated Firebase user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Listen to auth state changes
 */
export function subscribeToAuthState(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * SERVER-SIDE ONLY: Set custom claims for user role (admin | staff | customer)
 */
export async function setUserRoleClaim(uid: string, role: UserRole): Promise<void> {
  const claims: Record<string, boolean | string> = { role };
  if (role === 'admin') {
    claims.admin = true;
  } else if (role === 'staff') {
    claims.staff = true;
  }

  await adminAuth.setCustomUserClaims(uid, claims);

  // Update role in Firestore database as well
  const collectionName =
    role === 'admin'
      ? COLLECTIONS.ADMINS
      : role === 'staff'
      ? COLLECTIONS.STAFF
      : COLLECTIONS.CUSTOMERS;

  const now = new Date().toISOString();
  await adminFirestore
    .collection(collectionName)
    .doc(uid)
    .set(
      {
        uid,
        role,
        updatedAt: now
      },
      { merge: true }
    );
}

/**
 * SERVER-SIDE ONLY: Verify role from Firebase ID token decoded claims
 */
export async function verifyUserRole(idToken: string, requiredRole: UserRole): Promise<boolean> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const tokenRole = decodedToken.role as string | undefined;

    if (requiredRole === 'admin') {
      return tokenRole === 'admin' || decodedToken.admin === true;
    }
    if (requiredRole === 'staff') {
      return (
        tokenRole === 'staff' ||
        tokenRole === 'admin' ||
        decodedToken.staff === true ||
        decodedToken.admin === true
      );
    }
    return true; // customer or any valid token
  } catch (error) {
    return false;
  }
}

/**
 * SERVER-SIDE ONLY: Get user role from ID token
 */
export async function getUserRoleFromToken(idToken: string): Promise<UserRole> {
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  if (decodedToken.admin || decodedToken.role === 'admin') return 'admin';
  if (decodedToken.staff || decodedToken.role === 'staff') return 'staff';
  return 'customer';
}

/**
 * Require authentication helper for server execution
 */
export async function requireAuthToken(idToken: string) {
  if (!idToken) {
    throw new AuthRequiredError('Authorization token is missing.');
  }
  try {
    return await adminAuth.verifyIdToken(idToken);
  } catch {
    throw new AuthRequiredError('Invalid or expired authentication token.');
  }
}

/**
 * Require specific role helper for server execution
 */
export async function requireRoleToken(idToken: string, requiredRole: UserRole) {
  const decoded = await requireAuthToken(idToken);
  const isAuthorized =
    requiredRole === 'admin'
      ? decoded.role === 'admin' || decoded.admin === true
      : requiredRole === 'staff'
      ? decoded.role === 'staff' || decoded.admin === true || decoded.staff === true
      : true;

  if (!isAuthorized) {
    throw new PermissionDeniedError(`Access denied. Requires '${requiredRole}' privileges.`);
  }
  return decoded;
}
