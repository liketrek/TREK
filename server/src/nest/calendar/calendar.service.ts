import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ReservationsService } from '../reservations/reservations.service';
import { addDays } from '../days/days.service';
import { resolveTimeZone } from '../common/timezoneService';
import { NotFoundError } from '../common/domain-errors';

/** The VCALENDAR preamble every TREK calendar starts with, single-trip or merged. */
export const CALENDAR_HEADER =
  'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//TREK//Travel Planner//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n';

/** One trip's calendar in parts, so callers can merge several without re-parsing text. */
export interface TripCalendar {
  /** Already escaped for the X-WR-CALNAME line. */
  calName: string;
  /** Filename for the Content-Disposition of the one-time download. */
  filename: string;
  /** VTIMEZONE block per TZID. Merging calendars means merging these by key. */
  timezones: Map<string, string>;
  /** One complete BEGIN:VEVENT…END:VEVENT block each, unfolded, in emission order. */
  events: string[];
}

// ── ICS folding ─────────────────────────────────────────────────────────────

// RFC 5545 §3.1: content lines longer than 75 octets must be folded with a CRLF
// followed by a single leading space. We fold on UTF-8 *octet* boundaries and
// never split a multi-byte codepoint, so non-ASCII titles/notes (accents, CJK,
// emoji) stay intact. Applied to the whole calendar, so both the one-time
// download and the subscribable feed emit spec-compliant output.
export function foldICS(ics: string): string {
  const foldLine = (line: string): string => {
    const bytes = Buffer.from(line, 'utf8');
    if (bytes.length <= 75) return line;
    const parts: Buffer[] = [];
    let start = 0;
    let limit = 75; // first physical line may use 75 octets
    while (start < bytes.length) {
      let end = Math.min(start + limit, bytes.length);
      // Back off so we never cut a multi-byte UTF-8 sequence (0x80–0xBF = continuation byte).
      while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
      parts.push(bytes.subarray(start, end));
      start = end;
      limit = 74; // continuation lines spend one octet on the leading space
    }
    return parts.map((b, i) => (i === 0 ? '' : ' ') + b.toString('utf8')).join('\r\n');
  };
  return ics.split('\r\n').map(foldLine).join('\r\n');
}

// ── ICS time-zone helpers ────────────────────────────────────────────────────
// Timed events must carry an explicit IANA zone; a bare "YYYYMMDDTHHMMSS" is an
// RFC 5545 "floating" time that clients render in the *subscriber's* zone (#1453).

// A stored/plugin-provided timezone (e.g. a transport endpoint's `timezone`) is a
// free string that need not be a real IANA zone. Intl.DateTimeFormat throws a
// RangeError on an unknown zone, which — via buildVTimezone → tzOffsetString —
// would crash the whole ICS export (and drop the trip from the all-trips feed).
// Validate once so an invalid zone degrades to a floating local time instead.
// Module-scoped on purpose (like the permissions/FX caches): the bridge instance
// and the DI singleton share one cache.
const _tzValidCache = new Map<string, boolean>();
function isValidTimeZone(zone: string): boolean {
  const cached = _tzValidCache.get(zone);
  if (cached !== undefined) return cached;
  let ok = false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    ok = true;
  } catch {
    // Unknown/invalid zone → ok stays false.
  }
  // Bound the cache — the key is a free-form (plugin/importer-written) zone string,
  // so cap distinct entries rather than growing for the process lifetime.
  if (_tzValidCache.size >= 1000) _tzValidCache.clear();
  _tzValidCache.set(zone, ok);
  return ok;
}

// UTC offset ("+0200") the zone uses on the given YYYYMMDD date. Only feeds the
// fallback VTIMEZONE offset; iOS/Google resolve the named zone from their own
// IANA database, so a single representative offset is sufficient.
function tzOffsetString(zone: string, yyyymmdd: string): string {
  const iso = `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T12:00:00Z`;
  const probe = new Date(iso);
  if (Number.isNaN(probe.getTime())) return '+0000';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    timeZoneName: 'longOffset',
  }).formatToParts(probe);
  const raw = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = raw.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!m) return '+0000'; // "GMT" (UTC) has no offset digits
  return `${m[1]}${m[2]}${m[3] ?? '00'}`;
}

