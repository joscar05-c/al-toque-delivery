/** Formatea montos en soles peruanos (PEN). */
export function formatPrice(amount: number): string {
  return `S/ ${amount.toFixed(2)}`;
}

/** Formatea minutos como texto legible: 45 -> "45 min". */
export function formatMinutes(minutes: number): string {
  return `${minutes} min`;
}
