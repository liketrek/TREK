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

/** The per-leg detail the day plan's leg rows carry (utils/dayMerge's `__leg`). */
export interface TransportLegDetail {
  index: number;
  from?: string | null;
  to?: string | null;
  airline?: string | null;
  flight_number?: string | null;
  train_number?: string | null;
  platform?: string | null;
  seat?: string | null;
}

/**
 * The subtitle of a transport row in the day plan, desktop and phone alike. A
 * leg of a multi-leg train or flight names its own train or flight, platform
 * and seat (#2701); a whole booking reads them off its metadata. Null for the
 * other transport types, which each view labels its own way.
 */
export function transportSubtitle(
  res: { type: string; metadata?: unknown; __leg?: TransportLegDetail | null },
  t: Translate
): string | null {
  const meta = parseMeta(res.metadata);
  const leg = res.__leg;
  const trainParts = (d: { train_number?: unknown; platform?: unknown; seat?: unknown }) => [
    str(d.train_number),
    str(d.platform) ? `${t('reservations.meta.platform')} ${str(d.platform)}` : '',
    str(d.seat) ? `${t('reservations.meta.seat')} ${str(d.seat)}` : '',
  ];
  if (leg) {
    const parts = res.type === 'train' ? trainParts(leg) : [str(leg.airline), str(leg.flight_number)];
    if (leg.from || leg.to) parts.push([leg.from, leg.to].filter(Boolean).join(' → '));
    return parts.filter(Boolean).join(', ');
  }
  if (res.type === 'flight') {
    const parts = [str(meta.airline), str(meta.flight_number)];
    if (meta.departure_airport || meta.arrival_airport) {
      parts.push([str(meta.departure_airport), str(meta.arrival_airport)].filter(Boolean).join(' → '));
    }
    return parts.filter(Boolean).join(', ');
  }
  if (res.type === 'train') return trainParts(meta).filter(Boolean).join(', ');
  return null;
}

function str(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function parseMeta(metadata: unknown): Record<string, unknown> {
  let meta = metadata;
  // An earlier bug could double-encode the metadata; reading it twice heals that.
  for (let i = 0; i < 2 && typeof meta === 'string'; i++) {
    try {
      meta = JSON.parse(meta || '{}');
    } catch {
      meta = {};
    }
  }
  return meta && typeof meta === 'object' ? (meta as Record<string, unknown>) : {};
}
