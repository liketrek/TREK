/**
 * The assistant's tool session for the home chat, over the container's real
 * MCP registry: it reads any trip the user may read, on the id the model
 * passes, and holds no write that takes a trip or a journey, nor one of a
 * journey's own that names only its entry; the writes that
 * belong to no trip (the atlas, collections) come with their groups; the way
 * into a trip's chat answers from the user's own trips only; an undo's
 * session holds its target.
 */
import { OPEN_TRIP_CHAT_TOOL } from '../../../../src/nest/assistant/assistant-home';
import { USE_TOOLS_TOOL } from '../../../../src/nest/assistant/assistant-tool-offer';
import { AssistantToolsService } from '../../../../src/nest/assistant/assistant-tools.service';
import { setAddonEnabled } from '../../../helpers/factories/settings';
import { makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { FakeRealtimeService } from '../../../helpers/fake-realtime';
import { bootTestApp } from '../../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';
import { ASSISTANT_FOLLOW_UPS_TOOL } from '@trek/shared';

import { beforeAll, describe, expect, it } from 'vitest';

const realtime = new FakeRealtimeService();
let orm: MikroORM;
let tools: AssistantToolsService;

beforeAll(async () => {
  const app = await bootTestApp(realtime);
  orm = app.get(MikroORM);
  tools = app.get(AssistantToolsService);
  await setAddonEnabled(orm, 'atlas', true);
  await setAddonEnabled(orm, 'collections', true);
  await setAddonEnabled(orm, 'journey', true);
  await setAddonEnabled(orm, 'dawarich', true);
});

async function ownerWithTrip() {
  const { user } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id, { title: 'Kyoto' });
  return { userId: user.id, tripId: trip.id };
}

describe('a home tool session', () => {
  it('ASTHSES-001: offers the trip reads with their trip id, no trip write, and the server steps of the home chat', async () => {
    const { userId } = await ownerWithTrip();
    const session = await tools.openHome(userId);
    try {
      const specs = session.specs();
      const names = specs.map((spec) => spec.name);
      expect(names).toEqual(expect.arrayContaining(['list_trips', 'get_trip_summary', 'list_places']));
      expect(names).toEqual(expect.arrayContaining([OPEN_TRIP_CHAT_TOOL, USE_TOOLS_TOOL, ASSISTANT_FOLLOW_UPS_TOOL]));
      for (const name of ['create_place', 'update_trip', 'create_budget_item', 'remember_for_trip', 'get_book']) {
        expect(names, name).not.toContain(name);
      }
      // Nothing is pinned: the model names the trip it reads.
      const summary = specs.find((spec) => spec.name === 'get_trip_summary');
      expect(Object.keys((summary?.parameters.properties as Record<string, unknown>) ?? {})).toContain('tripId');
      expect(session.kindOf('get_trip_summary')).toBe('read');
      expect(session.kindOf(OPEN_TRIP_CHAT_TOOL)).toBe('read');
      expect(session.kindOf(USE_TOOLS_TOOL)).toBe('read');
      expect(session.kindOf('remember_for_trip')).toBeNull();
      expect(session.kindOf('create_place')).toBeNull();
    } finally {
      await session.close();
    }
  });

  it('ASTHSES-002: a loaded group brings its writes that belong to no trip, held as changes', async () => {
    const { userId } = await ownerWithTrip();
    const session = await tools.openHome(userId);
    try {
      expect(session.specs().map((spec) => spec.name)).not.toContain('mark_country_visited');
      const loaded = await session.call(USE_TOOLS_TOOL, { groups: ['atlas', 'collections'] });
      expect(loaded).toMatchObject({ ok: true, value: { loaded: ['atlas', 'collections'] } });
      const names = session.specs().map((spec) => spec.name);
      expect(names).toEqual(expect.arrayContaining(['mark_country_visited', 'create_collection']));
      expect(names).not.toContain('copy_collection_places_to_trip');
      expect(session.kindOf('mark_country_visited')).toBe('write');
    } finally {
      await session.close();
    }
  });

  it("ASTHSES-006: the journey group brings a journey's reads and none of its writes", async () => {
    const { userId } = await ownerWithTrip();
    const session = await tools.openHome(userId);
    try {
      await session.call(USE_TOOLS_TOOL, { groups: ['journey'] });
      const names = session.specs().map((spec) => spec.name);
      expect(names).toEqual(expect.arrayContaining(['list_journeys', 'list_journey_entries']));
      const journeyWrites = [
        'update_journey_entry',
        'delete_journey_entry',
        'reorder_journey_entry_photos',
        'accept_dawarich_suggestion_as_journal_entry',
      ];
      for (const name of journeyWrites) {
        expect(names, name).not.toContain(name);
        expect(session.kindOf(name), name).toBeNull();
      }
      // A Dawarich suggestion waved away belongs to no journey and stays.
      expect(session.kindOf('dismiss_dawarich_suggestion')).toBe('write');
    } finally {
      await session.close();
    }
  });

  it('ASTHSES-003: reads a trip of the user by its id, and only with the user rights', async () => {
    const { userId, tripId } = await ownerWithTrip();
    const { user: stranger } = await makeUser(orm);
    const own = await tools.openHome(userId);
    const theirs = await tools.openHome(stranger.id);
    try {
      expect(own.pinArgs('get_trip_summary', { tripId })).toEqual({ args: { tripId } });
      expect(await own.call('get_trip_summary', { tripId })).toMatchObject({
        ok: true,
        value: { trip: { id: tripId, title: 'Kyoto' } },
      });
      expect((await theirs.call('get_trip_summary', { tripId })).ok).toBe(false);
    } finally {
      await own.close();
      await theirs.close();
    }
  });

  it("ASTHSES-004: offers a trip's chat only for a trip of the user's", async () => {
    const { userId, tripId } = await ownerWithTrip();
    const { user: stranger } = await makeUser(orm);
    const own = await tools.openHome(userId);
    const theirs = await tools.openHome(stranger.id);
    try {
      expect(await own.call(OPEN_TRIP_CHAT_TOOL, { tripId, question: '  What is missing?  ' })).toMatchObject({
        ok: true,
        value: { trip: { id: tripId, title: 'Kyoto', phase: 'undated' }, question: 'What is missing?' },
      });
      expect(await theirs.call(OPEN_TRIP_CHAT_TOOL, { tripId })).toMatchObject({ ok: false });
    } finally {
      await own.close();
      await theirs.close();
    }
  });

  it('ASTHSES-005: an undo session holds its target and nothing of the home steps', async () => {
    const { userId } = await ownerWithTrip();
    const session = await tools.openHome(userId, new Set(['delete_collection']));
    try {
      expect(session.specs().map((spec) => spec.name)).toEqual(['delete_collection']);
      expect(session.kindOf(OPEN_TRIP_CHAT_TOOL)).toBeNull();
      expect(session.kindOf(USE_TOOLS_TOOL)).toBeNull();
    } finally {
      await session.close();
    }
  });
});
