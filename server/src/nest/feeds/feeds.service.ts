import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { CalendarService, CALENDAR_HEADER, foldICS } from '../calendar/calendar.service';

/** Subscribable calendars advertise how often to re-fetch; the one-time download does not. */
const FEED_REFRESH_HINTS = 'REFRESH-INTERVAL;VALUE=DURATION:PT1H\r\nX-PUBLISHED-TTL:PT1H\r\n';

const ninetyDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString().slice(0, 10);
};

function feedUrl(token: string, scope: 'trip' | 'user', base: string): string {
  return `${base.replace(/\/$/, '')}/api/feed/${scope}/${token}.ics`;
}

@Injectable()
export class FeedsService {
  constructor(
    private readonly dbs: DatabaseService,
    private readonly calendar: CalendarService,
  ) {}

  private get db() {
    return this.dbs.connection;
  }

  // ── Trip feed token ─────────────────────────────────────────────────────

  private tripTokenRow(tripId: string, userId: number) {
    return this.db
      .prepare(
        'SELECT feed_token FROM trips WHERE id = ? AND (user_id = ? OR id IN (SELECT trip_id FROM trip_members WHERE user_id = ?))',
      )
      .get(tripId, userId, userId) as { feed_token: string | null } | undefined;
  }

  getTripToken(tripId: string, userId: number, base: string): { feed_url: string | null } {
    const row = this.tripTokenRow(tripId, userId);
    return { feed_url: row?.feed_token ? feedUrl(row.feed_token, 'trip', base) : null };
  }

  /**
   * The three writes carry the acting user and scope the UPDATE to a trip that
   * user can reach, the same predicate tripTokenRow reads through. The route
   * guard is what decides whether they may manage the credential at all; this is
   * the second lock, so a caller that reaches the service another way cannot
   * mint or clear a token on a trip id it merely guessed.
   */
  private static readonly REACHABLE =
    'id = ? AND (user_id = ? OR id IN (SELECT trip_id FROM trip_members WHERE user_id = ?))';

  /** Enable (idempotent): mint a token only if the trip has none yet. */
  generateTripToken(tripId: string, userId: number, base: string): { feed_url: string } {
    const row = this.tripTokenRow(tripId, userId);
    if (row?.feed_token) return { feed_url: feedUrl(row.feed_token, 'trip', base) };
    const token = randomUUID();
    this.db
      .prepare(`UPDATE trips SET feed_token = ? WHERE ${FeedsService.REACHABLE}`)
      .run(token, tripId, userId, userId);
    return { feed_url: feedUrl(token, 'trip', base) };
  }

  /** Rotate: always issue a fresh token, invalidating the previous URL. */
  rotateTripToken(tripId: string, userId: number, base: string): { feed_url: string } {
    const token = randomUUID();
    this.db
      .prepare(`UPDATE trips SET feed_token = ? WHERE ${FeedsService.REACHABLE}`)
      .run(token, tripId, userId, userId);
    return { feed_url: feedUrl(token, 'trip', base) };
  }

  /** Disable: clear the token so the public URL stops resolving. */
  disableTripToken(tripId: string, userId: number): void {
    this.db
      .prepare(`UPDATE trips SET feed_token = NULL WHERE ${FeedsService.REACHABLE}`)
      .run(tripId, userId, userId);
  }

  // ── User (all-trips) feed token ──────────────────────────────────────────

  getUserToken(userId: number, base: string): { feed_url: string | null } {
    const row = this.db.prepare('SELECT feed_token FROM users WHERE id = ?').get(userId) as
      | { feed_token: string | null }
      | undefined;
    return { feed_url: row?.feed_token ? feedUrl(row.feed_token, 'user', base) : null };
  }

  generateUserToken(userId: number, base: string): { feed_url: string } {
    const existing = this.getUserToken(userId, base);
    if (existing.feed_url) return { feed_url: existing.feed_url };
    const token = randomUUID();
    this.db.prepare('UPDATE users SET feed_token = ? WHERE id = ?').run(token, userId);
    return { feed_url: feedUrl(token, 'user', base) };
  }

  rotateUserToken(userId: number, base: string): { feed_url: string } {
    const token = randomUUID();
    this.db.prepare('UPDATE users SET feed_token = ? WHERE id = ?').run(token, userId);
    return { feed_url: feedUrl(token, 'user', base) };
  }

  disableUserToken(userId: number): void {
    this.db.prepare('UPDATE users SET feed_token = NULL WHERE id = ?').run(userId);
  }

  // ── ICS generation ───────────────────────────────────────────────────────

  buildTripIcs(token: string): { ics: string; filename: string } | null {
    const row = this.db.prepare('SELECT id FROM trips WHERE feed_token = ?').get(token) as
      | { id: number }
      | undefined;
    if (!row) return null;
    try {
      const cal = this.calendar.buildTripCalendar(row.id);
      // Same document as the one-time download, plus the subscription refresh
      // hints so clients re-fetch hourly. Assembled from the calendar's parts
      // rather than string-surgeried into the finished text.
      const ics = foldICS(
        CALENDAR_HEADER +
          FEED_REFRESH_HINTS +
          `X-WR-CALNAME:${cal.calName}\r\n` +
          [...cal.timezones.values()].join('') +
          cal.events.join('') +
          'END:VCALENDAR\r\n',
      );
      return { ics, filename: cal.filename };
    } catch {
      return null;
    }
  }

  buildUserIcs(token: string): { ics: string; calName: string } | null {
    const user = this.db.prepare('SELECT id, username FROM users WHERE feed_token = ?').get(token) as
      | { id: number; username: string }
      | undefined;
    if (!user) return null;

    const cutoff = ninetyDaysAgo();
    // "All Trips" means every trip the user can open — trips they own AND trips shared with
    // them as a member — mirroring the single-trip feed's access (tripTokenRow/assertAccess).
    // A membership WHERE on trips selects each row once, so owned + member trips don't dupe.
    const trips = this.db
      .prepare(
        `SELECT id FROM trips
         WHERE (user_id = ? OR id IN (SELECT trip_id FROM trip_members WHERE user_id = ?))
           AND is_archived = 0
           AND (end_date IS NULL OR end_date >= ?)
         ORDER BY start_date ASC`,
      )
      .all(user.id, user.id, cutoff) as { id: number }[];

    const esc = (s: string) =>
      s.replaceAll('\\', '\\\\').replaceAll(';', '\\;').replaceAll(',', '\\,').replace(/\r?\n/g, '\\n');

    const calName = `${user.username} – All Trips`;
    let header = CALENDAR_HEADER;
    header += `X-WR-CALNAME:${esc(calName)}\r\n`;
    header += FEED_REFRESH_HINTS;

    // VTIMEZONE blocks are deduped by TZID across all trips and emitted once in
    // the combined header, before any VEVENT, so per-trip TZID references still
    // resolve (#1453). The parts come from the calendar itself now — this used
    // to scan each finished document back apart line by line.
    const zones = new Map<string, string>();
    let events = '';
    for (const { id } of trips) {
      try {
        const cal = this.calendar.buildTripCalendar(id);
        for (const [tzid, block] of cal.timezones) {
          if (!zones.has(tzid)) zones.set(tzid, block);
        }
        events += cal.events.join('');
      } catch {
        // skip failed trips
      }
    }

    // Only the body is folded. The header carries a user-chosen display name and
    // has never been folded here; folding it now would wrap X-WR-CALNAME for
    // anyone with a long username.
    const combined = header + foldICS([...zones.values()].join('') + events) + 'END:VCALENDAR\r\n';
    return { ics: combined, calName };
  }
}
