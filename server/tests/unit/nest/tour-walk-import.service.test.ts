/**
 * TourWalkImportService (CW-07, WALK-IMPORT-*): a Google Maps walking route
 * read into the stops of a city walk. The short link resolver and the map
 * search are stubs: the first so no request leaves the test, the second to
 * show it is never asked, since a stop without a position is not guessed.
 */
import { DomainError, catchDomainError } from '../../../src/nest/common/domain-error';
import { MapsService } from '../../../src/nest/maps/maps.service';
import { GoogleMapsShortLinkProvider } from '../../../src/nest/place-import/providers/google-maps-short-link.provider';
import { TourWalkImportService } from '../../../src/nest/tours/tour-walk-import.service';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { PORTO_ALIADOS, PORTO_RIBEIRA } from '../../fixtures/google-maps-walks';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import {
  TOUR_STATION_NAME_MAX,
  WALK_IMPORT_REFUSALS,
  WALK_IMPORT_STATIONS_MAX,
  type WalkImportRefusal,
} from '@trek/shared';
import en from '@trek/shared/i18n/en';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
const resolve = vi.fn();
const maps = { geocodeQuery: vi.fn(), reverseGeocode: vi.fn(), searchPlaces: vi.fn() };
let t: TestModule;
let service: TourWalkImportService;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [ToursModule],
    overrides: [
      { provide: GoogleMapsShortLinkProvider, useValue: { resolve } },
      { provide: MapsService, useValue: maps },
    ],
  });
  service = t.get(TourWalkImportService);
});
beforeEach(() => {
  resolve.mockReset();
  for (const fn of Object.values(maps)) fn.mockReset();
});
afterAll(async () => {
  await t.close();
  db.close();
});

const DIR = 'https://www.google.com/maps/dir/';
const block = (lng: number, lat: number) => `!1m5!1m1!1s0x0:0x0!2m2!1d${lng}!2d${lat}`;
/** A walking route through the stops named, each with its position in the blob. */
function walk(names: string[], mode = '!3e2'): string {
  const blocks = names.map((_, i) => block(11.5 + i / 100, 48.1 + i / 100)).join('');
  const inner = names.length * 6 + (mode ? 1 : 0);
  return `${DIR}${names.map(encodeURIComponent).join('/')}/@48.1,11.5,15z/data=!4m${inner + 1}!4m${inner}${blocks}${mode}`;
}

async function refusal(raw: string): Promise<{ status: number; reason: WalkImportRefusal; error: string }> {
  const err = await catchDomainError(() => service.preview(raw));
  if (!(err instanceof DomainError)) throw new Error('expected a refusal');
  return { status: err.getStatus(), reason: err.details?.reason as WalkImportRefusal, error: err.publicMessage };
}

