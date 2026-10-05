import {
  getAuth,
  getIdToken as firebaseGetIdToken,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithPhoneNumber as firebaseSignInWithPhoneNumber,
  signOut as firebaseSignOut,
  type ConfirmationResult,
  type User,
} from '@react-native-firebase/auth';

/**
 * Capa de autenticación Firebase para NATIVO (iOS/Android).
 * Metro resuelve `firebase.web.ts` para la build web, por lo que este
 * archivo (módulo nativo @react-native-firebase) nunca entra al bundle web.
 *
 * API unificada con `firebase.web.ts`: misma firma de exports.
 */

export type FirebaseUser = User;
export type PhoneConfirmation = ConfirmationResult;

const auth = getAuth();

/** Suscribe a cambios de sesión. Devuelve el cleanup. */
export function onAuthStateChanged(
  callback: (user: FirebaseUser | null) => void,
): () => void {
  return firebaseOnAuthStateChanged(auth, callback);
}

/** Usuario Firebase actual o null. */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/** ID token (JWT) del usuario actual; null si no hay sesión. */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return firebaseGetIdToken(user, forceRefresh);
}

/** Cierra sesión en Firebase. */
export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Envía el SMS con el código. En nativo no requiere verifier web
 * (Android usa Play Integrity, iOS APNs silencioso, gestionado por el SDK).
 */
export async function startPhoneVerification(
  phone: string,
): Promise<PhoneConfirmation> {
  return firebaseSignInWithPhoneNumber(auth, phone);
}

/** Confirma el código SMS y crea la sesión. */
export async function confirmPhoneCode(
  confirmation: PhoneConfirmation,
  code: string,
): Promise<void> {
  await confirmation.confirm(code);
}
