import {
  TripJournalLinkMembersRole,
  type TTripJournalLinkMembersRole,
} from '../entities/TripJournalLinkMembers.entity';
import type { TripJournalLinks } from '../entities/TripJournalLinks.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

import type { Kysely } from 'kysely';

/** The tables a link's reach is read from. */
export type TripJournalLinkKyselyDB = Pick<
  DB,
  'trip_journal_links' | 'trip_journal_link_members' | 'trips' | 'trip_members' | 'journeys' | 'users'
>;

/** The role a link gives, as the migration's CHECK and the generated entity spell it. */
export type TripJournalLinkRole = TTripJournalLinkMembersRole;

const { EDITOR, VIEWER } = TripJournalLinkMembersRole;

/** A trip's link with the journal it shows, as the settings dialog reads it. */
export interface TripJournalLinkRow {
  trip_id: number;
  journey_id: number;
  linked_by: number | null;
  created_at: number;
  journey_title: string;
  journey_subtitle: string | null;
  journey_cover_image: string | null;
  journey_owner_id: number;
}

/** Someone on the trip, as the member picker lists them. */
export interface TripPersonRow {
  user_id: number;
  username: string;
  avatar: string | null;
  is_guest: boolean;
  is_trip_owner: boolean;
}

/** One person the link lets into its journal. */
export interface TripJournalLinkMemberRow {
  user_id: number;
  role: TripJournalLinkRole;
  username: string;
  avatar: string | null;
}

/**
 * The link members who still belong to the linking trip, as its owner or on its
 * roster, with the link they hold. Every read of link access starts here, so
 * leaving a trip ends what its link gave in the same instant, whether or not
 * anything cleaned up after it. A caller narrows it by journal or by person and
 * picks its own columns.
 */
export function linkReach(db: Kysely<TripJournalLinkKyselyDB>) {
  return db
    .selectFrom('trip_journal_links as l')
    .innerJoin('trip_journal_link_members as m', 'm.link_id', 'l.id')
    .innerJoin('trips as t', 't.id', 'l.trip_id')
    .where((eb) =>
      eb.or([
        eb('t.user_id', '=', eb.ref('m.user_id')),
        eb.exists(
          eb
            .selectFrom('trip_members as tm')
            .select('tm.id')
            .whereRef('tm.trip_id', '=', 'l.trip_id')
            .whereRef('tm.user_id', '=', 'm.user_id'),
        ),
      ]),
    );
}

/** The stronger of two link roles; a person linked through two trips gets the better one. */
function strongest(roles: string[]): TripJournalLinkRole | null {
  if (roles.includes(EDITOR)) return EDITOR;
  return roles.length > 0 ? VIEWER : null;
}

/** The role a person holds on a journal through any trip's link, or null when none lets them in. */
export async function readLinkRole(
  db: Kysely<TripJournalLinkKyselyDB>,
  journeyId: number,
  userId: number,
): Promise<TripJournalLinkRole | null> {
  const rows = await linkReach(db)
    .select('m.role')
    .where('l.journey_id', '=', journeyId)
    .where('m.user_id', '=', userId)
    .execute();
  return strongest(rows.map((r) => r.role));
}

/** A link member's own "hide skeletons" choice on the journal, or null when no link lets them in. */
export async function readLinkHideSkeletons(
  db: Kysely<TripJournalLinkKyselyDB>,
  journeyId: number,
  userId: number,
): Promise<number | null> {
  const row = await linkReach(db)
    .select('m.hide_skeletons')
    .where('l.journey_id', '=', journeyId)
    .where('m.user_id', '=', userId)
    .executeTakeFirst();
  return row?.hide_skeletons ?? null;
}

/**
 * `trip_journal_links` and its members: which journal a trip shows, and who
 * of the trip may read or write it through that link. The access this table
 * gives is read through {@link linkReach} everywhere, never copied into
 * `journey_contributors`, so a direct contributor's role is never overwritten
 * and undoing a link takes away exactly what it gave.
 */
