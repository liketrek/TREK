import type { Journeys } from '../entities/Journeys.entity';
import { TrekRepository } from './_shared/trek-repository';

/**
 * `SELECT * FROM journeys WHERE id = ?`'s row — every scalar column the
 * many `SELECT *`-shaped legacy sites (JG5/JG13/JG23/JG25, plus the public
 * JS8/JS12) read. `Journey` (`src/types.ts`) omits `show_verdict`/
 * `show_mood`/`show_weather` (a narrower, pre-existing wire type), so this
 * repository returns the WIDER row and lets it structurally satisfy `Journey`
 * at the call site rather than dropping columns the client's journey-settings
 * UI reads.
 */
export interface JourneyRow {
  id: number;
  user_id: number;
  title: string;
  subtitle: string | null;
  cover_gradient: string | null;
  status: string | null;
  created_at: number;
  updated_at: number;
  cover_image: string | null;
  show_trip_tracks: number;
  show_verdict: number;
  show_mood: number;
  show_weather: number;
  /** Shown state set by hand (#762): draft/live/completed, or null to follow the trip dates. */
  status_override: string | null;
  /** Entries without a place take their first geotagged photo's position (#1003). */
  photo_location: number;
}

/** JG8's dashboard row — `JourneyRow` plus the five correlated-subquery stat pills. */
export interface JourneyListRow extends JourneyRow {
  entry_count: number;
  photo_count: number;
  place_count: number;
  trip_date_min: string | null;
  trip_date_max: string | null;
}

/** The narrow `journeys`/`journey_contributors`/`journey_entries`/`journey_photos`/`journey_trips`/`trips` shape {@link JourneysRepository.listForUser} needs. */
interface JourneyListKyselyDB {
  journeys: {
    id: number;
    user_id: number;
    title: string;
    subtitle: string | null;
    cover_gradient: string | null;
    status: string | null;
    created_at: number;
    updated_at: number;
    cover_image: string | null;
    show_trip_tracks: number;
    show_verdict: number;
    show_mood: number;
    show_weather: number;
    status_override: string | null;
    photo_location: number;
  };
  journey_contributors: { journey_id: number; user_id: number };
  journey_entries: { journey_id: number; type: string; location_name: string | null };
  journey_photos: { journey_id: number };
  journey_trips: { journey_id: number; trip_id: number };
  trips: { id: number; start_date: string | null; end_date: string | null };
}

/** The narrow `journeys`/`journey_contributors` shape {@link JourneysRepository.listRecipientUserIds} needs. */
interface JourneyRecipientsKyselyDB {
  journeys: { id: number; user_id: number };
  journey_contributors: { journey_id: number; user_id: number };
}

/**
 * `journeys` — the root of the journey cluster (Plan 3g Task 1, R9's Part A).
 * Every method here is a Part-A-owned statement (JG1-JG29 group) or a shared
 * primitive Part B (Task 2) also reads (`findById`, `listRecipientUserIds`'s
 * `findOwnerId` half).
 */
export class JourneysRepository extends TrekRepository<Journeys> {
  /** JG3 — `canAccessJourney`'s owner-match primitive: `SELECT * FROM journeys WHERE id = ? AND user_id = ?`. */
  async findOwnedByUser(id: number, user_id: number): Promise<JourneyRow | undefined> {
    return await this.qb('j')
      .select(['j.*'])
      .where({ id, user: user_id })
      .execute<JourneyRow | undefined>('get', false);
  }

  /**
   * JG5 — `SELECT * FROM journeys WHERE id = ?`, the widest dup group in the
   * file (JG5/JG13/JG23/JG25 all resolve here; JS8/JS12, Task 3's own, reuse
   * it too). Unscoped by design: every caller has already gated access
   * (`canAccessJourney`'s contributor branch, a post-write re-select, or —
   * for JS8/JS12 — the public share-token gate, which is deliberately NOT an
   * owner/contributor check).
   */
  async findById(id: number): Promise<JourneyRow | undefined> {
    return await this.qb('j').select(['j.*']).where({ id }).execute<JourneyRow | undefined>('get', false);
  }