describe('TourWalkImportService.preview', () => {
  it('WALK-IMPORT-001: a long walking link answers its stops in order and the link it read, with no request made', async () => {
    const answer = await service.preview(`  ${PORTO_RIBEIRA}  `);
    expect(answer.resolved_url).toBe(PORTO_RIBEIRA);
    expect(answer.stations.map((station) => station.name)).toEqual([
      'Igreja de Santa Clara, Largo Primeiro de Dezembro, 4000-404 Porto, Portugal',
      'Porto Cathedral, Terreiro da Sé, 4050-573 Porto, Portugal',
      'Mosteiro Santo Agostinho da Serra do Pilar, Largo Aviz, 4430-329 Vila Nova de Gaia, Portugal',
      'Mirador de Porto y Duero',
      'Ribeira de Gaia',
    ]);
    expect(answer.stations[0]).toMatchObject({ lat: 41.1425899, lng: -8.6092477 });
    expect(resolve).not.toHaveBeenCalled();
    // A line dragged through a point of its own still places each stop on its own position.
    expect((await service.preview(PORTO_ALIADOS)).stations.every((station) => station.lat !== null)).toBe(true);
  });

  it('WALK-IMPORT-002: a short link is read where the narrow resolver says it leads', async () => {
    resolve.mockResolvedValue({ ok: true, url: PORTO_RIBEIRA });
    const answer = await service.preview('https://maps.app.goo.gl/gwKHfs8TNxShEBBk7');
    expect(resolve).toHaveBeenCalledExactlyOnceWith('https://maps.app.goo.gl/gwKHfs8TNxShEBBk7');
    expect(answer.resolved_url).toBe(PORTO_RIBEIRA);
    expect(answer.stations).toHaveLength(5);
  });

  it('WALK-IMPORT-003: names are trimmed and cut to a station name, and a stop given as coordinates has none', async () => {
    const long = 'Museum '.repeat(40);
    const answer = await service.preview(`${DIR}${encodeURIComponent(`  ${long}`)}/48.12,11.52/data=!3e2`);
    expect(answer.stations[0].name).toBe(long.trim().slice(0, TOUR_STATION_NAME_MAX).trim());
    expect(answer.stations[0].name?.length).toBeLessThanOrEqual(TOUR_STATION_NAME_MAX);
    expect(answer.stations[1]).toEqual({ name: null, lat: 48.12, lng: 11.52 });
  });

  it('WALK-IMPORT-004: a stop the link gives no position stays without one, and nothing is looked up', async () => {
    // Three stops, two blocks: nothing lines up, so no stop takes a position from the blob.
    const url = `${DIR}Cathedral/Market/Park/data=!4m14!4m13${block(11.5, 48.1)}${block(11.51, 48.11)}!3e2`;
    const answer = await service.preview(url);
    expect(answer.stations).toEqual([
      { name: 'Cathedral', lat: null, lng: null },
      { name: 'Market', lat: null, lng: null },
      { name: 'Park', lat: null, lng: null },
    ]);
    for (const fn of Object.values(maps)) expect(fn).not.toHaveBeenCalled();
  });

  it('WALK-IMPORT-005: a car, a bike, transit or a link that does not say is refused with its reason', async () => {
    expect(await refusal(walk(['A', 'B'], '!3e0'))).toMatchObject({ status: 400, reason: 'not_walking' });
    expect(await refusal(walk(['A', 'B'], '!3e1'))).toMatchObject({ status: 400, reason: 'not_walking' });
    expect(await refusal(walk(['A', 'B'], '!3e3'))).toMatchObject({ status: 400, reason: 'not_walking' });
    expect(await refusal(walk(['A', 'B'], ''))).toMatchObject({ status: 400, reason: 'mode_unknown' });
    expect(await refusal(`${walk(['A', 'B'])}?travelmode=driving`)).toEqual({
      status: 400,
      reason: 'mode_unknown',
      error:
        'The link does not say clearly that the route is on foot. Choose walking in Google Maps and share it again.',
    });
  });

  it('WALK-IMPORT-006: a link that is no Google Maps route is refused for what it is', async () => {
    expect(await refusal('not a link')).toMatchObject({ status: 400, reason: 'not_google_maps' });
    expect(await refusal('https://example.com/maps/dir/A/B/data=!3e2')).toMatchObject({ reason: 'not_google_maps' });
    expect(await refusal('https://www.google.evil.io/maps/dir/A/B/data=!3e2')).toMatchObject({
      reason: 'not_google_maps',
    });
    expect(await refusal('https://bit.ly/walk')).toMatchObject({ reason: 'not_google_maps' });
    expect(await refusal('https://www.google.com/maps/place/Cathedral/@48.1,11.5,17z')).toMatchObject({
      status: 400,
      reason: 'not_a_route',
    });
    expect(resolve).not.toHaveBeenCalled();
  });

  it('WALK-IMPORT-007: a short link the resolver refuses or cannot follow says which, the second as Google’s failure', async () => {
    resolve.mockResolvedValueOnce({ ok: false, why: 'refused' });
    expect(await refusal('https://maps.app.goo.gl/abc')).toMatchObject({ status: 400, reason: 'short_link_refused' });
    // Google's final answer that it has no such link is the link's, and asking again changes nothing.
    resolve.mockResolvedValueOnce({ ok: false, why: 'not_found' });
    expect(await refusal('https://maps.app.goo.gl/abc')).toMatchObject({ status: 400, reason: 'short_link_unknown' });
    // Each one Google's failure, not the link's.
    const failed = await Promise.all(
      (['unreachable', 'too_many_redirects', 'no_redirect'] as const).map((why) => {
        resolve.mockResolvedValueOnce({ ok: false, why });
        return refusal('https://maps.app.goo.gl/abc');
      }),
    );
    expect(failed.map(({ status, reason }) => [status, reason])).toEqual(Array(3).fill([502, 'short_link_failed']));
  });

  it('WALK-IMPORT-008: fewer than two stops, or more than a walk takes, are refused', async () => {
    expect(await refusal(`${DIR}Cathedral/data=!3e2`)).toMatchObject({ status: 400, reason: 'too_few_stops' });
    const many = Array.from({ length: WALK_IMPORT_STATIONS_MAX + 1 }, (_, i) => `Stop${i}`);
    expect(await refusal(walk(many))).toMatchObject({ status: 400, reason: 'too_many_stops' });
    const most = await service.preview(walk(many.slice(0, WALK_IMPORT_STATIONS_MAX)));
    expect(most.stations).toHaveLength(WALK_IMPORT_STATIONS_MAX);
    expect(most.stations.every((station) => station.lat !== null)).toBe(true);
  });

  it('WALK-IMPORT-009: every reason is sent with the English text the planner shows for it', async () => {
    const SHORT = 'https://maps.app.goo.gl/abc';
    const shortLink = (why: string) => () => resolve.mockResolvedValueOnce({ ok: false, why });
    const nothing = () => undefined;
    const cases: Record<WalkImportRefusal, [string, () => unknown]> = {
      not_google_maps: ['not a link', nothing],
      not_a_route: ['https://www.google.com/maps/place/Cathedral/@48.1,11.5,17z', nothing],
      not_walking: [walk(['A', 'B'], '!3e0'), nothing],
      mode_unknown: [walk(['A', 'B'], ''), nothing],
      short_link_refused: [SHORT, shortLink('refused')],
      short_link_failed: [SHORT, shortLink('unreachable')],
      short_link_unknown: [SHORT, shortLink('not_found')],
      too_few_stops: [`${DIR}Cathedral/data=!3e2`, nothing],
      too_many_stops: [walk(Array.from({ length: WALK_IMPORT_STATIONS_MAX + 1 }, (_, i) => `Stop${i}`)), nothing],
    };
    expect(Object.keys(cases).sort()).toEqual([...WALK_IMPORT_REFUSALS].sort());
    const english: Record<string, string> = en;
    const sent = await WALK_IMPORT_REFUSALS.reduce<Promise<Array<[string, string]>>>(async (previous, reason) => {
      const done = await previous;
      const [url, arrange] = cases[reason];
      arrange();
      const answer = await refusal(url);
      return [...done, [answer.reason, answer.error]];
    }, Promise.resolve([]));
    expect(sent).toEqual(WALK_IMPORT_REFUSALS.map((reason) => [reason, english[`tours.walkImport.refusal.${reason}`]]));
  });
});
