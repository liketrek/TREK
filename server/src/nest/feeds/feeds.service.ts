import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { db } from '../../db/database';
import { exportICS } from '../../services/tripService';

const ninetyDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString().slice(0, 10);
};

function feedUrl(token: string, scope: 'trip' | 'user'): string {
  const base = (process.env.APP_URL || '').replace(/\/$/, '');
  return `${base}/api/feed/${scope}/${token}.ics`;
}

@Injectable()
export class FeedsService {
  // ── Trip feed token ─────────────────────────────────────────────────────

  getTripToken(tripId: string, userId: number): { feed_url: string } | null {
    const row = db
      .prepare('SELECT feed_token FROM trips WHERE id = ? AND (user_id = ? OR id IN (SELECT trip_id FROM trip_members WHERE user_id = ?))')
      .get(tripId, userId, userId) as { feed_token: string | null } | undefined;
    if (!row || !row.feed_token) return null;
    return { feed_url: feedUrl(row.feed_token, 'trip') };
  }

  generateTripToken(tripId: string, userId: number): { feed_url: string } {
    const existing = this.getTripToken(tripId, userId);
    if (existing) return existing;
    const token = randomUUID();
    db.prepare('UPDATE trips SET feed_token = ? WHERE id = ?').run(token, tripId);
    return { feed_url: feedUrl(token, 'trip') };
  }

  regenerateTripToken(tripId: string, userId: number): { feed_url: string } {
    const trip = db
      .prepare('SELECT id FROM trips WHERE id = ? AND (user_id = ? OR id IN (SELECT trip_id FROM trip_members WHERE user_id = ?))')
      .get(tripId, userId, userId);
    if (!trip) return { feed_url: '' };
    const token = randomUUID();
    db.prepare('UPDATE trips SET feed_token = ? WHERE id = ?').run(token, tripId);
    return { feed_url: feedUrl(token, 'trip') };
  }

  // ── User (all-trips) feed token ──────────────────────────────────────────

  getUserToken(userId: number): { feed_url: string } | null {
    const row = db.prepare('SELECT feed_token FROM users WHERE id = ?').get(userId) as
      | { feed_token: string | null }
      | undefined;
    if (!row || !row.feed_token) return null;
    return { feed_url: feedUrl(row.feed_token, 'user') };
  }

  generateUserToken(userId: number): { feed_url: string } {
    const existing = this.getUserToken(userId);
    if (existing) return existing;
    const token = randomUUID();
    db.prepare('UPDATE users SET feed_token = ? WHERE id = ?').run(token, userId);
    return { feed_url: feedUrl(token, 'user') };
  }

  regenerateUserToken(userId: number): { feed_url: string } {
    const token = randomUUID();
    db.prepare('UPDATE users SET feed_token = ? WHERE id = ?').run(token, userId);
    return { feed_url: feedUrl(token, 'user') };
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

    let combined =
      'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//TREK//Travel Planner//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n';
    combined += `X-WR-CALNAME:${esc(user.username + ' – All Trips')}\r\n`;
    combined += 'REFRESH-INTERVAL;VALUE=DURATION:PT1H\r\nX-PUBLISHED-TTL:PT1H\r\n';

    for (const { id } of trips) {
      try {
        const { ics } = exportICS(id);
        // Strip outer VCALENDAR wrapper and extract VEVENT blocks
        const events = [...ics.matchAll(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g)].map((m) => m[0]);
        for (const ev of events) combined += ev + '\r\n';
      } catch {
        // skip failed trips
      }
    }

    combined += 'END:VCALENDAR\r\n';
    return { ics: combined, calName: user.username + ' – All Trips' };
  }
}