// Minimal but RFC-valid VTIMEZONE. Smart clients override it with their own tz
// rules; dumb clients fall back to this fixed offset.
function buildVTimezone(zone: string, yyyymmdd: string): string {
  const off = tzOffsetString(zone, yyyymmdd);
  return (
    'BEGIN:VTIMEZONE\r\n' +
    `TZID:${zone}\r\n` +
    'BEGIN:STANDARD\r\n' +
    'DTSTART:19700101T000000\r\n' +
    `TZOFFSETFROM:${off}\r\n` +
    `TZOFFSETTO:${off}\r\n` +
    `TZNAME:${zone}\r\n` +
    'END:STANDARD\r\n' +
    'END:VTIMEZONE\r\n'
  );
}
/**
 * Everything TREK knows how to say in iCalendar. Moved out of TripsService
 * unchanged: same statements, same escaping, same folding, same VTIMEZONE
 * fallback, so the emitted bytes are identical for both consumers (the one-time
 * download on the trip route and the subscribable feeds).
 *
 * It is its own domain rather than a method on trips because FeedsService needs
 * calendars without needing the trip aggregate, and because the ICS rules
 * (RFC 5545 folding, floating vs. zoned times) have nothing to do with trips.
 */
@Injectable()
export class CalendarService {
  constructor(
    private readonly dbs: DatabaseService,
    private readonly reservations: ReservationsService,
  ) {}

  private get db() {
    return this.dbs.connection;
  }

  // ── ICS export ────────────────────────────────────────────────────────────

  /**
   * A trip's calendar as parts rather than as one string.
   *
   * The all-trips feed needs to merge many trips into one document: it has to
   * drop each trip's VCALENDAR wrapper, keep the VEVENTs, and emit each
   * VTIMEZONE once. It used to do that by scanning the finished text back apart
   * line by line — and that scan had to be structural rather than a regex,
   * because a user-supplied SUMMARY can legitimately contain the literal
   * "END:VEVENT". Handing out the parts removes the need to reassemble them.
   */
  buildTripCalendar(tripId: string | number): TripCalendar {
    const trip = this.db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId) as any;
    if (!trip) throw new NotFoundError('Trip not found');

    // A hotel keeps its dates on the linked stay, not on the reservation: the
    // booking form writes reservation_time = NULL for type 'hotel' and lets
    // day_accommodations carry start day, end day and the check-in/out clock.
    // Joining them here is what lets a stay span its whole range (#1586).
    const reservations = this.db
      .prepare(
        `SELECT r.*, pl.lat AS place_lat, pl.lng AS place_lng,
                sd.date AS stay_start_date, ed.date AS stay_end_date
         FROM reservations r
         LEFT JOIN places pl ON r.place_id = pl.id
         LEFT JOIN day_accommodations a ON r.accommodation_id = a.id
         LEFT JOIN days sd ON a.start_day_id = sd.id
         LEFT JOIN days ed ON a.end_day_id = ed.id
         WHERE r.trip_id = ?`,
      )
      .all(tripId) as any[];

    const esc = (s: string) => s
      .replaceAll(/\\/g, '\\\\')
      .replaceAll(';', '\\;')
      .replaceAll(',', '\\,')
      .replace(/\r?\n/g, '\\n')
      .replaceAll(/\r/g, '');
    const fmtDate = (d: string) => d.replaceAll('-', '');
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = (id: number, type: string) => `trek-${type}-${id}@trek`;

    // Format datetime: handles full ISO "2026-03-30T09:00" and time-only "10:00"
    // iCal requires exactly YYYYMMDDTHHMMSS format
    const fmtDateTime = (d: string, refDate?: string) => {
      if (d.includes('T')) {
        const raw = d.replace(/[-:]/g, '').split('.')[0];
        // Pad to 15 chars (YYYYMMDDTHHMMSS) — add missing seconds
        return raw.length === 13 ? raw + '00' : raw;
      }
      // Time-only: combine with reference date. Pad the same way the branch above
      // does rather than unconditionally, because the value can already carry
      // seconds ("10:00:00" is what the booking import stores). Appending
      // regardless made it 17 characters, which fails dtLine's shape check, drops
      // the TZID and leaves a floating time in the feed (#1453 again).
      if (refDate && d.match(/^\d{2}:\d{2}/)) {
        const datePart = refDate.split('T')[0];
        const raw = `${datePart}T${d.replaceAll(':', '')}`.replaceAll('-', '');
        return raw.length === 13 ? raw + '00' : raw;
      }
      return d.replace(/[-:]/g, '');
    };

