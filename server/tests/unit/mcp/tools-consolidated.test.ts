/**
 * The tools that took over a family of single-purpose ones (A5): each does
 * what the tools it replaced did, and those stay for one release, pointing at
 * it ("Deprecated: use <tool>.") with the annotations they had.
 */
import { ADDON_IDS } from '../../../src/addons';
import { Notifications } from '../../../src/db/entities/Notifications.entity';
import { VisitedCountries } from '../../../src/db/entities/VisitedCountries.entity';
import { VisitedRegions } from '../../../src/db/entities/VisitedRegions.entity';
import { makeJourney } from '../../helpers/factories/journeys';
import { makeNotification } from '../../helpers/factories/notifications';
import { findRow } from '../../helpers/factories/rows';
import { setAddonEnabled } from '../../helpers/factories/settings';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { bootTestApp } from '../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

type ToolAnswer = { isError?: boolean; content: Array<{ text: string }> };

let orm: MikroORM;
let userId: number;
let harness: McpHarness;

type ListedTool = Awaited<ReturnType<McpHarness['client']['listTools']>>['tools'][number];

beforeAll(async () => {
  orm = (await bootTestApp()).get(MikroORM);
  await Promise.all(
    [ADDON_IDS.ATLAS, ADDON_IDS.JOURNEY, ADDON_IDS.TOURS, ADDON_IDS.ROADTRIP, ADDON_IDS.BUDGET].map((id) =>
      setAddonEnabled(orm, id, true),
    ),
  );
  userId = (await makeUser(orm)).user.id;
  harness = await createMcpHarness({ userId });
});

afterAll(async () => {
  await harness?.cleanup();
});

const call = (name: string, args: Record<string, unknown>) =>
  harness.client.callTool({ name, arguments: args }) as Promise<ToolAnswer>;

describe('deprecated tools', () => {
  it('CONSOL-001: each points at the tool that replaced it and keeps its annotations', async () => {
    const listed: ListedTool[] = (await harness.client.listTools()).tools;
    const tools = new Map(listed.map((t) => [t.name, t]));
    const replaced: Record<string, string> = {
      mark_country_visited: 'set_atlas_visited',
      unmark_country_visited: 'set_atlas_visited',
      mark_region_visited: 'set_atlas_visited',
      unmark_region_visited: 'set_atlas_visited',
      mark_notification_read: 'set_notification_read',
      mark_notification_unread: 'set_notification_read',
      set_book_cover: 'update_book',
      set_book_setup: 'update_book',
      set_book_theme: 'update_book',
      add_route_via: 'add_route_vias',
      create_budget_item_with_members: 'create_budget_item',
      plan_paddle_route: 'propose_paddle_route',
      plan_ski_route: 'propose_ski_route',
    };
    for (const [old, replacement] of Object.entries(replaced)) {
      expect(tools.get(old)?.description, old).toBe(`Deprecated: use ${replacement}.`);
      expect(tools.has(replacement), replacement).toBe(true);
    }
    expect(tools.get('update_tour')?.description).toMatch(/^Deprecated: use update_tour_details/);
    expect(tools.get('unmark_country_visited')?.annotations?.destructiveHint).toBe(true);
    expect(tools.get('plan_ski_route')?.annotations).toEqual(tools.get('propose_ski_route')?.annotations);
  });
});

describe('Tool: set_atlas_visited', () => {
  it('CONSOL-002: marks and unmarks a country', async () => {
    const marked = await call('set_atlas_visited', { country_code: 'pt', visited: true });
    expect(parseToolResult(marked)).toMatchObject({ success: true, country_code: 'PT' });
    expect(await findRow(orm, VisitedCountries, { user: userId, country_code: 'PT' })).toBeTruthy();
    await call('set_atlas_visited', { country_code: 'PT', visited: false });
    expect(await findRow(orm, VisitedCountries, { user: userId, country_code: 'PT' })).toBeNull();
  });

  it('CONSOL-003: marks a region with its name and country, unmarks it by its code alone', async () => {
    const marked = await call('set_atlas_visited', {
      country_code: 'US',
      region_code: 'us-ca',
      region_name: 'California',
      visited: true,
    });
    expect(parseToolResult(marked)).toMatchObject({ region: { code: 'US-CA', name: 'California' } });
    await call('set_atlas_visited', { region_code: 'US-CA', visited: false });
    expect(await findRow(orm, VisitedRegions, { user: userId, region_code: 'US-CA' })).toBeNull();
  });

  it('CONSOL-004: says what is missing instead of guessing', async () => {
    expect((await call('set_atlas_visited', { visited: true })).content[0].text).toContain('country_code');
    const noName = await call('set_atlas_visited', { region_code: 'US-NY', country_code: 'US', visited: true });
    expect(noName.isError).toBe(true);
    expect(noName.content[0].text).toContain('region_name');
  });
});

