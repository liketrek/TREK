/**
 * The read tools that had no test of their own (A10): each answers its empty
 * case for the owner and refuses what the caller may not see. The ones that
 * would reach a third party (the hazard feeds, a Google short link) are
 * pinned on their refusals, which come before any outbound call.
 */
import { ADDON_IDS } from '../../../src/addons';
import { makeCollection } from '../../helpers/factories/collections';
import { makeJourney } from '../../helpers/factories/journeys';
import { makePlace } from '../../helpers/factories/places';
import { setAddonEnabled } from '../../helpers/factories/settings';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { bootTestApp } from '../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

type ToolAnswer = { isError?: boolean; content: Array<{ text: string }> };

let orm: MikroORM;
let ownerId: number;
let owner: McpHarness;
let stranger: McpHarness;

beforeAll(async () => {
  orm = (await bootTestApp()).get(MikroORM);
  await Promise.all(Object.values(ADDON_IDS).map((id) => setAddonEnabled(orm, id, true)));
  ownerId = (await makeUser(orm)).user.id;
  owner = await createMcpHarness({ userId: ownerId });
  stranger = await createMcpHarness({ userId: (await makeUser(orm)).user.id });
});

afterAll(async () => {
  await owner?.cleanup();
  await stranger?.cleanup();
});

const call = (h: McpHarness, name: string, args: Record<string, unknown>) =>
  h.client.callTool({ name, arguments: args }) as Promise<ToolAnswer>;

describe('journey recordings', () => {
  it('READCOV-001: the prep says Dawarich is not connected, and the preview refuses for that reason', async () => {
    const journey = await makeJourney(orm, ownerId);
    const prep = parseToolResult(await call(owner, 'get_journey_recording_prep', { journeyId: journey.id }));
    expect(prep).toMatchObject({ enabled: false, connection: 'not_connected' });
    const preview = await call(owner, 'preview_journey_recorded_day', {
      journeyId: journey.id,
      date: '2026-05-01',
      utcOffsetMinutes: 0,
    });
    expect(preview.isError).toBe(true);
    expect(preview.content[0].text).toBe('Dawarich is not connected');
  });
});

describe('road trip', () => {
  it('READCOV-002: a new trip has no day boundaries and an empty planning context', async () => {
    const trip = await makeTrip(orm, ownerId);
    expect(parseToolResult(await call(owner, 'list_day_boundaries', { tripId: trip.id }))).toEqual({ boundaries: [] });
    const context = parseToolResult(await call(owner, 'get_roadtrip_context', { tripId: trip.id })) as {
      days: unknown[];
      profiles: string[];
    };
    expect(context.days).toEqual([]);
    expect(context.profiles).toContain('driving');
  });

  it('READCOV-003: a place without a charger reads as unknown, not as an error', async () => {
    const trip = await makeTrip(orm, ownerId);
    const place = await makePlace(orm, trip.id);
    const info = parseToolResult(
      await call(owner, 'get_roadtrip_charging_info', { tripId: trip.id, placeId: place.id }),
    );
    expect(info).toMatchObject({ status: 'unknown', station: null, total: 0 });
  });

  it('READCOV-004: a stranger reads none of the road-trip tools of a trip', async () => {
    const trip = await makeTrip(orm, ownerId);
    const place = await makePlace(orm, trip.id);
    const answers = await Promise.all([
      call(stranger, 'list_day_boundaries', { tripId: trip.id }),
      call(stranger, 'get_roadtrip_context', { tripId: trip.id }),
      call(stranger, 'get_roadtrip_hazards', { tripId: trip.id }),
      call(stranger, 'get_roadtrip_charging_info', { tripId: trip.id, placeId: place.id }),
    ]);
    expect(answers.map((a) => a.isError)).toEqual([true, true, true, true]);
  });
});

describe('manual school holidays', () => {
  it('READCOV-005: no region yet lists empty, and an unknown region is not found', async () => {
    expect(parseToolResult(await call(owner, 'list_manual_school_holiday_regions', {}))).toEqual({
      countries: [],
      regions: [],
    });
    const region = await call(owner, 'get_manual_school_holiday_region', { regionId: 999 });
    expect(region.content[0].text).toBe('Region not found');
    const holidays = await call(owner, 'list_manual_school_holidays', { regionId: 999, year: 2026 });
    expect(holidays.content[0].text).toBe('Region not found');
  });
});

describe('tours', () => {
  it('READCOV-006: a collection with no kept tour lists none, and an unknown one is not found', async () => {
    const collection = await makeCollection(orm, ownerId);
    expect(parseToolResult(await call(owner, 'list_collection_tours', { collection_id: collection.id }))).toEqual({
      tours: [],
    });
    const tour = await call(owner, 'get_collection_tour', { collection_id: collection.id, collection_tour_id: 999 });
    expect(tour.content[0].text).toBe('Tour not found');
  });

  it('READCOV-007: the tour library of a new user is empty and not cut short', async () => {
    expect(parseToolResult(await call(owner, 'list_tour_library', {}))).toEqual({
      tours: [],
      trips: [],
      truncated: false,
    });
  });

  it('READCOV-008: a Google Maps walk is not previewed for a trip the caller cannot see', async () => {
    const trip = await makeTrip(orm, ownerId);
    const answer = await call(stranger, 'preview_google_maps_walk', {
      tripId: trip.id,
      url: 'https://maps.app.goo.gl/x',
    });
    expect(answer.isError).toBe(true);
    expect(answer.content[0].text).toBe('Trip not found or access denied.');
  });
});
