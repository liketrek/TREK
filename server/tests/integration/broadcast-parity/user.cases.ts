import { BucketList } from '../../../src/db/entities/BucketList.entity';
import { CollectionLabels } from '../../../src/db/entities/CollectionLabels.entity';
import { DawarichVisitSuggestions } from '../../../src/db/entities/DawarichVisitSuggestions.entity';
import { JourneyBookRevisions } from '../../../src/db/entities/JourneyBookRevisions.entity';
import { JourneyBooks } from '../../../src/db/entities/JourneyBooks.entity';
import { JourneyEntries } from '../../../src/db/entities/JourneyEntries.entity';
import { TripJournalLinks } from '../../../src/db/entities/TripJournalLinks.entity';
import { VacayHolidayCalendars } from '../../../src/db/entities/VacayHolidayCalendars.entity';
import { VacayShares } from '../../../src/db/entities/VacayShares.entity';
import { VacayYears } from '../../../src/db/entities/VacayYears.entity';
import { withRequestContext } from '../../../src/nest/database/request-context';
import { DawarichTracksService } from '../../../src/nest/integrations/dawarich-tracks.service';
import { BOOK_DESIGN_DRAFTS, BookDesignDraftStore } from '../../../src/nest/journey/book-design-draft.store';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { JourneyRecordedDaysService } from '../../../src/nest/journey/journey-recorded-days.service';
import { PhotoCaptureBackfillService } from '../../../src/nest/memories/photo-capture-backfill.service';
import { NotificationsService } from '../../../src/nest/notifications/notifications.service';
import { addCollectionMember } from '../../helpers/factories/collections';
import { inContext } from '../../helpers/factories/context';
import { addJourneyContributor, linkTripToJourney } from '../../helpers/factories/journeys';
import { createRow, insertRow, updateRows } from '../../helpers/factories/rows';
import { addVacayPlanMember } from '../../helpers/factories/vacay';
import { holidayCode } from './harness';
import type { CaseGroup, ParityCase, RestCall, Scene } from './types';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';
import { blankBook, blankSpread, type BookDocument, type DawarichTrackSegment } from '@trek/shared';

import { vi } from 'vitest';

/**
 * A user's own addons: journey, atlas, collections, vacay, dawarich and the
 * school holiday catalog. Their events go to users rather than to a trip room,
 * and every write reaches the writer's own tabs: REST leaves out only the tab
 * that asked, MCP none, so the tab the assistant runs in shows the change.
 */
const HOLIDAY_CATALOG = "the admin's school holiday catalog is global: no room, and the registry has no event for it";
const TOKEN_ONLY = 'manages a public link token: nothing on any screen follows it live, so there is nothing to send';
const onJourney = (s: Scene) => ({ journeyId: s.journey.id });
const WINTER = { name: 'Winter', startDate: '2027-02-01', endDate: '2027-02-12' };

/** The scene's first day, which the Dawarich stays below fall on. */
const DAY = '2027-05-03';
const VACAY = '/api/addons/vacay';
const ATLAS = '/api/addons/atlas';
const COLLECTIONS = '/api/addons/collections';
const DAWARICH = '/api/integrations/dawarich';

const ormOf = (app: INestApplication) => app.get(MikroORM);

/**
 * Rows a case's setup makes beyond the scene's needs, by scene, so its
 * arguments and REST paths can point at them. Each scene makes its own, so
 * the MCP run and the REST run never share one.
 */
const made = new Map<string, number>();
const keep = (s: Scene, key: string, id: number) => made.set(`${s.n}:${key}`, id);
function kept(s: Scene, key: string): number {
  const id = made.get(`${s.n}:${key}`);
  if (id === undefined) throw new Error(`the setup of scene ${s.n} made no ${key}`);
  return id;
}

/** A stay Dawarich recorded for the owner on the scene's first day, waiting for review. */
async function recordStay(s: Scene, app: INestApplication): Promise<void> {
  const row = await createRow(ormOf(app), DawarichVisitSuggestions, {
    user: s.owner.id,
    source_visit_id: `visit-${s.n}`,
    trip: s.trip.id,
    name: `Café de Flore ${s.n}`,
    lat: 48.854,
    lng: 2.3326,
    started_at: `${DAY}T10:00:00+02:00`,
    ended_at: `${DAY}T11:30:00+02:00`,
    duration_minutes: 90,
    local_date: DAY,
    source_hash: `stay-${s.n}`,
  });
  keep(s, 'stay', row.id);
}

/**
 * The in-app notification an invite or a share sends the other user runs
 * detached, so it would land in whichever case comes next. Both surfaces
 * call the same service method for it; the cases here are about the domain
 * events, so the notification is held back while they run.
 */
function quietNotifications(app: INestApplication): () => void {
  const spy = vi.spyOn(app.get(NotificationsService), 'send').mockResolvedValue({ attempted: 0, delivered: 0 });
  return () => spy.mockRestore();
}

/** One recorded day as Dawarich would answer it, so no instance is asked. */
const SEGMENTS: DawarichTrackSegment[] = [
  {
    points: [
      [48.8566, 2.3522],
      [48.8606, 2.3376],
    ],
    mode: 'walking',
    startedAt: `${DAY}T09:00:00Z`,
    endedAt: `${DAY}T09:40:00Z`,
    distanceMeters: 1200,
  },
];
const DAY_WINDOW = { from: `${DAY}T00:00:00Z`, to: `${DAY}T23:59:59Z` };
/** The hash the preview would have shown for SEGMENTS, worked out by the service in the stub. */
let recordedHash = '';

const atlasCases: ParityCase[] = [
  {
    tool: 'create_bucket_list_item',
    args: (s) => ({ name: `Lisbon ${s.n}` }),
    rest: { method: 'post', path: () => `${ATLAS}/bucket-list`, body: (s) => ({ name: `Lisbon ${s.n}` }) },
    expect: [{ event: 'atlas:changed', user: 'actor' }],
  },
  {
    tool: 'update_bucket_list_item',
    needs: ['bucket'],
    args: (s) => ({ itemId: s.bucket.id, notes: 'In spring' }),
    rest: { method: 'put', path: (s) => `${ATLAS}/bucket-list/${s.bucket.id}`, body: () => ({ notes: 'In spring' }) },
    expect: [{ event: 'atlas:changed', user: 'actor' }],
  },
  {
    tool: 'delete_bucket_list_item',
    needs: ['bucket'],
    args: (s) => ({ itemId: s.bucket.id }),
    rest: { method: 'delete', path: (s) => `${ATLAS}/bucket-list/${s.bucket.id}` },
    expect: [{ event: 'atlas:changed', user: 'actor' }],
  },
  {
    tool: 'mark_country_visited',
    args: () => ({ country_code: 'PT' }),
    rest: { method: 'post', path: () => `${ATLAS}/country/PT/mark` },
    expect: [{ event: 'atlas:changed', user: 'actor' }],
  },
  {
    tool: 'unmark_country_visited',
    args: () => ({ country_code: 'PT' }),
    rest: { method: 'delete', path: () => `${ATLAS}/country/PT/mark` },
    expect: [{ event: 'atlas:changed', user: 'actor' }],
  },
  {
    tool: 'mark_region_visited',
    args: () => ({ regionCode: 'PT-11', regionName: 'Lisboa', countryCode: 'PT' }),
    rest: {
      method: 'post',
      path: () => `${ATLAS}/region/PT-11/mark`,
      body: () => ({ name: 'Lisboa', country_code: 'PT' }),
    },
    expect: [{ event: 'atlas:changed', user: 'actor' }],
  },
  {
    tool: 'unmark_region_visited',
    args: () => ({ regionCode: 'PT-11' }),
    rest: { method: 'delete', path: () => `${ATLAS}/region/PT-11/mark` },
    expect: [{ event: 'atlas:changed', user: 'actor' }],
  },
];

