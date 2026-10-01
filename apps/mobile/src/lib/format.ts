/** Formatea montos en soles peruanos (PEN). */
export function formatPrice(amount: number): string {
  return `S/. ${amount.toFixed(2)}`;
}

/** Formatea minutos como texto legible: 45 -> "45 min". */
export function formatMinutes(minutes: number): string {
  return `${minutes} min`;
}

const MONTHS_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/** ISO -> "1 oct · 14:30" (sin depender de Intl). */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = MONTHS_SHORT[d.getMonth()];
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} · ${hours}:${minutes}`;
}