    // Zones referenced by timed events → representative YYYYMMDD (for the fallback
    // VTIMEZONE offset). Populated by dtLine; emitted once as VTIMEZONE blocks.
    const usedZones = new Map<string, string>();

    // Emit a DTSTART/DTEND line, attaching TZID when the event's zone is known so
    // subscribers see the time in TREK's zone. Falls back to a floating local time
    // (unchanged behavior) when no zone resolves or the value is not a date-time.
    const dtLine = (
      prop: 'DTSTART' | 'DTEND',
      wallClock: string,
      zone: string | null,
      refDate?: string,
    ): string => {
      const val = fmtDateTime(wallClock, refDate);
      if (zone && isValidTimeZone(zone) && /^\d{8}T\d{6}$/.test(val)) {
        if (!usedZones.has(zone)) usedZones.set(zone, val.slice(0, 8));
        return `${prop};TZID=${zone}:${val}\r\n`;
      }
      return `${prop}:${val}\r\n`;
    };

    const events: string[] = [];

    // Trip as all-day event. DTEND is exclusive, so it must be the day *after* the last
    // day. addDays() stays in UTC — building a local-time Date here dropped the trip's
    // last day on any server east of Greenwich (#1453).
    if (trip.start_date && trip.end_date) {
      const endStr = fmtDate(addDays(trip.end_date, 1));
      let ev = `BEGIN:VEVENT\r\nUID:${uid(trip.id, 'trip')}\r\nDTSTAMP:${now}\r\nDTSTART;VALUE=DATE:${fmtDate(trip.start_date)}\r\nDTEND;VALUE=DATE:${endStr}\r\nSUMMARY:${esc(trip.title || 'Trip')}\r\n`;
      if (trip.description) ev += `DESCRIPTION:${esc(trip.description)}\r\n`;
      ev += `END:VEVENT\r\n`;
      events.push(ev);
    }