const dawarichCases: ParityCase[] = [
  {
    // The planner's way: once the stop is on a day, the journey the trip is
    // linked to gains its skeleton and hears about it (G7).
    tool: 'accept_dawarich_suggestion_as_place',
    needs: ['journey'],
    setup: async (s, app) => {
      await recordStay(s, app);
      await linkTripToJourney(ormOf(app), s.journey.id, s.trip.id);
    },
    args: (s) => ({ suggestionId: kept(s, 'stay'), tripId: s.trip.id, dayId: s.days[0].id }),
    rest: {
      method: 'post',
      path: (s) => `${DAWARICH}/suggestions/${kept(s, 'stay')}/accept`,
      body: (s) => ({ target: 'place', tripId: s.trip.id, dayId: s.days[0].id }),
    },
    expect: ['place:created', 'assignment:created', { event: 'journey:trip:synced', user: 'actor' }],
  },
  {
    // Announced after the commit, no longer from inside the transaction (G35).
    tool: 'accept_dawarich_suggestion_as_journal_entry',
    needs: ['journey'],
    setup: recordStay,
    args: (s) => ({ suggestionId: kept(s, 'stay'), journalId: s.journey.id }),
    rest: {
      method: 'post',
      path: (s) => `${DAWARICH}/suggestions/${kept(s, 'stay')}/accept`,
      body: (s) => ({ target: 'journal', journalId: s.journey.id }),
    },
    expect: [{ event: 'journey:entry:created', user: 'actor' }],
  },
  {
    tool: 'mark_bucket_list_item_visited_from_dawarich',
    needs: ['bucket'],
    setup: recordStay,
    args: (s) => ({ suggestionId: kept(s, 'stay'), bucketListItemId: s.bucket.id }),
    rest: {
      method: 'post',
      path: (s) => `${DAWARICH}/suggestions/${kept(s, 'stay')}/accept`,
      body: (s) => ({ target: 'bucket_list', bucketListItemId: s.bucket.id }),
    },
    expect: [{ event: 'atlas:changed', user: 'actor' }],
  },
  {
    tool: 'confirm_bucket_list_visits',
    needs: ['bucket'],
    args: (s) => ({ itemIds: [s.bucket.id] }),
    rest: { method: 'post', path: () => `${DAWARICH}/bucket-list/confirm`, body: (s) => ({ itemIds: [s.bucket.id] }) },
    expect: [{ event: 'atlas:changed', user: 'actor' }],
  },
  {
    tool: 'clear_bucket_list_visit',
    needs: ['bucket'],
    setup: async (s, app) => {
      await updateRows(ormOf(app), BucketList, { id: s.bucket.id }, { visited_at: `${DAY}T10:00:00Z` });
    },
    args: (s) => ({ itemId: s.bucket.id }),
    rest: { method: 'delete', path: (s) => `${DAWARICH}/bucket-list/${s.bucket.id}/visit` },
    expect: [{ event: 'atlas:changed', user: 'actor' }],
  },
  {
    tool: 'accept_atlas_countries',
    args: () => ({ countryCodes: ['PT'] }),
    rest: { method: 'post', path: () => `${DAWARICH}/atlas/accept`, body: () => ({ countryCodes: ['PT'] }) },
    expect: [{ event: 'atlas:changed', user: 'actor' }],
  },
];