describe('Tool: set_notification_read', () => {
  it('CONSOL-005: marks a notification read and unread again, and refuses one of another user', async () => {
    const mine = await makeNotification(orm, userId);
    await call('set_notification_read', { notificationId: mine.id, read: true });
    expect((await findRow(orm, Notifications, { id: mine.id }))?.is_read).toBeTruthy();
    await call('set_notification_read', { notificationId: mine.id, read: false });
    expect((await findRow(orm, Notifications, { id: mine.id }))?.is_read).toBeFalsy();
    const other = await makeNotification(orm, (await makeUser(orm)).user.id);
    const refused = await call('set_notification_read', { notificationId: other.id, read: true });
    expect(refused.isError).toBe(true);
  });
});

describe('Tool: update_book', () => {
  it('CONSOL-006: applies setup and cover in one write, and nothing when a part is refused', async () => {
    const journey = await makeJourney(orm, userId);
    expect((await call('create_book', { journeyId: journey.id })).isError).toBeFalsy();
    const before = parseToolResult(await call('get_book', { journeyId: journey.id })) as { version: number };
    const result = await call('update_book', {
      journeyId: journey.id,
      setup: { bleed: 4 },
      cover: { title: 'Atlantic coast' },
    });
    expect(result.isError).toBeFalsy();
    const answer = parseToolResult(result) as { version: number; previous_setup?: unknown };
    expect(answer.version).toBe(before.version + 1);
    expect(answer.previous_setup).toBeDefined();
    const book = await call('get_book', { journeyId: journey.id });
    expect(book.content[0].text).toContain('Atlantic coast');

    const refused = await call('update_book', {
      journeyId: journey.id,
      cover: { title: 'Never written' },
      theme: { spreadIds: ['no-such-page'] },
    });
    expect(refused.isError).toBe(true);
    const after = parseToolResult(await call('get_book', { journeyId: journey.id })) as { version: number };
    expect(after.version).toBe(answer.version);
    expect((await call('get_book', { journeyId: journey.id })).content[0].text).not.toContain('Never written');
  });

  it('CONSOL-007: refuses a call that changes nothing', async () => {
    const journey = await makeJourney(orm, userId);
    const result = await call('update_book', { journeyId: journey.id });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('setup, theme or cover');
  });
});

describe('propose_paddle_route and propose_ski_route', () => {
  it('CONSOL-008: answer what the plan_* tools they renamed answer', async () => {
    const trip = await makeTrip(orm, userId);
    const leg = { from: { lat: 46.5, lng: 7.9 }, to: { lat: 46.51, lng: 7.91 } };
    const pairs = [
      ['plan_paddle_route', 'propose_paddle_route', { tripId: trip.id, legs: [leg] }],
      ['plan_ski_route', 'propose_ski_route', { tripId: trip.id, legs: [leg], discipline: 'alpine' }],
    ] as const;
    // The ski router may start downloading an area on the first call, so the
    // legs are compared by their outcome rather than byte for byte.
    const statuses = (r: ToolAnswer) =>
      (parseToolResult(r) as { legs: Array<{ status: string }> }).legs.map((l) => l.status);
    const answers = await Promise.all(
      pairs.map(async ([old, renamed, args]) => ({
        renamed,
        before: await call(old, args),
        after: await call(renamed, args),
      })),
    );
    for (const { renamed, before, after } of answers) {
      expect(after.isError, renamed).toBe(before.isError);
      expect(statuses(after), renamed).toEqual(statuses(before));
    }
  });
});