    // Days with assignments and notes
    const days = this.db.prepare('SELECT * FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(tripId) as any[];
    for (const day of days) {
      if (!day.date) continue;

      const assignments = this.db.prepare(`
        SELECT da.*, p.name as place_name, p.address as place_address,
          p.lat as place_lat, p.lng as place_lng,
          COALESCE(da.assignment_time, p.place_time) as effective_time,
          COALESCE(da.assignment_end_time, p.end_time) as effective_end_time
        FROM day_assignments da
        JOIN places p ON da.place_id = p.id
        WHERE da.day_id = ?
        ORDER BY da.order_index ASC, da.created_at ASC
      `).all(day.id) as any[];

      const notes = this.db.prepare(
        'SELECT * FROM day_notes WHERE day_id = ? ORDER BY sort_order ASC, created_at ASC'
      ).all(day.id) as any[];

      const timed = assignments.filter(a => a.effective_time);
      const untimed = assignments.filter(a => !a.effective_time);

      // Timed assignments → individual events
      for (const a of timed) {
        const zone = resolveTimeZone(a.place_lat, a.place_lng);
        let ev = `BEGIN:VEVENT\r\nUID:${uid(a.id, 'assign')}\r\nDTSTAMP:${now}\r\n`;
        ev += dtLine('DTSTART', a.effective_time, zone, day.date + 'T00:00');
        if (a.effective_end_time) {
          ev += dtLine('DTEND', a.effective_end_time, zone, day.date + 'T00:00');
        }
        ev += `SUMMARY:${esc(a.place_name)}\r\n`;
        let desc = '';
        if (a.notes) desc += a.notes;
        if (a.place_address) desc += (desc ? '\n' : '') + a.place_address;
        if (desc) ev += `DESCRIPTION:${esc(desc)}\r\n`;
        if (a.place_address) ev += `LOCATION:${esc(a.place_address)}\r\n`;
        ev += `END:VEVENT\r\n`;
        events.push(ev);
      }

      // Build all-day summary event if there are untimed activities or notes
      if (untimed.length > 0 || notes.length > 0) {
        const dayTitle = day.title || `Day ${day.day_number}`;
        const endStr = fmtDate(addDays(day.date, 1));

        let ev = `BEGIN:VEVENT\r\nUID:${uid(day.id, 'day')}\r\nDTSTAMP:${now}\r\n`;
        ev += `DTSTART;VALUE=DATE:${fmtDate(day.date)}\r\nDTEND;VALUE=DATE:${endStr}\r\n`;
        ev += `SUMMARY:${esc(dayTitle)}\r\n`;

        let desc = '';
        if (untimed.length > 0) {
          desc += untimed.map(a => {
            let line = `• ${a.place_name}`;
            if (a.place_address) line += ` (${a.place_address})`;
            if (a.notes) line += ` — ${a.notes}`;
            return line;
          }).join('\n');
        }
        if (notes.length > 0) {
          if (desc) desc += '\n\n';
          desc += 'Notes:\n' + notes.map(n => {
            const line = n.time ? `${n.time} — ${n.text}` : `• ${n.text}`;
            return line;
          }).join('\n');
        }
        if (desc) ev += `DESCRIPTION:${esc(desc)}\r\n`;
        ev += `END:VEVENT\r\n`;
        events.push(ev);
      }
    }

    // Transport/flight reservations carry no top-level reservation_time; their
    // times live per endpoint (local_date + local_time) in reservation_endpoints.
    const endpointsMap = this.reservations.loadEndpointsByTrip(tripId);
    const isDate = (s: string | null | undefined) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
    const isTime = (s: string | null | undefined) => !!s && /^\d{2}:\d{2}/.test(s);

    // Build the DTSTART/DTEND lines for a reservation, or null when it has no
    // calendar-placeable time. Transports keep a per-side wall clock + IANA zone
    // on their endpoints, so consult a timed departure endpoint FIRST: transports
    // also carry a top-level reservation_time (TransportModal stamps it), whose
    // only zone is the linked place — flights have none — so that branch floats
    // both ends in the subscribed feed (#1453). Hotels/restaurants have no
    // endpoints and fall through to reservation_time.
    const buildReservationTimeLines = (r: any): string | null => {
      // A stay wins over everything below: it is the only source that knows how
      // long the booking lasts. Emitted as an all-day range over every night, so
      // the hotel sits above the day in a subscribed calendar instead of
      // appearing once on the arrival day (#1586).
      // end_day_id is the CHECK-OUT day, and the block is meant to cover it too:
      // a 26th-to-30th booking should read as a five-day block, not as the four
      // nights it contains. DTEND is exclusive, so it is check-out plus one day.
      // Dropping that +1 hides the departure day; it is not a stray off-by-one
      // (#1869).
      if (isDate(r.stay_start_date)) {
        const lastDay = isDate(r.stay_end_date) && r.stay_end_date >= r.stay_start_date
          ? r.stay_end_date
          : r.stay_start_date;
        return `DTSTART;VALUE=DATE:${fmtDate(r.stay_start_date)}\r\n` +
          `DTEND;VALUE=DATE:${fmtDate(addDays(lastDay, 1))}\r\n`;
      }

      const eps = endpointsMap.get(r.id);
      const ordered = eps && eps.length > 0 ? [...eps].sort((a, b) => a.sequence - b.sequence) : null;
      const first = ordered?.[0];

      if (first && isDate(first.local_date) && isTime(first.local_time)) {
        // Transport: departure endpoint zone drives DTSTART, arrival drives DTEND.
        // Prefer the stored IANA zone; fall back to the endpoint's coordinates.
        const last = ordered![ordered!.length - 1];
        const startZone = first.timezone || resolveTimeZone(first.lat, first.lng);
        const startWallClock = `${first.local_date}T${first.local_time}`;
        let out = dtLine('DTSTART', startWallClock, startZone);
        if (last !== first && isDate(last.local_date) && isTime(last.local_time)) {
          const endZone = last.timezone || resolveTimeZone(last.lat, last.lng);
          out += dtLine('DTEND', `${last.local_date}T${last.local_time}`, endZone);
        } else if (r.reservation_end_time) {
          // No second timed endpoint, so the arrival side still lives in
          // reservation_end_time — a rental car imported with only a geocoded
          // pickup is the common shape. Taking the endpoint branch without this
          // would drop the DTEND the reservation_time branch used to emit and
          // shrink a multi-day booking to a point. The departure zone is the
          // best one on hand for that end too.
          const endDt = fmtDateTime(r.reservation_end_time, startWallClock);
          if (endDt.length >= 15) out += dtLine('DTEND', r.reservation_end_time, startZone, startWallClock);
        }
        return out;
      }

      if (r.reservation_time) {
        const datePart = r.reservation_time.includes('T') ? r.reservation_time.split('T')[0] : r.reservation_time;
        if (!isDate(datePart)) return null; // time-only (relative "Day N" trips)
        if (r.reservation_time.includes('T')) {
          // Hotels/restaurants: derive the zone from the linked place, if any.
          const zone = resolveTimeZone(r.place_lat, r.place_lng);
          let out = dtLine('DTSTART', r.reservation_time, zone);
          if (r.reservation_end_time) {
            const endDt = fmtDateTime(r.reservation_end_time, r.reservation_time);
            if (endDt.length >= 15) out += dtLine('DTEND', r.reservation_end_time, zone, r.reservation_time);
          }
          return out;
        }
        // Date-only start. RFC 5545 makes a DATE event without DTEND exactly one
        // day long, so a booking that does record an end date still collapsed
        // onto its first day (#1869); an all-day multi-day event coming through
        // the booking import (kitinerary-mapper passes date-only start/end
        // straight through) is the common shape. Same rule as the stay branch:
        // DTEND is exclusive, hence the end day plus one. Only the date part is
        // used, because DTSTART;VALUE=DATE and a timed DTEND may not be mixed.
        const endDatePart = r.reservation_end_time ? String(r.reservation_end_time).split('T')[0] : '';
        if (isDate(endDatePart) && endDatePart >= r.reservation_time) {
          return `DTSTART;VALUE=DATE:${fmtDate(r.reservation_time)}\r\n` +
            `DTEND;VALUE=DATE:${fmtDate(addDays(endDatePart, 1))}\r\n`;
        }
        return `DTSTART;VALUE=DATE:${fmtDate(r.reservation_time)}\r\n`;
      }

      // Untimed transport (endpoint has a date but no clock, no reservation_time).
      if (first && isDate(first.local_date)) {
        return `DTSTART;VALUE=DATE:${fmtDate(first.local_date)}\r\n`;
      }
      return null;
    };

    // Reservations as events
    for (const r of reservations) {
      const timeLines = buildReservationTimeLines(r);
      if (!timeLines) continue;
      const meta = r.metadata ? (typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata) : {};

      let ev = `BEGIN:VEVENT\r\nUID:${uid(r.id, 'res')}\r\nDTSTAMP:${now}\r\n`;
      ev += timeLines;
      ev += `SUMMARY:${esc(r.title)}\r\n`;

      let desc = r.type ? `Type: ${r.type}` : '';
      if (r.confirmation_number) desc += `\nConfirmation: ${r.confirmation_number}`;
      if (meta.airline) desc += `\nAirline: ${meta.airline}`;
      if (meta.flight_number) desc += `\nFlight: ${meta.flight_number}`;
      if (Array.isArray(meta.legs) && meta.legs.length > 1) {
        // Multi-leg flight: show the whole route (FRA → BER → HND) on one event.
        const stops = [meta.legs[0]?.from, ...meta.legs.map((l: { to?: string }) => l.to)].filter(Boolean);
        if (stops.length) desc += `\nRoute: ${stops.join(' → ')}`;
        // A segment booked under its own reference gets its own line (#1943): at
        // the gate it is that code the airline asks for, not the booking's. No
        // leg reference, no extra line, so an existing feed stays byte-identical.
        for (const leg of meta.legs as { from?: string; to?: string; confirmation_number?: string }[]) {
          if (!leg.confirmation_number) continue;
          const segment = [leg.from, leg.to].filter(Boolean).join('-');
          desc += `\nConfirmation${segment ? ` ${segment}` : ''}: ${leg.confirmation_number}`;
        }
      } else if (meta.departure_airport || meta.arrival_airport) {
        if (meta.departure_airport) desc += `\nFrom: ${meta.departure_airport}`;
        if (meta.arrival_airport) desc += `\nTo: ${meta.arrival_airport}`;
      } else {
        // Endpoint-based transport without route metadata: derive it from endpoints.
        const eps = endpointsMap.get(r.id);
        if (eps && eps.length > 1) {
          const stops = [...eps].sort((a, b) => a.sequence - b.sequence).map(e => e.code || e.name).filter(Boolean);
          if (stops.length > 1) desc += `\nRoute: ${stops.join(' → ')}`;
        }
      }
      if (meta.train_number) desc += `\nTrain: ${meta.train_number}`;
      if (r.notes) desc += `\n${r.notes}`;
      if (desc) ev += `DESCRIPTION:${esc(desc)}\r\n`;
      if (r.location) ev += `LOCATION:${esc(r.location)}\r\n`;
      ev += `END:VEVENT\r\n`;
      events.push(ev);
    }

    // Check-in and check-out as their own timed events, when the stay records the
    // clock (#1586). They are separate from the all-day stay above on purpose: an
    // all-day event cannot carry a time, and "be there at 15:00" is the part a
    // subscriber actually wants a reminder for. Emitted per stay rather than per
    // reservation so a stay whose reservation was deleted still shows them.
    // The reservation is read through a subquery rather than a LEFT JOIN: nothing
    // stops two bookings from pointing at the same accommodation, and a join fans
    // the stay out into one row per booking. Since the check-in/check-out UIDs are
    // keyed by the stay, that emitted the same UID twice and clients then pick one
    // of the duplicates at random (#1869). Lowest id wins so the title is stable
    // across exports.
    const stays = this.db.prepare(`
      SELECT a.id, a.check_in, a.check_in_end, a.check_out,
             sd.date AS start_date, ed.date AS end_date,
             p.name AS place_name, p.address AS place_address, p.lat AS place_lat, p.lng AS place_lng,
             (SELECT r.title FROM reservations r
               WHERE r.accommodation_id = a.id
               ORDER BY r.id ASC LIMIT 1) AS reservation_title
      FROM day_accommodations a
      LEFT JOIN days sd ON a.start_day_id = sd.id
      LEFT JOIN days ed ON a.end_day_id = ed.id
      LEFT JOIN places p ON a.place_id = p.id
      WHERE a.trip_id = ?
      ORDER BY a.id ASC
    `).all(tripId) as any[];

    for (const stay of stays) {
      const name = stay.reservation_title || stay.place_name || 'Accommodation';
      const zone = resolveTimeZone(stay.place_lat, stay.place_lng);
      // No end day (the day row was removed) → check out on the arrival day.
      const checkOutDate = isDate(stay.end_date) ? stay.end_date : stay.start_date;

      const marker = (
        kind: 'checkin' | 'checkout',
        date: string,
        time: string,
        summary: string,
        endTime?: string | null,
      ) => {
        const ref = `${date}T00:00`;
        let ev = `BEGIN:VEVENT\r\nUID:${uid(stay.id, kind)}\r\nDTSTAMP:${now}\r\n`;
        ev += dtLine('DTSTART', time, zone, ref);
        if (isTime(endTime)) ev += dtLine('DTEND', endTime!, zone, ref);
        ev += `SUMMARY:${esc(summary)}\r\n`;
        if (stay.place_address) ev += `LOCATION:${esc(stay.place_address)}\r\n`;
        ev += `END:VEVENT\r\n`;
        events.push(ev);
      };

      if (isDate(stay.start_date) && isTime(stay.check_in)) {
        marker('checkin', stay.start_date, stay.check_in, `Check-in: ${name}`, stay.check_in_end);
      }
      if (isDate(checkOutDate) && isTime(stay.check_out)) {
        marker('checkout', checkOutDate, stay.check_out, `Check-out: ${name}`);
      }
    }

    // Pickup and drop-off as their own timed events — the car-rental analogue
    // of check-in/check-out above (last unported piece of #1721). Additive,
    // same as the check-in/check-out markers are additive to the all-day stay
    // range: the rental's existing single-block event (from the endpoint or
    // reservation_time branch of buildReservationTimeLines, above) is untouched.
    // "YYYY-MM-DD", full ISO, or a bare "HH:MM" → date/time parts. Endpoints
    // already carry local_date/local_time separately; reservation_time and
    // reservation_end_time (the last-resort fallback below) are combined
    // strings, and reservation_end_time is frequently just a bare clock
    // alongside the reservation's own date.
    const dateOf = (s: string | null | undefined): string | null => {
      if (!s) return null;
      const d = s.includes('T') ? s.split('T')[0] : s;
      return isDate(d) ? d : null;
    };
    const timeOf = (s: string | null | undefined): string | null => {
      if (!s) return null;
      const t = s.includes('T') ? s.split('T')[1] : s;
      return t && isTime(t) ? t : null;
    };

    for (const r of reservations) {
      if (r.type !== 'car') continue;

      // Sides come from the endpoint role first: import can drop one endpoint
      // (failed geocoding), and a surviving return endpoint must not masquerade
      // as the pickup. Positional first/last by sequence is only a fallback
      // when neither role is present at all, and only once there's more than
      // one endpoint, so a lone endpoint is never treated as both sides.
      const eps = endpointsMap.get(r.id);
      const ordered = eps && eps.length > 0 ? [...eps].sort((a, b) => a.sequence - b.sequence) : [];
      const roleFrom = ordered.find(e => e.role === 'from');
      const roleTo = ordered.find(e => e.role === 'to');
      const noRoles = !roleFrom && !roleTo;
      const pickupEp = roleFrom ?? (noRoles && ordered.length > 1 ? ordered[0] : undefined);
      const dropEp = roleTo ?? (noRoles && ordered.length > 1 ? ordered[ordered.length - 1] : undefined);

      const carMarker = (kind: 'pickup' | 'dropoff', summary: string, date: string, time: string, zone: string | null) => {
        let ev = `BEGIN:VEVENT\r\nUID:${uid(r.id, kind)}\r\nDTSTAMP:${now}\r\n`;
        ev += dtLine('DTSTART', time, zone, `${date}T00:00`);
        ev += `SUMMARY:${esc(summary)}\r\n`;
        if (r.location) ev += `LOCATION:${esc(r.location)}\r\n`;
        ev += `END:VEVENT\r\n`;
        events.push(ev);
      };

      // Per side: the chosen endpoint when it has a usable date and clock,
      // else reservation_time (pickup) / reservation_end_time (drop-off) —
      // imports frequently carry only that window. A side with no usable date
      // and clock from either source emits nothing.
      const pickupUsable = pickupEp && isDate(pickupEp.local_date) && isTime(pickupEp.local_time);
      const pickupDate = pickupUsable ? pickupEp!.local_date : dateOf(r.reservation_time);
      const pickupTime = pickupUsable ? pickupEp!.local_time : timeOf(r.reservation_time);
      if (isDate(pickupDate) && isTime(pickupTime)) {
        const zone = pickupUsable
          ? (pickupEp!.timezone || resolveTimeZone(pickupEp!.lat, pickupEp!.lng))
          : resolveTimeZone(r.place_lat, r.place_lng);
        carMarker('pickup', `Pickup: ${r.title}`, pickupDate!, pickupTime!, zone);
      }

      const dropUsable = dropEp && isDate(dropEp.local_date) && isTime(dropEp.local_time);
      const dropDate = dropUsable ? dropEp!.local_date : (dateOf(r.reservation_end_time) || dateOf(r.reservation_time));
      const dropTime = dropUsable ? dropEp!.local_time : timeOf(r.reservation_end_time);
      if (isDate(dropDate) && isTime(dropTime)) {
        const zone = dropUsable
          ? (dropEp!.timezone || resolveTimeZone(dropEp!.lat, dropEp!.lng))
          : resolveTimeZone(r.place_lat, r.place_lng);
        carMarker('dropoff', `Drop-off: ${r.title}`, dropDate!, dropTime!, zone);
      }
    }

    // Every referenced zone gets a VTIMEZONE. They are emitted before the first
    // event so the TZID references resolve; keyed by TZID so a merged calendar
    // can define each one once.
    const timezones = new Map<string, string>();
    for (const [zone, yyyymmdd] of usedZones) timezones.set(zone, buildVTimezone(zone, yyyymmdd));

    const safeFilename = (trip.title || 'trek-trip').replace(/["\r\n]/g, '').replace(/[^\w\s.-]/g, '_');
    return {
      calName: esc(trip.title || 'TREK Trip'),
      filename: `${safeFilename}.ics`,
      timezones,
      events,
    };
  }

  /** One trip's calendar as a finished, foldable VCALENDAR document. */
  exportICS(tripId: string | number): { ics: string; filename: string } {
    const cal = this.buildTripCalendar(tripId);
    const ics =
      CALENDAR_HEADER +
      `X-WR-CALNAME:${cal.calName}\r\n` +
      [...cal.timezones.values()].join('') +
      cal.events.join('') +
      'END:VCALENDAR\r\n';
    return { ics: foldICS(ics), filename: cal.filename };
  }
}