const journeyCases: ParityCase[] = [
  {
    tool: 'create_journey',
    args: (s) => ({ title: `Portugal ${s.n}` }),
    rest: { method: 'post', path: () => '/api/journeys', body: (s) => ({ title: `Portugal ${s.n}` }) },
    expect: [{ event: 'journey:updated', user: 'actor' }],
  },
  {
    tool: 'update_journey',
    needs: ['journey'],
    args: (s) => ({ journeyId: s.journey.id, title: `Algarve ${s.n}` }),
    rest: {
      method: 'patch',
      path: (s) => `/api/journeys/${s.journey.id}`,
      body: (s) => ({ title: `Algarve ${s.n}` }),
    },
    expect: [{ event: 'journey:updated', user: 'actor' }],
  },
  {
    // Was journey:entry:updated with a payload the registry refuses.
    tool: 'restore_journey_suggestions',
    needs: ['journey'],
    setup: async (s, app) => {
      await updateRows(ormOf(app), JourneyEntries, { id: s.journeyEntry.id }, { dismissed: 1 });
    },
    args: onJourney,
    rest: { method: 'post', path: (s) => `/api/journeys/${s.journey.id}/suggestions/restore` },
    expect: [{ event: 'journey:updated', user: 'actor' }],
  },
  {
    tool: 'delete_journey',
    needs: ['journey'],
    args: onJourney,
    rest: { method: 'delete', path: (s) => `/api/journeys/${s.journey.id}` },
    expect: [{ event: 'journey:deleted', user: 'actor' }],
  },
  {
    tool: 'add_journey_trip',
    needs: ['journey'],
    args: (s) => ({ journeyId: s.journey.id, tripId: s.trip.id }),
    rest: {
      method: 'post',
      path: (s) => `/api/journeys/${s.journey.id}/trips`,
      body: (s) => ({ trip_id: s.trip.id }),
    },
    // The route has never read X-Socket-Id here; the asking tab reloads on its own echo.
    expect: [{ event: 'journey:trip:synced', user: 'actor', all: true }],
  },
  {
    tool: 'remove_journey_trip',
    needs: ['journey'],
    setup: async (s, app) => {
      await linkTripToJourney(ormOf(app), s.journey.id, s.trip.id);
    },
    args: (s) => ({ journeyId: s.journey.id, tripId: s.trip.id }),
    rest: { method: 'delete', path: (s) => `/api/journeys/${s.journey.id}/trips/${s.trip.id}` },
    expect: [{ event: 'journey:updated', user: 'actor' }],
  },
  {
    tool: 'create_journey_entry',
    needs: ['journey'],
    args: (s) => ({ journeyId: s.journey.id, entry_date: DAY, title: 'Arrival' }),
    rest: {
      method: 'post',
      path: (s) => `/api/journeys/${s.journey.id}/entries`,
      body: () => ({ entry_date: DAY, title: 'Arrival' }),
    },
    expect: [{ event: 'journey:entry:created', user: 'actor' }],
  },
  {
    tool: 'update_journey_entry',
    needs: ['journey'],
    args: (s) => ({ entryId: s.journeyEntry.id, title: 'Sunset at the river' }),
    rest: {
      method: 'patch',
      path: (s) => `/api/journeys/entries/${s.journeyEntry.id}`,
      body: () => ({ title: 'Sunset at the river' }),
    },
    expect: [{ event: 'journey:entry:updated', user: 'actor' }],
  },
  {
    tool: 'delete_journey_entry',
    needs: ['journey'],
    args: (s) => ({ entryId: s.journeyEntry.id }),
    rest: { method: 'delete', path: (s) => `/api/journeys/entries/${s.journeyEntry.id}` },
    expect: [{ event: 'journey:entry:deleted', user: 'actor' }],
  },
  {
    tool: 'reorder_journey_entries',
    needs: ['journey'],
    args: (s) => ({ journeyId: s.journey.id, orderedIds: [s.journeyEntry.id] }),
    rest: {
      method: 'put',
      path: (s) => `/api/journeys/${s.journey.id}/entries/reorder`,
      body: (s) => ({ orderedIds: [s.journeyEntry.id] }),
    },
    expect: [{ event: 'journey:entries:reordered', user: 'actor' }],
  },
  {
    tool: 'reorder_journey_entry_photos',
    needs: ['journey'],
    setup: async (s, app) => {
      const photo = await withRequestContext(ormOf(app), () =>
        app.get(JourneyDomainService).addProviderPhoto(s.journeyEntry.id, s.owner.id, 'immich', `asset-${s.n}`),
      );
      if (!photo) throw new Error('the entry took no photo');
      keep(s, 'photo', photo.id);
    },
    args: (s) => ({ entryId: s.journeyEntry.id, orderedIds: [kept(s, 'photo')] }),
    rest: {
      method: 'put',
      path: (s) => `/api/journeys/entries/${s.journeyEntry.id}/photos/reorder`,
      body: (s) => ({ orderedIds: [kept(s, 'photo')] }),
    },
    expect: [{ event: 'journey:entry:updated', user: 'actor' }],
  },
  {
    tool: 'add_journey_contributor',
    needs: ['journey', 'member'],
    args: (s) => ({ journeyId: s.journey.id, targetUserId: s.member.id, role: 'viewer' }),
    rest: {
      method: 'post',
      path: (s) => `/api/journeys/${s.journey.id}/contributors`,
      body: (s) => ({ user_id: s.member.id, role: 'viewer' }),
    },
    // To the owner and the new contributor alike; the contributor routes read no X-Socket-Id.
    expect: [{ event: 'journey:contributor:changed', user: 'actor', all: true }],
  },
  {
    tool: 'update_journey_contributor_role',
    needs: ['journey', 'member'],
    setup: async (s, app) => {
      await addJourneyContributor(ormOf(app), s.journey.id, s.member.id, 'viewer');
    },
    args: (s) => ({ journeyId: s.journey.id, targetUserId: s.member.id, role: 'editor' }),
    rest: {
      method: 'patch',
      path: (s) => `/api/journeys/${s.journey.id}/contributors/${s.member.id}`,
      body: () => ({ role: 'editor' }),
    },
    expect: [{ event: 'journey:contributor:changed', user: 'actor', all: true }],
  },
  {
    // The one taken off is told too, from the audience read before the delete.
    tool: 'remove_journey_contributor',
    needs: ['journey', 'member'],
    setup: async (s, app) => {
      await addJourneyContributor(ormOf(app), s.journey.id, s.member.id, 'viewer');
    },
    args: (s) => ({ journeyId: s.journey.id, targetUserId: s.member.id }),
    rest: { method: 'delete', path: (s) => `/api/journeys/${s.journey.id}/contributors/${s.member.id}` },
    expect: [{ event: 'journey:contributor:changed', user: 'actor', all: true }],
  },
  {
    // A preference of the writer's own: only their tabs read the journey again.
    tool: 'update_journey_preferences',
    needs: ['journey'],
    args: (s) => ({ journeyId: s.journey.id, hide_skeletons: true }),
    rest: {
      method: 'patch',
      path: (s) => `/api/journeys/${s.journey.id}/preferences`,
      body: () => ({ hide_skeletons: true }),
    },
    expect: [{ event: 'journey:updated', user: 'actor' }],
  },
  {
    tool: 'add_journey_provider_photos',
    needs: ['journey'],
    args: (s) => ({ journeyId: s.journey.id, provider: 'immich', asset_ids: [`asset-${s.n}`] }),
    rest: {
      method: 'post',
      path: (s) => `/api/journeys/${s.journey.id}/gallery/provider-photos`,
      body: (s) => ({ provider: 'immich', asset_ids: [`asset-${s.n}`] }),
    },
    // The capture times would be asked of the library, detached: it learns nothing here.
    stub: (app) => {
      const spy = vi.spyOn(app.get(PhotoCaptureBackfillService), 'run').mockResolvedValue(false);
      return () => spy.mockRestore();
    },
    settle: true,
    expect: [{ event: 'journey:updated', user: 'actor' }],
  },
  {
    tool: 'link_trip_journal',
    needs: ['journey'],
    args: (s) => ({ tripId: s.trip.id, journey_id: s.journey.id, members: [] }),
    rest: {
      method: 'put',
      path: (s) => `/api/trips/${s.trip.id}/journal`,
      body: (s) => ({ journey_id: s.journey.id, members: [] }),
    },
    expect: ['trip:journal:changed'],
  },
  {
    tool: 'set_trip_journal_members',
    needs: ['journey'],
    setup: linkJournal,
    args: (s) => ({ tripId: s.trip.id, members: [] }),
    rest: { method: 'patch', path: (s) => `/api/trips/${s.trip.id}/journal/members`, body: () => ({ members: [] }) },
    expect: ['trip:journal:changed'],
  },
  {
    tool: 'unlink_trip_journal',
    needs: ['journey'],
    setup: linkJournal,
    args: (s) => ({ tripId: s.trip.id }),
    rest: { method: 'delete', path: (s) => `/api/trips/${s.trip.id}/journal` },
    expect: ['trip:journal:changed'],
  },
  {
    tool: 'take_over_journey_day_stays',
    needs: ['journey'],
    setup: recordStay,
    args: (s) => ({
      journeyId: s.journey.id,
      date: DAY,
      groups: [{ kind: 'single', stays: [{ suggestionId: kept(s, 'stay') }] }],
    }),
    rest: {
      method: 'post',
      path: (s) => `/api/journeys/${s.journey.id}/recordings/${DAY}/stays/import`,
      body: (s) => ({ groups: [{ kind: 'single', stays: [{ suggestionId: kept(s, 'stay') }] }] }),
    },
    expect: [{ event: 'journey:entry:created', user: 'actor' }],
  },
  {
    tool: 'save_journey_recorded_day',
    needs: ['journey'],
    stub: (app) => {
      recordedHash = app.get(JourneyRecordedDaysService).hashOf(SEGMENTS, 0);
      const spy = vi.spyOn(app.get(DawarichTracksService), 'fetchDay').mockResolvedValue({
        segments: SEGMENTS,
        sourceKind: 'tracks',
        utcOffsetMinutes: 0,
        offsetSource: 'chosen',
        sourceOffsetMinutes: null,
        window: DAY_WINDOW,
        fetchedAt: `${DAY}T23:59:59Z`,
        truncated: false,
      });
      return () => spy.mockRestore();
    },
    args: (s) => ({ journeyId: s.journey.id, date: DAY, utcOffsetMinutes: 0, expectedHash: recordedHash }),
    rest: {
      method: 'put',
      path: (s) => `/api/journeys/${s.journey.id}/recordings/${DAY}`,
      body: () => ({ utcOffsetMinutes: 0, expectedHash: recordedHash }),
    },
    expect: [{ event: 'journey:recording:updated', user: 'actor' }],
  },
  {
    tool: 'delete_journey_recorded_day',
    needs: ['journey'],
    setup: async (s, app) => {
      const day = {
        date: DAY,
        sourceKind: 'tracks' as const,
        utcOffsetMinutes: 0,
        window: DAY_WINDOW,
        segments: SEGMENTS,
        truncated: false,
        fetchedAt: `${DAY}T23:59:59Z`,
        contentHash: `${'0'.repeat(63)}${s.n % 10}`,
      };
      await withRequestContext(ormOf(app), () =>
        app.get(JourneyRecordedDaysService).keep(s.journey.id, s.owner.id, day, false),
      );
    },
    args: (s) => ({ journeyId: s.journey.id, date: DAY }),
    rest: { method: 'delete', path: (s) => `/api/journeys/${s.journey.id}/recordings/${DAY}` },
    expect: [{ event: 'journey:recording:updated', user: 'actor' }],
  },
];