export class TripJournalLinksRepository extends TrekRepository<TripJournalLinks> {
  /** The trip's link with its journal's title and cover, or null without one. */
  async findForTrip(tripId: number): Promise<TripJournalLinkRow | null> {
    const row = await this.kysely<TripJournalLinkKyselyDB>()
      .selectFrom('trip_journal_links as l')
      .innerJoin('journeys as j', 'j.id', 'l.journey_id')
      .select([
        'l.trip_id',
        'l.journey_id',
        'l.linked_by',
        'l.created_at',
        'j.title as journey_title',
        'j.subtitle as journey_subtitle',
        'j.cover_image as journey_cover_image',
        'j.user_id as journey_owner_id',
      ])
      .where('l.trip_id', '=', tripId)
      .executeTakeFirst();
    return row ?? null;
  }

  /** The people the trip's link lets in, still on the trip or not, with their name for the list. */
  async listMembers(tripId: number): Promise<TripJournalLinkMemberRow[]> {
    const rows = await this.kysely<TripJournalLinkKyselyDB>()
      .selectFrom('trip_journal_link_members as m')
      .innerJoin('trip_journal_links as l', 'l.id', 'm.link_id')
      .innerJoin('users as u', 'u.id', 'm.user_id')
      .select(['m.user_id', 'm.role', 'u.username', 'u.avatar'])
      .where('l.trip_id', '=', tripId)
      .orderBy('u.username', 'asc')
      .execute();
    return rows.map((r) => ({ ...r, role: r.role === EDITOR ? EDITOR : VIEWER }));
  }

  /** Everyone on the trip, its owner first, with what the member picker shows of them. */
  async listTripPeople(tripId: number): Promise<TripPersonRow[]> {
    const db = this.kysely<TripJournalLinkKyselyDB>();
    const owner = await db
      .selectFrom('trips as t')
      .innerJoin('users as u', 'u.id', 't.user_id')
      .select(['u.id as user_id', 'u.username', 'u.avatar', 'u.is_guest'])
      .where('t.id', '=', tripId)
      .executeTakeFirst();
    const members = await db
      .selectFrom('trip_members as tm')
      .innerJoin('users as u', 'u.id', 'tm.user_id')
      .select(['u.id as user_id', 'u.username', 'u.avatar', 'u.is_guest'])
      .where('tm.trip_id', '=', tripId)
      .orderBy('u.username', 'asc')
      .execute();
    const people = owner ? [{ ...owner, is_trip_owner: true }] : [];
    for (const m of members) if (m.user_id !== owner?.user_id) people.push({ ...m, is_trip_owner: false });
    return people.map((p) => ({ ...p, is_guest: p.is_guest === 1 }));
  }

  /** Points the trip at a journal, replacing the one it showed; the link keeps its id. */
  async upsertLink(tripId: number, journeyId: number, linkedBy: number, now: number): Promise<void> {
    await this.kysely<TripJournalLinkKyselyDB>()
      .insertInto('trip_journal_links')
      .values({ trip_id: tripId, journey_id: journeyId, linked_by: linkedBy, created_at: now })
      .onConflict((oc) =>
        oc.column('trip_id').doUpdateSet({ journey_id: journeyId, linked_by: linkedBy, created_at: now }),
      )
      .execute();
  }

  /** The id of the trip's link, as a subquery the member writes narrow by. */
  private linkIdOf(tripId: number) {
    return this.kysely<TripJournalLinkKyselyDB>()
      .selectFrom('trip_journal_links')
      .select('id')
      .where('trip_id', '=', tripId);
  }

  /** Sets who the trip's link lets in, replacing the list it had. */
  async replaceMembers(
    tripId: number,
    members: { user_id: number; role: TripJournalLinkRole }[],
    now: number,
  ): Promise<void> {
    const db = this.kysely<TripJournalLinkKyselyDB>();
    const link = await this.linkIdOf(tripId).executeTakeFirst();
    if (!link) return;
    await db.deleteFrom('trip_journal_link_members').where('link_id', '=', link.id).execute();
    if (members.length === 0) return;
    await db
      .insertInto('trip_journal_link_members')
      .values(members.map((m) => ({ link_id: link.id, user_id: m.user_id, role: m.role, added_at: now })))
      .execute();
  }

  /** Removes the trip's link; its members go with it. */
  async deleteForTrip(tripId: number): Promise<void> {
    await this.kysely<TripJournalLinkKyselyDB>()
      .deleteFrom('trip_journal_links')
      .where('trip_id', '=', tripId)
      .execute();
  }
}
