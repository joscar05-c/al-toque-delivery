import type { PhoneConfirmation } from '@/lib/firebase';

/**
 * Guarda el ConfirmationResult de Firebase entre login y verify.
 * No se puede pasar por params de navegación porque es un objeto con métodos.
 */
let confirmation: PhoneConfirmation | null = null;

export function setPhoneConfirmation(value: PhoneConfirmation | null): void {
  confirmation = value;
}

export function getPhoneConfirmation(): PhoneConfirmation | null {
  return confirmation;
}