/** The scene's journey shown in its trip, as the link route writes it, without the event the route sends. */
async function linkJournal(s: Scene, app: INestApplication): Promise<void> {
  await inContext(ormOf(app), (em) =>
    em.getRepository(TripJournalLinks).upsertLink(s.trip.id, s.journey.id, s.owner.id, Date.now()),
  );
}

const vacayCases: ParityCase[] = [
  {
    tool: 'update_vacay_plan',
    needs: ['vacay'],
    args: () => ({ block_weekends: false }),
    rest: { method: 'put', path: () => `${VACAY}/plan`, body: () => ({ block_weekends: false }) },
    expect: [{ event: 'vacay:settings', user: 'actor' }],
  },
  {
    tool: 'set_vacay_color',
    needs: ['vacay'],
    args: () => ({ color: '#22c55e' }),
    rest: { method: 'put', path: () => `${VACAY}/color`, body: () => ({ color: '#22c55e' }) },
    expect: [{ event: 'vacay:update', user: 'actor' }],
  },
  {
    // The invitee hears the invite; the inviter's own tabs read the plan again,
    // which now lists it as pending.
    tool: 'send_vacay_invite',
    needs: ['vacay', 'member'],
    stub: quietNotifications,
    args: (s) => ({ targetUserId: s.member.id }),
    rest: { method: 'post', path: () => `${VACAY}/invite`, body: (s) => ({ user_id: s.member.id }) },
    expect: [
      { event: 'vacay:invite', user: 'others' },
      { event: 'vacay:settings', user: 'actor' },
    ],
  },
  {
    tool: 'accept_vacay_invite',
    actor: 'admin',
    needs: ['vacay'],
    setup: async (s, app) => {
      await addVacayPlanMember(ormOf(app), s.vacay.id, s.admin.id, 'pending');
    },
    args: (s) => ({ planId: s.vacay.id }),
    rest: { method: 'post', path: () => `${VACAY}/invite/accept`, body: (s) => ({ plan_id: s.vacay.id }) },
    expect: [{ event: 'vacay:accepted', user: 'actor' }],
  },
  {
    tool: 'decline_vacay_invite',
    actor: 'admin',
    needs: ['vacay'],
    setup: async (s, app) => {
      await addVacayPlanMember(ormOf(app), s.vacay.id, s.admin.id, 'pending');
    },
    args: (s) => ({ planId: s.vacay.id }),
    rest: { method: 'post', path: () => `${VACAY}/invite/decline`, body: (s) => ({ plan_id: s.vacay.id }) },
    // The plan's owner and the one declining, whose tabs still showed the invite (G34).
    expect: [{ event: 'vacay:declined', user: 'actor' }],
  },
  {
    tool: 'cancel_vacay_invite',
    needs: ['vacay'],
    setup: async (s, app) => {
      await addVacayPlanMember(ormOf(app), s.vacay.id, s.admin.id, 'pending');
    },
    args: (s) => ({ targetUserId: s.admin.id }),
    rest: { method: 'post', path: () => `${VACAY}/invite/cancel`, body: (s) => ({ user_id: s.admin.id }) },
    // The invitee and the plan's own tabs, which listed the invite as pending (G34).
    expect: [{ event: 'vacay:cancelled', user: 'actor' }],
  },
  {
    tool: 'dissolve_vacay_plan',
    needs: ['vacay'],
    setup: async (s, app) => {
      await addVacayPlanMember(ormOf(app), s.vacay.id, s.admin.id);
    },
    args: () => ({}),
    rest: { method: 'post', path: () => `${VACAY}/dissolve` },
    // Everyone on the plan, the one dissolving it now included (G34).
    expect: [{ event: 'vacay:dissolved', user: 'actor' }],
  },
  {
    tool: 'add_vacay_year',
    needs: ['vacay'],
    args: () => ({ year: 2032 }),
    rest: { method: 'post', path: () => `${VACAY}/years`, body: () => ({ year: 2032 }) },
    expect: [{ event: 'vacay:settings', user: 'actor' }],
  },
  {
    tool: 'delete_vacay_year',
    needs: ['vacay'],
    setup: async (s, app) => {
      await createRow(ormOf(app), VacayYears, { plan: s.vacay.id, year: 2031 });
    },
    args: () => ({ year: 2031 }),
    rest: { method: 'delete', path: () => `${VACAY}/years/2031` },
    expect: [{ event: 'vacay:settings', user: 'actor' }],
  },
  {
    tool: 'toggle_vacay_entry',
    needs: ['vacay'],
    args: () => ({ date: '2027-06-01' }),
    rest: { method: 'post', path: () => `${VACAY}/entries/toggle`, body: () => ({ date: '2027-06-01' }) },
    // 2027 is not a year of the plan yet, so the day opens it too.
    expect: [
      { event: 'vacay:settings', user: 'actor' },
      { event: 'vacay:update', user: 'actor' },
    ],
  },
  {
    tool: 'toggle_company_holiday',
    needs: ['vacay'],
    args: () => ({ date: '2027-06-02' }),
    rest: { method: 'post', path: () => `${VACAY}/entries/company-holiday`, body: () => ({ date: '2027-06-02' }) },
    // 2027 is not a year of the plan yet, so the day opens it too.
    expect: [
      { event: 'vacay:settings', user: 'actor' },
      { event: 'vacay:update', user: 'actor' },
    ],
  },
  {
    tool: 'update_vacay_stats',
    needs: ['vacay'],
    args: () => ({ year: 2027, vacationDays: 25 }),
    rest: { method: 'put', path: () => `${VACAY}/stats/2027`, body: () => ({ vacation_days: 25 }) },
    expect: [{ event: 'vacay:update', user: 'actor' }],
  },
  {
    tool: 'add_holiday_calendar',
    needs: ['vacay'],
    args: () => ({ region: 'DE' }),
    rest: { method: 'post', path: () => `${VACAY}/plan/holiday-calendars`, body: () => ({ region: 'DE' }) },
    expect: [{ event: 'vacay:settings', user: 'actor' }],
  },
  {
    tool: 'update_holiday_calendar',
    needs: ['vacay'],
    setup: holidayCalendar,
    args: (s) => ({ calendarId: kept(s, 'calendar'), label: 'Bavaria' }),
    rest: {
      method: 'put',
      path: (s) => `${VACAY}/plan/holiday-calendars/${kept(s, 'calendar')}`,
      body: () => ({ label: 'Bavaria' }),
    },
    expect: [{ event: 'vacay:settings', user: 'actor' }],
  },
  {
    tool: 'delete_holiday_calendar',
    needs: ['vacay'],
    setup: holidayCalendar,
    args: (s) => ({ calendarId: kept(s, 'calendar') }),
    rest: { method: 'delete', path: (s) => `${VACAY}/plan/holiday-calendars/${kept(s, 'calendar')}` },
    expect: [{ event: 'vacay:settings', user: 'actor' }],
  },
  {
    tool: 'share_vacay_calendar',
    needs: ['vacay', 'member'],
    stub: quietNotifications,
    args: (s) => ({ targetUserId: s.member.id }),
    rest: { method: 'post', path: () => `${VACAY}/shares`, body: (s) => ({ user_id: s.member.id }) },
    // The viewer, then the owner's other tabs, which list the share.
    expect: [{ event: 'vacay:share', user: 'actor' }],
  },
  {
    tool: 'unshare_vacay_calendar',
    needs: ['vacay', 'member'],
    setup: async (s, app) => {
      const share = await createRow(ormOf(app), VacayShares, { owner: s.owner.id, user: s.member.id });
      keep(s, 'share', share.id);
    },
    args: (s) => ({ shareId: kept(s, 'share') }),
    rest: { method: 'delete', path: (s) => `${VACAY}/shares/${kept(s, 'share')}` },
    expect: [{ event: 'vacay:share-removed', user: 'actor' }],
  },
];

