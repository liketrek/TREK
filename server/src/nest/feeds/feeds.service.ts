import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { db } from '../../db/database';
import { exportICS } from '../../services/tripService';

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
  // ── Trip feed token ─────────────────────────────────────────────────────

  private tripTokenRow(tripId: string, userId: number) {
    return db
      .prepare(
        'SELECT feed_token FROM trips WHERE id = ? AND (user_id = ? OR id IN (SELECT trip_id FROM trip_members WHERE user_id = ?))',
      )
      .get(tripId, userId, userId) as { feed_token: string | null } | undefined;
  }

  getTripToken(tripId: string, userId: number, base: string): { feed_url: string | null } {
    const row = this.tripTokenRow(tripId, userId);
    return { feed_url: row?.feed_token ? feedUrl(row.feed_token, 'trip', base) : null };
  }

  /** Enable (idempotent): mint a token only if the trip has none yet. */
  generateTripToken(tripId: string, userId: number, base: string): { feed_url: string } {
    const row = this.tripTokenRow(tripId, userId);
    if (row?.feed_token) return { feed_url: feedUrl(row.feed_token, 'trip', base) };
    const token = randomUUID();
    db.prepare('UPDATE trips SET feed_token = ? WHERE id = ?').run(token, tripId);
    return { feed_url: feedUrl(token, 'trip', base) };
  }

  /** Rotate: always issue a fresh token, invalidating the previous URL. */
  rotateTripToken(tripId: string, base: string): { feed_url: string } {
    const token = randomUUID();
    db.prepare('UPDATE trips SET feed_token = ? WHERE id = ?').run(token, tripId);
    return { feed_url: feedUrl(token, 'trip', base) };
  }

  /** Disable: clear the token so the public URL stops resolving. */
  disableTripToken(tripId: string): void {
    db.prepare('UPDATE trips SET feed_token = NULL WHERE id = ?').run(tripId);
  }

  // ── User (all-trips) feed token ──────────────────────────────────────────

  getUserToken(userId: number, base: string): { feed_url: string | null } {
    const row = db.prepare('SELECT feed_token FROM users WHERE id = ?').get(userId) as
      | { feed_token: string | null }
      | undefined;
    return { feed_url: row?.feed_token ? feedUrl(row.feed_token, 'user', base) : null };
  }

  generateUserToken(userId: number, base: string): { feed_url: string } {
    const existing = this.getUserToken(userId, base);
    if (existing.feed_url) return { feed_url: existing.feed_url };
    const token = randomUUID();
    db.prepare('UPDATE users SET feed_token = ? WHERE id = ?').run(token, userId);
    return { feed_url: feedUrl(token, 'user', base) };
  }

  rotateUserToken(userId: number, base: string): { feed_url: string } {
    const token = randomUUID();
    db.prepare('UPDATE users SET feed_token = ? WHERE id = ?').run(token, userId);
    return { feed_url: feedUrl(token, 'user', base) };
  }

  disableUserToken(userId: number): void {
    db.prepare('UPDATE users SET feed_token = NULL WHERE id = ?').run(userId);
  }

  // ── ICS generation ───────────────────────────────────────────────────────

  buildTripIcs(token: string): { ics: string; filename: string } | null {
    const row = db.prepare('SELECT id FROM trips WHERE feed_token = ?').get(token) as
      | { id: number }
      | undefined;
    if (!row) return null;
    try {
      const { ics, filename } = exportICS(row.id);
      // Inject calendar-subscription refresh hints into the VCALENDAR header so
      // clients re-fetch hourly. The one-time download path (exportICS) is left
      // untouched; this is feed-only.
      const withHints = ics.replace(
        'METHOD:PUBLISH\r\n',
        'METHOD:PUBLISH\r\nREFRESH-INTERVAL;VALUE=DURATION:PT1H\r\nX-PUBLISHED-TTL:PT1H\r\n',
      );
      return { ics: withHints, filename };
    } catch {
      return null;
    }
  }

  buildUserIcs(token: string): { ics: string; calName: string } | null {
    const user = db.prepare('SELECT id, username FROM users WHERE feed_token = ?').get(token) as
      | { id: number; username: string }
      | undefined;
    if (!user) return null;

    const cutoff = ninetyDaysAgo();
    const trips = db
      .prepare(
        `SELECT id FROM trips
         WHERE user_id = ?
           AND is_archived = 0
           AND (end_date IS NULL OR end_date >= ?)
         ORDER BY start_date ASC`,
      )
      .all(user.id, cutoff) as { id: number }[];

    const esc = (s: string) =>
      s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

    const calName = `${user.username} – All Trips`;
    let combined =
      'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//TREK//Travel Planner//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n';
    combined += `X-WR-CALNAME:${esc(calName)}\r\n`;
    combined += 'REFRESH-INTERVAL;VALUE=DURATION:PT1H\r\nX-PUBLISHED-TTL:PT1H\r\n';

    for (const { id } of trips) {
      try {
        const { ics } = exportICS(id);
        combined += extractVEvents(ics);
      } catch {
        // skip failed trips
      }
    }

    combined += 'END:VCALENDAR\r\n';
    return { ics: combined, calName };
  }
}

// Pull the VEVENT blocks out of a single-trip calendar by structural line
// scanning rather than a lazy regex on "END:VEVENT". User-supplied text (escaped
// onto a SUMMARY/DESCRIPTION line) can legitimately contain the literal
// "END:VEVENT", which a non-greedy regex would mistake for a terminator and
// truncate the event. Folded continuation lines always begin with a space, so a
// bare "BEGIN:VEVENT"/"END:VEVENT" only ever appears as a real delimiter.
function extractVEvents(ics: string): string {
  let out = '';
  let inside = false;
  for (const line of ics.split('\r\n')) {
    if (line === 'BEGIN:VEVENT') inside = true;
    if (inside) out += line + '\r\n';
    if (line === 'END:VEVENT') inside = false;
  }
  return out;
}