  /** JG6 — `isOwner`'s primitive: `SELECT 1 FROM journeys WHERE id = ? AND user_id = ?`. */
  async isOwnedByUser(id: number, user_id: number): Promise<boolean> {
    const row = await this.qb('j')
      .select(['j.id'])
      .where({ id, user: user_id })
      .execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  /**
   * JG2/JG40/JG54 — `SELECT user_id FROM journeys WHERE id = ?`, one
   * statement text reused at three call sites (`broadcastJourneyEvent`'s
   * owner half via {@link listRecipientUserIds}, `onPlaceCreated`'s
   * `authorId` resolution, `reconcileTripSkeletons`'s same resolution).
   */
  async findOwnerId(id: number): Promise<number | undefined> {
    const row = await this.qb('j')
      .select(['j.user'])
      .where({ id })
      .execute<{ user_id: number } | undefined>('get', false);
    return row?.user_id;
  }

  /**
   * `broadcastJourneyEvent`'s recipient set — JG1 (`SELECT user_id FROM
   * journey_contributors WHERE journey_id = ?`) plus JG2 (owner id, reused
   * via {@link findOwnerId} rather than re-derived) — ONE composed, public
   * method (R9's brief: "reused verbatim by the three OTHER identical-text
   * sites" — {@link findOwnerId} is that reused statement). Task 2/3 call
   * this same method for their own `broadcastJourneyEvent` calls.
   */
  async listRecipientUserIds(id: number): Promise<number[]> {
    const contributors = await this.kysely<JourneyRecipientsKyselyDB>()
      .selectFrom('journey_contributors')
      .select('user_id')
      .where('journey_id', '=', id)
      .execute();
    const ids = new Set(contributors.map((c) => c.user_id));
    const ownerId = await this.findOwnerId(id);
    if (ownerId !== undefined) ids.add(ownerId);
    return [...ids];
  }

  /**
   * JG8 — `listJourneys`'s dashboard read: five correlated scalar subqueries
   * (`entry_count`/`photo_count`/`place_count`/`trip_date_min`/
   * `trip_date_max`) over a `LEFT JOIN journey_contributors` scoped to this
   * user. No explicit `.distinct()`: `journey_contributors`' own composite
   * PK (`journey`+`user`) means the join can match at most one contributor
   * row per journey for a fixed `user_id`, so the join can never fan a `j`
   * row out — the same "the join can't duplicate" reasoning
   * `TripsRepository.listOwnedOrMember`'s docstring gives for skipping the
   * legacy statement's own `DISTINCT`.
   */
  async listForUser(user_id: number): Promise<JourneyListRow[]> {
    const rows = await this.kysely<JourneyListKyselyDB>()
      .selectFrom('journeys as j')
      .leftJoin('journey_contributors as jc', (join) => join.onRef('jc.journey_id', '=', 'j.id').on('jc.user_id', '=', user_id))
      .selectAll('j')
      .select((eb) => [
        eb
          .selectFrom('journey_entries as je')
          .select((eb2) => eb2.fn.countAll<number>().as('c'))
          .whereRef('je.journey_id', '=', 'j.id')
          .where('je.type', '!=', 'skeleton')
          .as('entry_count'),
        eb
          .selectFrom('journey_photos as jp')
          .select((eb2) => eb2.fn.countAll<number>().as('c'))
          .whereRef('jp.journey_id', '=', 'j.id')
          .as('photo_count'),
        eb
          .selectFrom('journey_entries as je3')
          .select((eb2) => eb2.fn.count<number>('je3.location_name').distinct().as('c'))
          .whereRef('je3.journey_id', '=', 'j.id')
          .where('je3.location_name', 'is not', null)
          .where('je3.location_name', '!=', '')
          .as('place_count'),
        eb
          .selectFrom('journey_trips as jt')
          .innerJoin('trips as t', 't.id', 'jt.trip_id')
          .select((eb2) => eb2.fn.min<string | null>('t.start_date').as('m'))
          .whereRef('jt.journey_id', '=', 'j.id')
          .as('trip_date_min'),
        eb
          .selectFrom('journey_trips as jt2')
          .innerJoin('trips as t2', 't2.id', 'jt2.trip_id')
          .select((eb2) => eb2.fn.max<string | null>('t2.end_date').as('m'))
          .whereRef('jt2.journey_id', '=', 'j.id')
          .as('trip_date_max'),
      ])
      .where((eb) => eb.or([eb('j.user_id', '=', user_id), eb('jc.user_id', '=', user_id)]))
      .orderBy('j.updated_at', 'desc')
      .execute();
    return rows as JourneyListRow[];
  }

  /** JG9 — `createJourney`'s INSERT: `(user_id, title, subtitle, status, created_at, updated_at)`, `status` hard-coded `'active'` like the legacy statement. */
  async insertJourney(data: { user_id: number; title: string; subtitle: string | null; created_at: number; updated_at: number }): Promise<number> {
    return await this.insert({
      user: data.user_id,
      title: data.title,
      subtitle: data.subtitle,
      status: 'active',
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  }

  /** JG12 — `createJourney`'s cover-image seed: `UPDATE journeys SET cover_image = ? WHERE id = ?`. */
  async updateCoverImage(id: number, cover_image: string): Promise<void> {
    await this.nativeUpdate({ id }, { cover_image });
  }

  /**
   * JG24 — `updateJourney`'s dynamic SET (R6, `presenceSet`). The SERVICE
   * resolves every field to its final bound value first (the `ALLOWED_STATUSES`
   * check, the `BOOLEAN_FIELDS` 0/1 coercion) and decides whether `updated_at`
   * is written at all (the legacy no-op-when-nothing-allow-listed-changed
   * early return) — this method writes exactly the patch it is handed, a
   * no-op call included (caller only calls this when `patch` is non-empty).
   */
  async updateFields(
    id: number,
    patch: Partial<{
      title: string;
      subtitle: string | null;
      cover_gradient: string | null;
      cover_image: string | null;
      status: string;
      status_override: string | null;
      show_trip_tracks: number;
      photo_location: number;
      show_verdict: number;
      show_mood: number;
      show_weather: number;
      updated_at: number;
    }>,
  ): Promise<void> {
    await this.nativeUpdate({ id }, patch);
  }

  /** JG29 — `deleteJourney`: `DELETE FROM journeys WHERE id = ?` (cascades every child table via the entities' `deleteRule('cascade')`). */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  /**
   * UC8 (Plan 3g Task 4 survivor, `UserCleanupService.cleanupUserReferences`)
   * — `DELETE FROM journeys WHERE user_id = ?`: every journey this user
   * owns, cascading to its entries/contributors/share_tokens/photos via the
   * already-declared `deleteRule('cascade')` FKs.
   */
  async deleteOwnedByUser(userId: number): Promise<void> {
    await this.nativeDelete({ user: userId });
  }
}