/** A public holiday calendar on the owner's plan. */
async function holidayCalendar(s: Scene, app: INestApplication): Promise<void> {
  const calendar = await createRow(ormOf(app), VacayHolidayCalendars, { plan: s.vacay.id, region: 'DE' });
  keep(s, 'calendar', calendar.id);
}

/** A label of the owner's collection, written as a row, so the setup sends nothing. */
async function collectionLabel(s: Scene, app: INestApplication): Promise<void> {
  const label = await createRow(ormOf(app), CollectionLabels, { collection: s.collection.id, name: `Rooftops ${s.n}` });
  keep(s, 'label', label.id);
}

const collectionCases: ParityCase[] = [
  {
    // The owner's other tabs list the new collection (G33).
    tool: 'create_collection',
    args: (s) => ({ name: `Lisbon bakeries ${s.n}` }),
    rest: { method: 'post', path: () => COLLECTIONS, body: (s) => ({ name: `Lisbon bakeries ${s.n}` }) },
    expect: [{ event: 'collections:updated', user: 'actor' }],
  },
  {
    tool: 'update_collection',
    needs: ['collection'],
    args: (s) => ({ collectionId: s.collection.id, name: `Porto ${s.n}` }),
    rest: {
      method: 'patch',
      path: (s) => `${COLLECTIONS}/${s.collection.id}`,
      body: (s) => ({ name: `Porto ${s.n}` }),
    },
    expect: [{ event: 'collections:updated', user: 'actor' }],
  },
  {
    // The owner's own tabs too, not only the members' (G33).
    tool: 'delete_collection',
    needs: ['collection'],
    args: (s) => ({ collectionId: s.collection.id }),
    rest: { method: 'delete', path: (s) => `${COLLECTIONS}/${s.collection.id}` },
    expect: [{ event: 'collections:deleted', user: 'actor' }],
  },
  {
    tool: 'reorder_collections',
    needs: ['collection'],
    args: (s) => ({ orderedIds: [s.collection.id] }),
    rest: { method: 'post', path: () => `${COLLECTIONS}/reorder`, body: (s) => ({ orderedIds: [s.collection.id] }) },
    expect: [{ event: 'collections:updated', user: 'actor' }],
  },
  {
    tool: 'save_place_to_collection',
    needs: ['collection'],
    args: (s) => ({ collection_id: s.collection.id, name: `Pont Neuf ${s.n}` }),
    rest: {
      method: 'post',
      path: () => `${COLLECTIONS}/places`,
      body: (s) => ({ collection_id: s.collection.id, name: `Pont Neuf ${s.n}` }),
    },
    expect: [{ event: 'collections:updated', user: 'actor' }],
  },
  {
    // place2, not place: the saved place already sits where `place` is, and a duplicate is skipped silently.
    tool: 'save_trip_places_to_collection',
    needs: ['collection', 'place2'],
    args: (s) => ({ collectionId: s.collection.id, tripId: s.trip.id, placeIds: [s.place2.id] }),
    rest: {
      method: 'post',
      path: () => `${COLLECTIONS}/places/from-trip-many`,
      body: (s) => ({ collection_id: s.collection.id, source_trip_id: s.trip.id, source_place_ids: [s.place2.id] }),
    },
    expect: [{ event: 'collections:updated', user: 'actor' }],
  },
  {
    tool: 'update_collection_place',
    needs: ['collection'],
    args: (s) => ({ placeId: s.collectionPlace.id, name: `Saint-Chapelle ${s.n}` }),
    rest: {
      method: 'patch',
      path: (s) => `${COLLECTIONS}/places/${s.collectionPlace.id}`,
      body: (s) => ({ name: `Saint-Chapelle ${s.n}` }),
    },
    expect: [{ event: 'collections:updated', user: 'actor' }],
  },
  {
    tool: 'set_collection_place_status',
    needs: ['collection'],
    args: (s) => ({ placeId: s.collectionPlace.id, status: 'visited' }),
    rest: {
      method: 'post',
      path: (s) => `${COLLECTIONS}/places/${s.collectionPlace.id}/status`,
      body: () => ({ status: 'visited' }),
    },
    expect: [{ event: 'collections:updated', user: 'actor' }],
  },
  {
    // The saved place and the trip's `place` stand on the same spot, which is the match.
    tool: 'set_collection_place_status_from_trip',
    needs: ['collection', 'place'],
    args: (s) => ({ trip_id: s.trip.id, place_ids: [s.place.id], status: 'visited' }),
    rest: {
      method: 'post',
      path: () => `${COLLECTIONS}/places/status-from-trip`,
      body: (s) => ({ trip_id: s.trip.id, place_ids: [s.place.id], status: 'visited' }),
    },
    expect: [{ event: 'collections:updated', user: 'actor' }],
  },
  {
    tool: 'rate_collection_place',
    needs: ['collection'],
    args: (s) => ({ placeId: s.collectionPlace.id, rating: 4 }),
    rest: {
      method: 'put',
      path: (s) => `${COLLECTIONS}/places/${s.collectionPlace.id}/rating`,
      body: () => ({ rating: 4 }),
    },
    expect: [{ event: 'collections:updated', user: 'actor' }],
  },
  {
    tool: 'delete_collection_place',
    needs: ['collection'],
    args: (s) => ({ placeId: s.collectionPlace.id }),
    rest: { method: 'delete', path: (s) => `${COLLECTIONS}/places/${s.collectionPlace.id}` },
    expect: [{ event: 'collections:updated', user: 'actor' }],
  },
  {
    tool: 'create_collection_label',
    needs: ['collection'],
    args: (s) => ({ collection_id: s.collection.id, name: 'Rooftops' }),
    rest: {
      method: 'post',
      path: () => `${COLLECTIONS}/labels`,
      body: (s) => ({ collection_id: s.collection.id, name: 'Rooftops' }),
    },
    expect: [{ event: 'collections:updated', user: 'actor' }],
  },
  {
    tool: 'update_collection_label',
    needs: ['collection'],
    setup: collectionLabel,
    args: (s) => ({ labelId: kept(s, 'label'), name: 'Viewpoints' }),
    rest: {
      method: 'patch',
      path: (s) => `${COLLECTIONS}/labels/${kept(s, 'label')}`,
      body: () => ({ name: 'Viewpoints' }),
    },
    expect: [{ event: 'collections:updated', user: 'actor' }],
  },
  {
    tool: 'delete_collection_label',
    needs: ['collection'],
    setup: collectionLabel,
    args: (s) => ({ labelId: kept(s, 'label') }),
    rest: { method: 'delete', path: (s) => `${COLLECTIONS}/labels/${kept(s, 'label')}` },
    expect: [{ event: 'collections:updated', user: 'actor' }],
  },
  {
    tool: 'assign_collection_labels',
    needs: ['collection'],
    setup: collectionLabel,
    args: (s) => ({ label_ids: [kept(s, 'label')], place_ids: [s.collectionPlace.id] }),
    rest: {
      method: 'post',
      path: () => `${COLLECTIONS}/labels/assign`,
      body: (s) => ({ label_ids: [kept(s, 'label')], place_ids: [s.collectionPlace.id] }),
    },
    expect: [{ event: 'collections:updated', user: 'actor' }],
  },
  {
    // The invitee hears the invite; the owner's tabs list it as pending.
    tool: 'invite_to_collection',
    needs: ['collection', 'member'],
    stub: quietNotifications,
    args: (s) => ({ collection_id: s.collection.id, user_id: s.member.id, role: 'editor' }),
    rest: {
      method: 'post',
      path: () => `${COLLECTIONS}/invite`,
      body: (s) => ({ collection_id: s.collection.id, user_id: s.member.id, role: 'editor' }),
    },
    expect: [
      { event: 'collections:invite', user: 'others' },
      { event: 'collections:updated', user: 'actor' },
    ],
  },
  {
    tool: 'set_collection_member_role',
    needs: ['collection', 'member'],
    setup: async (s, app) => {
      await addCollectionMember(ormOf(app), s.collection.id, s.member.id);
    },
    args: (s) => ({ collectionId: s.collection.id, userId: s.member.id, role: 'viewer' }),
    rest: {
      method: 'post',
      path: () => `${COLLECTIONS}/members/role`,
      body: (s) => ({ collection_id: s.collection.id, user_id: s.member.id, role: 'viewer' }),
    },
    // Everyone on the list, then the member once more to re-gate their view; the route reads no X-Socket-Id.
    expect: [
      { event: 'collections:updated', user: 'actor', all: true },
      { event: 'collections:updated', user: 'others', all: true },
    ],
  },
  {
    tool: 'remove_collection_member',
    needs: ['collection', 'member'],
    setup: async (s, app) => {
      await addCollectionMember(ormOf(app), s.collection.id, s.member.id);
    },
    args: (s) => ({ collectionId: s.collection.id, userId: s.member.id }),
    rest: {
      method: 'post',
      path: () => `${COLLECTIONS}/members/remove`,
      body: (s) => ({ collection_id: s.collection.id, user_id: s.member.id }),
    },
    expect: [
      { event: 'collections:left', user: 'actor', all: true },
      { event: 'collections:removed', user: 'others', all: true },
    ],
  },
  {
    tool: 'cancel_collection_invite',
    needs: ['collection', 'member'],
    setup: async (s, app) => {
      await addCollectionMember(ormOf(app), s.collection.id, s.member.id, { status: 'pending' });
    },
    args: (s) => ({ collectionId: s.collection.id, userId: s.member.id }),
    rest: {
      method: 'post',
      path: () => `${COLLECTIONS}/invite/cancel`,
      body: (s) => ({ collection_id: s.collection.id, user_id: s.member.id }),
    },
    // The invitee, then the owner's tabs, which listed the invite as pending (G33).
    expect: [
      { event: 'collections:cancelled', user: 'others' },
      { event: 'collections:updated', user: 'actor' },
    ],
  },
  {
    tool: 'accept_collection_invite',
    actor: 'admin',
    needs: ['collection'],
    setup: async (s, app) => {
      await addCollectionMember(ormOf(app), s.collection.id, s.admin.id, { status: 'pending' });
    },
    args: (s) => ({ collectionId: s.collection.id }),
    rest: {
      method: 'post',
      path: () => `${COLLECTIONS}/invite/accept`,
      body: (s) => ({ collection_id: s.collection.id }),
    },
    expect: [{ event: 'collections:accepted', user: 'actor' }],
  },
  {
    tool: 'decline_collection_invite',
    actor: 'admin',
    needs: ['collection'],
    setup: async (s, app) => {
      await addCollectionMember(ormOf(app), s.collection.id, s.admin.id, { status: 'pending' });
    },
    args: (s) => ({ collectionId: s.collection.id }),
    rest: {
      method: 'post',
      path: () => `${COLLECTIONS}/invite/decline`,
      body: (s) => ({ collection_id: s.collection.id }),
    },
    // The owner and the one declining, whose tabs still showed the invite (G33).
    expect: [{ event: 'collections:declined', user: 'actor' }],
  },
  {
    tool: 'leave_collection',
    actor: 'admin',
    needs: ['collection'],
    setup: async (s, app) => {
      await addCollectionMember(ormOf(app), s.collection.id, s.admin.id);
    },
    args: (s) => ({ collectionId: s.collection.id }),
    rest: { method: 'post', path: () => `${COLLECTIONS}/leave`, body: (s) => ({ collection_id: s.collection.id }) },
    // Those staying, then the one leaving, whose tabs leave the list as a removed member's do (G33).
    expect: [
      { event: 'collections:left', user: 'others' },
      { event: 'collections:removed', user: 'actor' },
    ],
  },
];

