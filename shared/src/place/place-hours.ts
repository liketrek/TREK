import { z } from 'zod';

/**
 * A place's own opening hours and e-mail, typed in by hand (#2472). The search
 * fills phone and website when it knows them; when it does not, or for a place
 * nobody has listed, these are how the traveller adds what they found out.
 *
 * Hours are stored as JSON text on the place: seven days, Monday first, the
 * same order Google's weekday lines come in, so the inspector shows either the
 * same way.
 */
export const PLACE_HOURS_DAYS = 7;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const placeHoursDaySchema = z.object({
  closed: z.boolean(),
  open: z.string().regex(TIME).optional(),
  close: z.string().regex(TIME).optional(),
});
export type PlaceHoursDay = z.infer<typeof placeHoursDaySchema>;

export const placeOpeningHoursSchema = z.array(placeHoursDaySchema).length(PLACE_HOURS_DAYS);
export type PlaceOpeningHours = z.infer<typeof placeOpeningHoursSchema>;

/** The stored text as seven days, or null when it is empty or not hours at all. */
export function parsePlaceHours(raw: unknown): PlaceOpeningHours | null {
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  try {
    const parsed = placeOpeningHoursSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Whether a week says anything: a day that is closed or has a time. */
export function hasPlaceHours(hours: PlaceOpeningHours | null): boolean {
  return !!hours && hours.some((d) => d.closed || !!d.open || !!d.close);
}

/** The request field: the JSON text, empty or null to clear it. */
export const placeOpeningHoursField = z
  .string()
  .max(1000)
  .refine((v) => v === '' || parsePlaceHours(v) !== null, { message: 'opening_hours must be seven days, Monday first' })
  .nullable()
  .optional();

/** One @ with something on both sides, a dot inside the domain, no whitespace anywhere. */
function isEmail(value: string): boolean {
  if (/\s/.test(value)) return false;
  const at = value.indexOf('@');
  if (at < 1 || at !== value.lastIndexOf('@')) return false;
  // A dot with something on both sides, like the former /[^\s@]+\.[^\s@]+$/ domain part.
  return value.slice(at + 2, -1).includes('.');
}

/** An e-mail address, or empty to clear it. */
export const placeEmailField = z
  .string()
  .max(254)
  .refine((v) => v === '' || isEmail(v.trim()), { message: 'email must be an e-mail address' })
  .nullable()
  .optional();
