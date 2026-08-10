import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ReservationsService } from '../reservations/reservations.service';
import { addDays } from '../days/days.service';
import { resolveTimeZone } from '../common/timezoneService';
import { NotFoundError } from '../common/domain-errors';

// ── ICS folding ─────────────────────────────────────────────────────────────

// RFC 5545 §3.1: content lines longer than 75 octets must be folded with a CRLF
// followed by a single leading space. We fold on UTF-8 *octet* boundaries and
// never split a multi-byte codepoint, so non-ASCII titles/notes (accents, CJK,
// emoji) stay intact. Applied to the whole calendar, so both the one-time
// download and the subscribable feed emit spec-compliant output.
function foldICS(ics: string): string {
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

  exportICS(tripId: string | number): { ics: string; filename: string } {
    const trip = this.db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId) as any;
    if (!trip) throw new NotFoundError('Trip not found');

    const reservations = this.db
      .prepare(
        `SELECT r.*, pl.lat AS place_lat, pl.lng AS place_lng
         FROM reservations r
         LEFT JOIN places pl ON r.place_id = pl.id
         WHERE r.trip_id = ?`,
      )
      .all(tripId) as any[];

    const esc = (s: string) => s
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n')
      .replace(/\r/g, '');
    const fmtDate = (d: string) => d.replace(/-/g, '');
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
      // Time-only: combine with reference date
      if (refDate && d.match(/^\d{2}:\d{2}/)) {
        const datePart = refDate.split('T')[0];
        return `${datePart}T${d.replace(/:/g, '')}00`.replace(/-/g, '');
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

    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//TREK//Travel Planner//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n';
    ics += `X-WR-CALNAME:${esc(trip.title || 'TREK Trip')}\r\n`;

    // Trip as all-day event. DTEND is exclusive, so it must be the day *after* the last
    // day. addDays() stays in UTC — building a local-time Date here dropped the trip's
    // last day on any server east of Greenwich (#1453).
    if (trip.start_date && trip.end_date) {
      const endStr = fmtDate(addDays(trip.end_date, 1));
      ics += `BEGIN:VEVENT\r\nUID:${uid(trip.id, 'trip')}\r\nDTSTAMP:${now}\r\nDTSTART;VALUE=DATE:${fmtDate(trip.start_date)}\r\nDTEND;VALUE=DATE:${endStr}\r\nSUMMARY:${esc(trip.title || 'Trip')}\r\n`;
      if (trip.description) ics += `DESCRIPTION:${esc(trip.description)}\r\n`;
      ics += `END:VEVENT\r\n`;
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
        ics += `BEGIN:VEVENT\r\nUID:${uid(a.id, 'assign')}\r\nDTSTAMP:${now}\r\n`;
        ics += dtLine('DTSTART', a.effective_time, zone, day.date + 'T00:00');
        if (a.effective_end_time) {
          ics += dtLine('DTEND', a.effective_end_time, zone, day.date + 'T00:00');
        }
        ics += `SUMMARY:${esc(a.place_name)}\r\n`;
        let desc = '';
        if (a.notes) desc += a.notes;
        if (a.place_address) desc += (desc ? '\n' : '') + a.place_address;
        if (desc) ics += `DESCRIPTION:${esc(desc)}\r\n`;
        if (a.place_address) ics += `LOCATION:${esc(a.place_address)}\r\n`;
        ics += `END:VEVENT\r\n`;
      }

      // Build all-day summary event if there are untimed activities or notes
      if (untimed.length > 0 || notes.length > 0) {
        const dayTitle = day.title || `Day ${day.day_number}`;
        const endStr = fmtDate(addDays(day.date, 1));

        ics += `BEGIN:VEVENT\r\nUID:${uid(day.id, 'day')}\r\nDTSTAMP:${now}\r\n`;
        ics += `DTSTART;VALUE=DATE:${fmtDate(day.date)}\r\nDTEND;VALUE=DATE:${endStr}\r\n`;
        ics += `SUMMARY:${esc(dayTitle)}\r\n`;

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
        if (desc) ics += `DESCRIPTION:${esc(desc)}\r\n`;
        ics += `END:VEVENT\r\n`;
      }
    }

    // Transport/flight reservations carry no top-level reservation_time; their
    // times live per endpoint (local_date + local_time) in reservation_endpoints.
    const endpointsMap = this.reservations.loadEndpointsByTrip(tripId);
    const isDate = (s: string | null | undefined) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
    const isTime = (s: string | null | undefined) => !!s && /^\d{2}:\d{2}/.test(s);

    // Build the DTSTART/DTEND lines for a reservation, or null when it has no
    // calendar-placeable time. Hotels/restaurants use reservation_time; flights
    // fall back to their first/last endpoint.
    const buildReservationTimeLines = (r: any): string | null => {
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
        return `DTSTART;VALUE=DATE:${fmtDate(r.reservation_time)}\r\n`;
      }

      const eps = endpointsMap.get(r.id);
      if (!eps || eps.length === 0) return null;
      const ordered = [...eps].sort((a, b) => a.sequence - b.sequence);
      const first = ordered[0];
      const last = ordered[ordered.length - 1];
      if (!isDate(first.local_date)) return null;
      if (isTime(first.local_time)) {
        // Transport: departure endpoint zone drives DTSTART, arrival drives DTEND.
        // Prefer the stored IANA zone; fall back to the endpoint's coordinates.
        const startZone = first.timezone || resolveTimeZone(first.lat, first.lng);
        let out = dtLine('DTSTART', `${first.local_date}T${first.local_time}`, startZone);
        if (last !== first && isDate(last.local_date) && isTime(last.local_time)) {
          const endZone = last.timezone || resolveTimeZone(last.lat, last.lng);
          out += dtLine('DTEND', `${last.local_date}T${last.local_time}`, endZone);
        }
        return out;
      }
      return `DTSTART;VALUE=DATE:${fmtDate(first.local_date)}\r\n`;
    };

    // Reservations as events
    for (const r of reservations) {
      const timeLines = buildReservationTimeLines(r);
      if (!timeLines) continue;
      const meta = r.metadata ? (typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata) : {};

      ics += `BEGIN:VEVENT\r\nUID:${uid(r.id, 'res')}\r\nDTSTAMP:${now}\r\n`;
      ics += timeLines;
      ics += `SUMMARY:${esc(r.title)}\r\n`;

      let desc = r.type ? `Type: ${r.type}` : '';
      if (r.confirmation_number) desc += `\nConfirmation: ${r.confirmation_number}`;
      if (meta.airline) desc += `\nAirline: ${meta.airline}`;
      if (meta.flight_number) desc += `\nFlight: ${meta.flight_number}`;
      if (Array.isArray(meta.legs) && meta.legs.length > 1) {
        // Multi-leg flight: show the whole route (FRA → BER → HND) on one event.
        const stops = [meta.legs[0]?.from, ...meta.legs.map((l: { to?: string }) => l.to)].filter(Boolean);
        if (stops.length) desc += `\nRoute: ${stops.join(' → ')}`;
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
      if (desc) ics += `DESCRIPTION:${esc(desc)}\r\n`;
      if (r.location) ics += `LOCATION:${esc(r.location)}\r\n`;
      ics += `END:VEVENT\r\n`;
    }

    ics += 'END:VCALENDAR\r\n';

    // Define every referenced zone with a VTIMEZONE, inserted before the first
    // event so TZID references resolve. No-op when no timed event carried a zone.
    if (usedZones.size > 0) {
      let vtz = '';
      for (const [zone, yyyymmdd] of usedZones) vtz += buildVTimezone(zone, yyyymmdd);
      ics = ics.replace('BEGIN:VEVENT', vtz + 'BEGIN:VEVENT');
    }

    const safeFilename = (trip.title || 'trek-trip').replace(/["\r\n]/g, '').replace(/[^\w\s.-]/g, '_');
    return { ics: foldICS(ics), filename: `${safeFilename}.ics` };
  }
}