/** The page ids of the scenes' books, in page order, so the tools can name them. */
const BOOK_PAGES = ['sp-cover', 'sp-first', 'sp-inner', 'sp-last', 'sp-back'];

/** A blank book for the scene's journey, the same one each time it is asked for. */
function bookOf(s: Scene) {
  let next = 0;
  return blankBook({ title: `Book ${s.n}`, newId: () => BOOK_PAGES[next++] ?? `sp-extra-${next}` });
}

/** The scene's book with a second inner page after the first, so a page has somewhere to move. */
function twoInnerBook(s: Scene): BookDocument {
  const book = bookOf(s);
  const second = { ...blankSpread('inner'), id: 'sp-inner-2' };
  return { ...book, spreads: [...book.spreads.slice(0, 3), second, ...book.spreads.slice(3)] };
}

/** The scene's journey with its book at version 1, written as a row so the setup sends nothing. */
async function seedBook(s: Scene, app: INestApplication, document: BookDocument = bookOf(s)): Promise<void> {
  await insertRow(ormOf(app), JourneyBooks, {
    journey: s.journey.id,
    title: `Book ${s.n}`,
    document: JSON.stringify(document),
    version: 1,
  });
}

/** The scene's book keeping one layout of its own, `ly-one`. */
function bookWithLayout(s: Scene): BookDocument {
  const layout = {
    id: 'ly-one',
    name: 'One',
    role: 'inner' as const,
    pageWidth: 210,
    pageHeight: 210,
    background: null,
    elements: [],
  };
  return { ...bookOf(s), layouts: [layout] };
}

