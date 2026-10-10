import { Trips } from '../../db/entities/Trips.entity';
import { Users } from '../../db/entities/Users.entity';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import { CalendarService, CALENDAR_HEADER, foldICS } from '../calendar/calendar.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

import { randomUUID } from 'crypto';

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
    @InjectRepository(Trips) private readonly tripsRepo: TripsRepository,
    @InjectRepository(Users) private readonly usersRepo: UsersRepository,
    private readonly calendar: CalendarService,
  ) {}

  // ── Trip feed token ─────────────────────────────────────────────────────

  async getTripToken(tripId: number, userId: number, base: string): Promise<{ feed_url: string | null }> {
    const token = await this.tripsRepo.getFeedTokenIfReachable(tripId, userId);
    return { feed_url: token ? feedUrl(token, 'trip', base) : null };
  }

  /**
   * Enable (idempotent): mint a token only if the trip has none yet.
   *
   * R4 (inventory §18.7, mirrored on purpose): `getFeedTokenIfReachable`
   * (FD1) is the check, `setFeedTokenIfReachable` (FD2) is the act, and the
   * two are un-transacted (R7). If the acting user cannot reach `tripId` at
   * all, FD1 finds nothing, a fresh token is minted anyway, and the write
   * below affects 0 rows — but the URL for that never-stored token is still
   * returned. Only reachable past `TripAccessGuard` + `share_manage` (REST)
   * or `FeedsMcp.denyTripFeed` (MCP), so not exploitable today; kept exactly
   * as the legacy service behaved, not "fixed" here. See the task report for
   * the one-line fix proposal.
   */
  async generateTripToken(tripId: number, userId: number, base: string): Promise<{ feed_url: string }> {
    const existing = await this.tripsRepo.getFeedTokenIfReachable(tripId, userId);
    if (existing) return { feed_url: feedUrl(existing, 'trip', base) };
    const token = randomUUID();
    await this.tripsRepo.setFeedTokenIfReachable(tripId, userId, token);
    return { feed_url: feedUrl(token, 'trip', base) };
  }

  /** Rotate: always issue a fresh token, invalidating the previous URL. */
  async rotateTripToken(tripId: number, userId: number, base: string): Promise<{ feed_url: string }> {
    const token = randomUUID();
    await this.tripsRepo.setFeedTokenIfReachable(tripId, userId, token);
    return { feed_url: feedUrl(token, 'trip', base) };
  }

  /** Disable: clear the token so the public URL stops resolving. */
  async disableTripToken(tripId: number, userId: number): Promise<void> {
    await this.tripsRepo.setFeedTokenIfReachable(tripId, userId, null);
  }

  // ── User (all-trips) feed token ──────────────────────────────────────────

  async getUserToken(userId: number, base: string): Promise<{ feed_url: string | null }> {
    const token = await this.usersRepo.getFeedToken(userId);
    return { feed_url: token ? feedUrl(token, 'user', base) : null };
  }

  async generateUserToken(userId: number, base: string): Promise<{ feed_url: string }> {
    const existing = await this.getUserToken(userId, base);
    if (existing.feed_url) return { feed_url: existing.feed_url };
    const token = randomUUID();
    await this.usersRepo.setFeedToken(userId, token);
    return { feed_url: feedUrl(token, 'user', base) };
  }

  async rotateUserToken(userId: number, base: string): Promise<{ feed_url: string }> {
    const token = randomUUID();
    await this.usersRepo.setFeedToken(userId, token);
    return { feed_url: feedUrl(token, 'user', base) };
  }

  async disableUserToken(userId: number): Promise<void> {
    await this.usersRepo.setFeedToken(userId, null);
  }

  // ── ICS generation ───────────────────────────────────────────────────────

  async buildTripIcs(token: string): Promise<{ ics: string; filename: string } | null> {
    const tripId = await this.tripsRepo.findIdByFeedToken(token);
    if (tripId === undefined) return null;
    try {
      const cal = await this.calendar.buildTripCalendar(tripId);
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

  async buildUserIcs(token: string): Promise<{ ics: string; calName: string } | null> {
    const user = await this.usersRepo.findIdAndUsernameByFeedToken(token);
    if (!user) return null;

    const cutoff = ninetyDaysAgo();
    // "All Trips" means every trip the user can open — trips they own AND trips shared with
    // them as a member — mirroring the single-trip feed's access (getFeedTokenIfReachable).
    // A membership WHERE on trips selects each row once, so owned + member trips don't dupe.
    const tripIds = await this.tripsRepo.listReachableActiveTrips(user.id, cutoff);

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
    for (const id of tripIds) {
      try {
        const cal = await this.calendar.buildTripCalendar(id);
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
