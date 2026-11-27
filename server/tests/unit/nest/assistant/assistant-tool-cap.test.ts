/**
 * The tools one request offers the model stay within what OpenAI's APIs and
 * Azure take (MAX_OFFERED_TOOLS): a longer list is refused before the model
 * reads a word, with `array_above_max_length` (a trip chat on Azure Foundry
 * offered 130 in its first step).
 */
import { ADDON_IDS } from '../../../../src/addons';
import type { AssistantAttachmentSummary } from '../../../../src/db/repositories/AssistantAttachments.repository';
import { attachedPort } from '../../../../src/nest/assistant/assistant-attachment-tools';
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
  await Promise.all(Object.values(ADDON_IDS).map((addon) => setAddonEnabled(orm, addon, true)));
  await setAppSetting(orm, 'tours_wanderer_enabled', 'true');
});

async function tripSession(): Promise<AssistantToolSession> {
  const { user } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id, { title: 'Kyoto' });
  return tools.open(user.id, trip.id);
}

/** Runs `use` on the session and closes it whatever happens. */
async function within<T>(
  opening: Promise<AssistantToolSession>,
  use: (session: AssistantToolSession) => Promise<T>,
): Promise<T> {
  const session = await opening;
  try {
    return await use(session);
  } finally {
    await session.close();
  }
}

const names = (session: AssistantToolSession) => session.specs().map((spec) => spec.name);

/** A turn with a readable attached file in a trip that keeps files, so both attachment tools come on top. */
const ATTACHED_TURN = {
  attached: [{ id: 'att-1', text_status: 'ok' } as AssistantAttachmentSummary],
  sentTo: 'model',
  keeps: true,
  read: () => Promise.resolve({ ok: true, value: '' }),
};

interface LoadAnswer {
  loaded: string[];
  tools: string[];
  unloaded?: string[];
  notLoaded?: string[];
  note?: string;
}

interface Step {
  group: string;
  answer: LoadAnswer;
  offered: string[];
}

/** Loads the groups one step after another, as a model would over a turn, with what each step offered. */
async function loadOneByOne(session: AssistantToolSession, groups: readonly string[]): Promise<Step[]> {
  const [group, ...rest] = groups;
  if (group === undefined) return [];
  const run = await session.call('use_addon_tools', { groups: [group] });
  const step = { group, answer: run.value as LoadAnswer, offered: names(session) };
  return [step, ...(await loadOneByOne(session, rest))];
}

describe('the tools one step offers', () => {
  it('ASTCAP-001: a trip chat starts within the limit, with room for any one group beside the core', async () => {
    const start = await within(tripSession(), (session) => Promise.resolve(session.specs().length));
    expect(start).toBeLessThanOrEqual(MAX_OFFERED_TOOLS);
    const counts = await Promise.all(
      GROUPS.map((group) =>
        within(tripSession(), async (session) => {
          const run = await session.call('use_addon_tools', { groups: [group] });
          return { group, ok: run.ok, loaded: (run.value as LoadAnswer).loaded, offered: session.specs().length };
        }),
      ),
    );
    for (const { group, ok, loaded, offered } of counts) {
      expect(ok, group).toBe(true);
      expect(loaded, group).toEqual([group]);
      expect(offered, group).toBeLessThanOrEqual(MAX_OFFERED_TOOLS);
    }
  });

  it('ASTCAP-002: loading one group after another unloads the one used longest ago, never the one just asked for', async () => {
    const steps = await within(tripSession(), (session) => loadOneByOne(session, GROUPS));
    for (const { group, answer, offered } of steps) {
      expect(answer.loaded).toEqual([group]);
      expect(answer.unloaded ?? [], group).not.toContain(group);
      expect(offered.length, group).toBeLessThanOrEqual(MAX_OFFERED_TOOLS);
      for (const tool of answer.tools) expect(offered, `${group}: ${tool}`).toContain(tool);
    }
    // Every group cannot fit at once, so the walk had to make room, oldest first.
    const unloaded = steps.flatMap((step) => step.answer.unloaded ?? []);
    expect(unloaded.length).toBeGreaterThan(0);
    expect(unloaded[0]).toBe(GROUPS[0]);
  });

  it('ASTCAP-003: asking for every group at once loads what fits and names the rest', async () => {
    await within(tripSession(), async (session) => {
      const run = await session.call('use_addon_tools', { groups: GROUPS });
      const value = run.value as LoadAnswer;
      expect(session.specs().length).toBeLessThanOrEqual(MAX_OFFERED_TOOLS);
      expect(value.loaded.length).toBeGreaterThan(0);
      expect([...value.loaded, ...(value.notLoaded ?? [])].sort()).toEqual([...GROUPS].sort());
      expect(value.notLoaded?.length ?? 0).toBeGreaterThan(0);
      expect(value.note).toMatch(/on their own/);
    });
  });

  it('ASTCAP-004: a tool of a group that was unloaded loads it again when the model calls it', async () => {
    await within(tripSession(), async (session) => {
      const [first, ...others] = GROUPS;
      const [loadedFirst] = await loadOneByOne(session, first === undefined ? [] : [first]);
      const tool = String(loadedFirst?.answer.tools[0]);
      expect(loadedFirst?.offered).toContain(tool);
      // Loading every other group makes room by unloading the first one, used longest ago.
      await loadOneByOne(session, others);
      expect(names(session)).not.toContain(tool);
      expect(session.pinArgs(tool, {})).not.toHaveProperty('error');
      expect(names(session)).toContain(tool);
      expect(session.specs().length).toBeLessThanOrEqual(MAX_OFFERED_TOOLS);
    });
  });

  it('ASTCAP-005: the home chat stays within the limit with any one group loaded', async () => {
    const { user } = await makeUser(orm);
    const counts = await Promise.all(
      GROUPS.map((group) =>
        within(tools.openHome(user.id), async (session) => {
          const before = session.specs().length;
          await session.call('use_addon_tools', { groups: [group] });
          return { group, before, after: session.specs().length };
        }),
      ),
    );
    for (const { group, before, after } of counts) {
      expect(before, 'home').toBeLessThanOrEqual(MAX_OFFERED_TOOLS);
      expect(after, group).toBeLessThanOrEqual(MAX_OFFERED_TOOLS);
    }
  });

  it('ASTCAP-005b: a trip turn with an attached file stays within the limit whatever the model loads', async () => {
    const steps = await within(tripSession(), async (session) => {
      const port = attachedPort(session, ATTACHED_TURN);
      const counts: Array<{ group: string; offered: number }> = [];
      await GROUPS.reduce(async (previous, group) => {
        await previous;
        await session.call('use_addon_tools', { groups: [group] });
        counts.push({ group, offered: port.specs().length });
      }, Promise.resolve());
      await session.call('use_addon_tools', { groups: GROUPS });
      counts.push({ group: 'all', offered: port.specs().length });
      return counts;
    });
    for (const { group, offered } of steps) expect(offered, group).toBeLessThanOrEqual(MAX_OFFERED_TOOLS);
  });

  it('ASTCAP-006: a journey chat offers no more than the limit on either of its pages', async () => {
    const { user } = await makeUser(orm);
    const journey = await makeJourney(orm, user.id, { title: 'Lisbon' });
    const counts = await Promise.all(
      (['studio', 'journal'] as const).map((surface) =>
        within(tools.openJourney(user.id, journey.id, { role: 'owner', surface }), (session) =>
          Promise.resolve({ surface, offered: session.specs().length }),
        ),
      ),
    );
    for (const { surface, offered } of counts) expect(offered, surface).toBeLessThanOrEqual(MAX_OFFERED_TOOLS);
  });
});