/**
 * A design draft of the scene's owner over the scene's book, changing its
 * cover, kept where apply_book_design finds it (`d-parity-<n>`).
 */
async function seedDesign(s: Scene, app: INestApplication): Promise<void> {
  await seedBook(s, app);
  const base = bookOf(s);
  const tinted = base.spreads.map((sp) => (sp.id === 'sp-cover' ? { ...sp, background: '#203040' } : sp));
  const doc = { ...base, spreads: tinted };
  await app.get(BookDesignDraftStore).put({
    designId: `d-parity-${s.n}`,
    userId: s.owner.id,
    journeyId: s.journey.id,
    baseVersion: 1,
    base,
    doc,
    plan: [
      {
        spreadId: 'sp-cover',
        index: 0,
        action: 'replace',
        beat: 'cover',
        chapter: null,
        entryId: null,
        photoIds: [],
        findings: { severe: 0, warn: 0 },
      },
    ],
    selection: ['sp-cover'],
    style: { style: 'classic', paper: '#ffffff', ink: '#1a1a1a', accent: '#c2410c', heading: 'sans', body: 'sans' },
    usedPhotos: 0,
    leftOut: [],
    findings: [],
    notes: [],
    expiresAt: Date.now() + BOOK_DESIGN_DRAFTS.ttlMs,
  });
}

/** The scene's book with a revision of it kept as `900000 + n`, what an applied design leaves. */
async function seedRevision(s: Scene, app: INestApplication): Promise<void> {
  await seedBook(s, app);
  await insertRow(ormOf(app), JourneyBookRevisions, {
    id: 900_000 + s.n,
    journey: s.journey.id,
    version: 1,
    document: JSON.stringify(bookOf(s)),
  });
}

/**
 * The Studio's save, the one route that writes a book: every book tool's twin.
 * It saves the scene's book as it stands, which sends the same event as any
 * change would; what each tool changes is pinned in its own suites.
 */
const saveBook = (baseVersion?: number): RestCall => ({
  method: 'put',
  path: (s) => `/api/journeys/${s.journey.id}/book`,
  body: (s) => ({ title: `Book ${s.n}`, document: bookOf(s), baseVersion }),
});

/**
 * The Studio book's tools. Each write tells every member's tabs that the book
 * moved on; REST leaves out the tab that saved, MCP none, so the Studio the
 * assistant runs beside shows its change.
 */
