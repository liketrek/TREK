type Translate = (key: string, params?: Record<string, string | number>) => string;

/**
 * What the desktop transport detail dialog and the phone transport sheet both read
 * off a booking. The booking's files come from utils/reservationFiles.
 */

/** The day a booking runs on, as the head of either detail names it, in the locale's order ("Wed, Jul 1" in en-US). */
export function bookingDayLabel(date: string, locale: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/**
 * The name a segment's own booking code is listed under (#1943): where it leaves
 * from and where it goes, or the plain booking code label when the segment names
 * neither.
 */
export function segmentCodeLabel(leg: { from?: string | null; to?: string | null }, t: Translate): string {
  return [leg.from, leg.to].filter(Boolean).join(' → ') || t('reservations.confirmationCode');
}
