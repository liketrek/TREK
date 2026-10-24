/**
 * The assistant's tool session for a Studio conversation, over the container's
 * real MCP registry: it holds the book's tools and the journey's reads, all on
 * the conversation's journey, and nothing of a trip; a viewer's holds no write
 * at all; an undo's holds its target; the journey id is hidden and pinned like
 * a trip's, and the tools answer with the user's own rights.
 */
import { McpRegistryService } from '../../../../src/nest-mcp';
import { isOfferedInJourney } from '../../../../src/nest/assistant/assistant-tool-offer';
import { AssistantToolsService } from '../../../../src/nest/assistant/assistant-tools.service';
import { addJourneyContributor, makeJourney } from '../../../helpers/factories/journeys';
import { setAddonEnabled } from '../../../helpers/factories/settings';
import { makeUser } from '../../../helpers/factories/users';
import { FakeRealtimeService } from '../../../helpers/fake-realtime';
import { bootTestApp } from '../../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';
import { ASSISTANT_FOLLOW_UPS_TOOL } from '@trek/shared';

import { beforeAll, describe, expect, it } from 'vitest';

const realtime = new FakeRealtimeService();
let orm: MikroORM;
let registry: McpRegistryService;
let tools: AssistantToolsService;

beforeAll(async () => {
  const app = await bootTestApp(realtime);
  orm = app.get(MikroORM);
  registry = app.get(McpRegistryService);
  tools = app.get(AssistantToolsService);
  await setAddonEnabled(orm, 'journey', true);
});

const BOOK_WRITES = ['create_book', 'add_book_pages', 'move_book_page', 'delete_book_pages', 'edit_book_page'];

async function ownerWithJourneys() {
  const { user } = await makeUser(orm);
  const journey = await makeJourney(orm, user.id, { title: 'Lisbon' });
  const other = await makeJourney(orm, user.id, { title: 'Porto' });
  return { userId: user.id, journeyId: journey.id, otherId: other.id };
}

describe('a Studio tool session', () => {
  it('ASTJSES-001: offers the book tools and the journey reads at once, on this journey, and nothing of a trip', async () => {
    const { userId, journeyId } = await ownerWithJourneys();
    const session = await tools.openJourney(userId, journeyId, true);
    try {
      const specs = session.specs();
      const names = specs.map((spec) => spec.name);
      expect(names).toEqual(
        expect.arrayContaining(['get_book', 'describe_book_page', 'suggest_book_photos', 'list_journey_entries']),
      );
      expect(names).toEqual(expect.arrayContaining([...BOOK_WRITES, 'set_book_cover']));
      for (const name of ['restore_book_page', 'get_journey_share_link', 'create_journey_entry', 'list_journeys']) {
        expect(names, name).not.toContain(name);
      }
      for (const name of ['get_trip_summary', 'create_place', 'remember_for_trip', 'use_addon_tools']) {
        expect(names, name).not.toContain(name);
      }
      // The follow-ups are the server's own, offered in every turn and never one of the registry's tools.
      expect(names).toContain(ASSISTANT_FOLLOW_UPS_TOOL);
      const classOf = new Map(registry.list().map((entry) => [entry.name, entry.className] as const));
      for (const spec of specs.filter((one) => one.name !== ASSISTANT_FOLLOW_UPS_TOOL)) {
        expect(isOfferedInJourney(spec.name, classOf.get(spec.name)), spec.name).toBe(true);
        const properties = Object.keys((spec.parameters.properties as Record<string, unknown> | undefined) ?? {});
        expect(properties, spec.name).not.toContain('journeyId');
        expect((spec.parameters.required as string[] | undefined) ?? [], spec.name).not.toContain('journeyId');
      }
      expect(session.kindOf('get_book')).toBe('read');
      expect(session.kindOf('edit_book_page')).toBe('write');
      expect(session.kindOf('remember_for_trip')).toBeNull();
      expect(session.kindOf('use_addon_tools')).toBeNull();
    } finally {
      await session.close();
    }
  });

  it('ASTJSES-002: a viewer is offered the reads but the design draft tools, and not one write', async () => {
    const { journeyId } = await ownerWithJourneys();
    const { user: viewer } = await makeUser(orm);
    await addJourneyContributor(orm, journeyId, viewer.id, 'viewer');
    const session = await tools.openJourney(viewer.id, journeyId, false);
    try {
      const names = session.specs().map((spec) => spec.name);
      expect(names).toEqual(expect.arrayContaining(['get_book', 'describe_book_page', 'list_journey_entries']));
      for (const name of [...BOOK_WRITES, 'set_book_cover']) expect(names, name).not.toContain(name);
      const listed = registry.list().map((entry) => entry.name);
      for (const name of ['design_book', 'get_book_design', 'revise_book_design']) {
        expect(listed, name).toContain(name);
        expect(names, name).not.toContain(name);
      }
      for (const name of names) expect(session.kindOf(name), name).toBe('read');
    } finally {
      await session.close();
    }
  });

  it('ASTJSES-003: a call runs on the conversation journey, and another journey id is refused', async () => {
    const { userId, journeyId, otherId } = await ownerWithJourneys();
    const session = await tools.openJourney(userId, journeyId, true);
    try {
      const run = await session.call('list_journey_entries', {});
      expect(run).toMatchObject({ ok: true, value: { journey: { id: journeyId, title: 'Lisbon' } } });
      expect(await session.call('get_book', {})).toMatchObject({ ok: true, value: { exists: false } });
      expect(session.pinArgs('get_book', { journeyId: otherId })).toEqual({
        error: 'This conversation is about one journey; its id is set by the app and cannot be changed.',
      });
      expect(session.pinArgs('describe_book_page', { journeyId, spreadId: 'sp-1' })).toEqual({
        args: { spreadId: 'sp-1' },
      });
    } finally {
      await session.close();
    }
  });

  it('ASTJSES-004: a stranger gets the tool refusal, not the journey', async () => {
    const { journeyId } = await ownerWithJourneys();
    const { user: stranger } = await makeUser(orm);
    const session = await tools.openJourney(stranger.id, journeyId, false);
    try {
      expect(await session.call('get_book', {})).toEqual({ ok: false, value: 'Journey not found or access denied.' });
    } finally {
      await session.close();
    }
  });

  it('ASTJSES-005: an undo session holds its target and nothing else', async () => {
    const { userId, journeyId } = await ownerWithJourneys();
    const session = await tools.openJourney(userId, journeyId, true, new Set(['restore_book_page']));
    try {
      expect(session.specs().map((spec) => spec.name)).toEqual(['restore_book_page']);
      expect(session.kindOf('restore_book_page')).toBe('write');
      expect((await session.read('get_book')).value).toBe('Unknown tool: get_book');
    } finally {
      await session.close();
    }
  });
});
