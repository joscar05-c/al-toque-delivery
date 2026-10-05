'use client';

import {
  RecaptchaVerifier,
  getAuth,
  signInWithPhoneNumber,
  signOut,
  type ConfirmationResult,
} from 'firebase/auth';

import { getFirebaseApp } from './client';

/** Contenedor del reCAPTCHA invisible (debe existir en el DOM). */
const RECAPTCHA_CONTAINER_ID = 'recaptcha-container';

let verifier: RecaptchaVerifier | null = null;

function getRecaptchaVerifier(): RecaptchaVerifier {
  if (verifier) return verifier;

  const container = document.getElementById(RECAPTCHA_CONTAINER_ID);
  if (!container) {
    throw new Error(
      'No se encontró el contenedor de reCAPTCHA en el DOM (#recaptcha-container).',
    );
  }

  verifier = new RecaptchaVerifier(getAuth(getFirebaseApp()), container, {
    size: 'invisible',
  });
  return verifier;
}

/** Paso 1: envía el SMS con el código de 6 dígitos. */
export async function startPhoneVerification(
  phone: string,
): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(
    getAuth(getFirebaseApp()),
    phone,
    getRecaptchaVerifier(),
  );
}

/** Paso 2: confirma el código recibido y devuelve el ID token. */
export async function confirmPhoneCode(
  confirmation: ConfirmationResult,
  code: string,
): Promise<string> {
  const userCredential = await confirmation.confirm(code);
  return userCredential.user.getIdToken();
}

export async function getClientIdToken(): Promise<string | null> {
  const user = getAuth(getFirebaseApp()).currentUser;
  return user ? user.getIdToken() : null;
}

export async function signOutClient(): Promise<void> {
  await signOut(getAuth(getFirebaseApp()));
}