const bookCases: ParityCase[] = [
  {
    tool: 'create_book',
    needs: ['journey'],
    args: onJourney,
    rest: saveBook(),
    expect: [{ event: 'journey:book:saved', user: 'actor' }],
  },
  {
    tool: 'add_book_pages',
    needs: ['journey'],
    setup: seedBook,
    args: (s) => ({ journeyId: s.journey.id, afterSpreadId: 'sp-inner' }),
    rest: saveBook(1),
    expect: [{ event: 'journey:book:saved', user: 'actor' }],
  },
  {
    // A real move: a move to where the page already is writes nothing and sends nothing.
    tool: 'move_book_page',
    needs: ['journey'],
    setup: (s, app) => seedBook(s, app, twoInnerBook(s)),
    args: (s) => ({ journeyId: s.journey.id, spreadId: 'sp-inner', toIndex: 3 }),
    rest: saveBook(1),
    expect: [{ event: 'journey:book:saved', user: 'actor' }],
  },
  {
    tool: 'delete_book_pages',
    needs: ['journey'],
    setup: seedBook,
    args: (s) => ({ journeyId: s.journey.id, spreadIds: ['sp-inner'] }),
    rest: saveBook(1),
    expect: [{ event: 'journey:book:saved', user: 'actor' }],
  },
  {
    tool: 'edit_book_page',
    needs: ['journey'],
    setup: seedBook,
    args: (s) => ({ journeyId: s.journey.id, spreadId: 'sp-inner', ops: [{ op: 'background', color: '#f4efe6' }] }),
    rest: saveBook(1),
    expect: [{ event: 'journey:book:saved', user: 'actor' }],
  },
  {
    tool: 'set_book_cover',
    needs: ['journey'],
    setup: seedBook,
    args: (s) => ({ journeyId: s.journey.id, title: `Lisbon ${s.n}` }),
    rest: saveBook(1),
    expect: [{ event: 'journey:book:saved', user: 'actor' }],
  },
  {
    tool: 'set_book_setup',
    needs: ['journey'],
    setup: seedBook,
    args: (s) => ({ journeyId: s.journey.id, safe: 8 }),
    rest: saveBook(1),
    expect: [{ event: 'journey:book:saved', user: 'actor' }],
  },
  {
    tool: 'set_book_theme',
    needs: ['journey'],
    setup: seedBook,
    args: (s) => ({ journeyId: s.journey.id, theme: 'nordic' }),
    rest: saveBook(1),
    expect: [{ event: 'journey:book:saved', user: 'actor' }],
  },
  {
    tool: 'duplicate_book_page',
    needs: ['journey'],
    setup: seedBook,
    args: (s) => ({ journeyId: s.journey.id, spreadId: 'sp-inner' }),
    rest: saveBook(1),
    expect: [{ event: 'journey:book:saved', user: 'actor' }],
  },
  {
    tool: 'save_book_layout',
    needs: ['journey'],
    setup: seedBook,
    args: (s) => ({ journeyId: s.journey.id, spreadId: 'sp-inner', name: 'Kept' }),
    rest: saveBook(1),
    expect: [{ event: 'journey:book:saved', user: 'actor' }],
  },
  {
    tool: 'remove_book_layout',
    needs: ['journey'],
    setup: (s, app) => seedBook(s, app, bookWithLayout(s)),
    args: (s) => ({ journeyId: s.journey.id, layoutId: 'ly-one' }),
    rest: saveBook(1),
    expect: [{ event: 'journey:book:saved', user: 'actor' }],
  },
  {
    // An undo puts the layout back, at the version the removal left.
    tool: 'restore_book_layout',
    needs: ['journey'],
    setup: seedBook,
    args: (s) => ({
      journeyId: s.journey.id,
      layout: JSON.stringify(bookWithLayout(s).layouts?.[0]),
      expectedVersion: 1,
    }),
    rest: saveBook(1),
    expect: [{ event: 'journey:book:saved', user: 'actor' }],
  },
  {
    // One write for the whole design, one event.
    tool: 'apply_book_design',
    needs: ['journey'],
    setup: seedDesign,
    args: (s) => ({ journeyId: s.journey.id, designId: `d-parity-${s.n}` }),
    rest: saveBook(1),
    expect: [{ event: 'journey:book:saved', user: 'actor' }],
  },
  {
    // The undo of an applied design, at the version it left.
    tool: 'restore_book_revision',
    needs: ['journey'],
    setup: seedRevision,
    args: (s) => ({ journeyId: s.journey.id, revisionId: 900_000 + s.n, expectedVersion: 1 }),
    rest: saveBook(1),
    expect: [{ event: 'journey:book:saved', user: 'actor' }],
  },
  {
    // An undo puts the page back where it is, at the version the change left.
    tool: 'restore_book_page',
    needs: ['journey'],
    setup: seedBook,
    args: (s) => ({ journeyId: s.journey.id, pages: [{ spread: bookOf(s).spreads[2], index: 2 }], expectedVersion: 1 }),
    rest: saveBook(1),
    expect: [{ event: 'journey:book:saved', user: 'actor' }],
  },
];

export const user: CaseGroup = {
  name: 'user',
  prefix: 'BCP-USER',
  cases: [...atlasCases, ...dawarichCases, ...journeyCases, ...vacayCases, ...collectionCases, ...bookCases],
  exempt: [
    { tool: 'create_journey_share_link', reason: TOKEN_ONLY, needs: ['journey'], args: onJourney },
    {
      tool: 'delete_journey_share_link',
      reason: TOKEN_ONLY,
      needs: ['journey'],
      args: onJourney,
      first: { tool: 'create_journey_share_link', args: onJourney },
    },
    {
      tool: 'dismiss_dawarich_suggestion',
      reason:
        "takes a stay out of the caller's own Dawarich review list, for which the registry has no event; the journey day review shows the stay as skipped too, but both read their rows when they open, so only a review left open shows the old state until its next read",
      setup: recordStay,
      args: (s) => ({ suggestionId: kept(s, 'stay') }),
    },
    {
      tool: 'create_manual_school_holiday_country',
      reason: HOLIDAY_CATALOG,
      actor: 'admin',
      args: (s) => ({ code: holidayCode(s.n, 0), name: `Holiday land ${s.n}` }),
    },
    {
      tool: 'create_manual_school_holiday_region',
      reason: HOLIDAY_CATALOG,
      actor: 'admin',
      needs: ['holidayCountry'],
      args: (s) => ({ country: s.holidayCountry.code, name: `North ${s.n}`, revision: 0, holidays: [WINTER] }),
    },
    {
      tool: 'update_manual_school_holiday_region',
      reason: HOLIDAY_CATALOG,
      actor: 'admin',
      needs: ['holidayRegion'],
      args: (s) => ({
        regionId: s.holidayRegion.id,
        name: `South ${s.n}`,
        revision: s.holidayRegion.revision,
        holidays: [WINTER],
      }),
    },
    {
      tool: 'delete_manual_school_holiday_region',
      reason: HOLIDAY_CATALOG,
      actor: 'admin',
      needs: ['holidayRegion'],
      args: (s) => ({ regionId: s.holidayRegion.id, revision: s.holidayRegion.revision }),
    },
    {
      tool: 'delete_manual_school_holiday_country',
      reason: HOLIDAY_CATALOG,
      actor: 'admin',
      needs: ['holidayCountry'],
      args: (s) => ({ code: s.holidayCountry.code }),
    },
  ],
};
