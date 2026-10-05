import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getIdToken as firebaseGetIdToken,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithPhoneNumber as firebaseSignInWithPhoneNumber,
  signOut as firebaseSignOut,
  RecaptchaVerifier,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';

/**
 * Capa de autenticación Firebase para WEB (Expo web / navegador).
 * Metro resuelve este archivo en lugar de `firebase.ts` cuando la plataforma
 * es web. Mantiene la misma API exportada.
 *
 * IMPORTANTE: el login por SMS en web usa reCAPTCHA invisible. La pantalla de
 * login debe montar un contenedor con id "recaptcha-container" (en RN:
 * `<View nativeID="recaptcha-container" />`).
 */

export type FirebaseUser = User;
export type PhoneConfirmation = ConfirmationResult;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);
const auth = getAuth(app);

const RECAPTCHA_CONTAINER_ID = 'recaptcha-container';
let recaptchaVerifier: RecaptchaVerifier | null = null;

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

/** Envía el SMS con el código usando reCAPTCHA invisible. */
export async function startPhoneVerification(
  phone: string,
): Promise<PhoneConfirmation> {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
      size: 'invisible',
    });
  }
  return firebaseSignInWithPhoneNumber(auth, phone, recaptchaVerifier);
}

/** Confirma el código SMS y crea la sesión. */
export async function confirmPhoneCode(
  confirmation: PhoneConfirmation,
  code: string,
): Promise<void> {
  await confirmation.confirm(code);
}
