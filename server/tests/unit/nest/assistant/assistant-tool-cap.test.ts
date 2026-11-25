/**
 * The tools one request offers the model stay within what OpenAI's APIs and
 * Azure take (MAX_OFFERED_TOOLS): a longer list is refused before the model
 * reads a word, with `array_above_max_length` (a trip chat on Azure Foundry
 * offered 130 in its first step).
 */
import { ADDON_IDS } from '../../../../src/addons';
import { ASSISTANT_TOOL_GROUPS } from '../../../../src/nest/assistant/assistant-tool-offer';
import { MAX_OFFERED_TOOLS } from '../../../../src/nest/assistant/assistant-tools.constants';
import {
  AssistantToolsService,
  type AssistantToolSession,
} from '../../../../src/nest/assistant/assistant-tools.service';
import { makeJourney } from '../../../helpers/factories/journeys';
import { setAddonEnabled, setAppSetting } from '../../../helpers/factories/settings';
import { makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { FakeRealtimeService } from '../../../helpers/fake-realtime';
import { bootTestApp } from '../../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';

import { beforeAll, describe, expect, it } from 'vitest';

let orm: MikroORM;
let tools: AssistantToolsService;

const GROUPS = Object.keys(ASSISTANT_TOOL_GROUPS);

beforeAll(async () => {
  const app = await bootTestApp(new FakeRealtimeService());
  orm = app.get(MikroORM);
  tools = app.get(AssistantToolsService);
  // Every addon on, so every group holds all it can.
  for (const addon of Object.values(ADDON_IDS)) await setAddonEnabled(orm, addon, true);
  await setAppSetting(orm, 'tours_wanderer_enabled', 'true');
});

async function tripSession(): Promise<AssistantToolSession> {
  const { user } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id, { title: 'Kyoto' });
  return tools.open(user.id, trip.id);
}

const names = (session: AssistantToolSession) => session.specs().map((spec) => spec.name);

describe('the tools one step offers', () => {
  it('ASTCAP-001: a trip chat starts within the limit, with room for any one group beside the core', async () => {
    const session = await tripSession();
    try {
      expect(session.specs().length).toBeLessThanOrEqual(MAX_OFFERED_TOOLS);
      for (const group of GROUPS) {
        const one = await tripSession();
        try {
          const run = await one.call('use_addon_tools', { groups: [group] });
          expect(run.ok, group).toBe(true);
          expect((run.value as { loaded: string[] }).loaded, group).toEqual([group]);
          expect(one.specs().length, group).toBeLessThanOrEqual(MAX_OFFERED_TOOLS);
        } finally {
          await one.close();
        }
      }
    } finally {
      await session.close();
    }
  });

  it('ASTCAP-002: loading one group after another unloads the one used longest ago, never the one just asked for', async () => {
    const session = await tripSession();
    try {
      const unloadedSeen: string[] = [];
      for (const group of GROUPS) {
        const run = await session.call('use_addon_tools', { groups: [group] });
        const value = run.value as { loaded: string[]; tools: string[]; unloaded?: string[] };
        expect(value.loaded).toEqual([group]);
        expect(value.unloaded ?? [], group).not.toContain(group);
        unloadedSeen.push(...(value.unloaded ?? []));
        const offered = names(session);
        expect(offered.length, group).toBeLessThanOrEqual(MAX_OFFERED_TOOLS);
        for (const tool of value.tools) expect(offered, `${group}: ${tool}`).toContain(tool);
      }
      // Every group cannot fit at once, so the walk had to make room, oldest first.
      expect(unloadedSeen.length).toBeGreaterThan(0);
      expect(unloadedSeen[0]).toBe(GROUPS[0]);
    } finally {
      await session.close();
    }
  });

  it('ASTCAP-003: asking for every group at once loads what fits and names the rest', async () => {
    const session = await tripSession();
    try {
      const run = await session.call('use_addon_tools', { groups: GROUPS });
      const value = run.value as { loaded: string[]; notLoaded?: string[]; note?: string };
      expect(session.specs().length).toBeLessThanOrEqual(MAX_OFFERED_TOOLS);
      expect(value.loaded.length).toBeGreaterThan(0);
      expect([...value.loaded, ...(value.notLoaded ?? [])].sort()).toEqual([...GROUPS].sort());
      expect(value.notLoaded?.length ?? 0).toBeGreaterThan(0);
      expect(value.note).toMatch(/on their own/);
    } finally {
      await session.close();
    }
  });

  it('ASTCAP-004: a tool of a group that was unloaded loads it again when the model calls it', async () => {
    const session = await tripSession();
    try {
      const first = GROUPS[0]!;
      const run = await session.call('use_addon_tools', { groups: [first] });
      const tool = (run.value as { tools: string[] }).tools[0]!;
      // Load the others until the first one is gone again.
      for (const group of GROUPS.slice(1)) {
        await session.call('use_addon_tools', { groups: [group] });
        if (!names(session).includes(tool)) break;
      }
      expect(names(session)).not.toContain(tool);
      expect(session.pinArgs(tool, {})).not.toHaveProperty('error');
      expect(names(session)).toContain(tool);
      expect(session.specs().length).toBeLessThanOrEqual(MAX_OFFERED_TOOLS);
    } finally {
      await session.close();
    }
  });

  it('ASTCAP-005: the home chat stays within the limit with any one group loaded', async () => {
    const { user } = await makeUser(orm);
    for (const group of GROUPS) {
      const session = await tools.openHome(user.id);
      try {
        expect(session.specs().length, 'home').toBeLessThanOrEqual(MAX_OFFERED_TOOLS);
        await session.call('use_addon_tools', { groups: [group] });
        expect(session.specs().length, group).toBeLessThanOrEqual(MAX_OFFERED_TOOLS);
      } finally {
        await session.close();
      }
    }
  });

  it('ASTCAP-006: a journey chat offers no more than the limit on either of its pages', async () => {
    const { user } = await makeUser(orm);
    const journey = await makeJourney(orm, user.id, { title: 'Lisbon' });
    for (const surface of ['studio', 'journal'] as const) {
      const session = await tools.openJourney(user.id, journey.id, { role: 'owner', surface });
      try {
        expect(session.specs().length, surface).toBeLessThanOrEqual(MAX_OFFERED_TOOLS);
      } finally {
        await session.close();
      }
    }
  });
});
