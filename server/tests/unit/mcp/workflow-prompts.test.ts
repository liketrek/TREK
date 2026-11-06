/**
 * The workflow prompts (plan-day, pack-for-trip, budget-review, add-place):
 * listed for a session that may act on what they ask for, refused for a trip
 * the user cannot see, and naming the tools the task needs.
 */
import { ADDON_IDS } from '../../../src/addons';
import { setAddonEnabled } from '../../helpers/factories/settings';
import { makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createMcpHarness } from '../../helpers/mcp-harness';
import { bootTestApp } from '../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';

import { beforeAll, describe, expect, it } from 'vitest';

let orm: MikroORM;

beforeAll(async () => {
  orm = (await bootTestApp()).get(MikroORM);
  await Promise.all([ADDON_IDS.PACKING, ADDON_IDS.BUDGET].map((id) => setAddonEnabled(orm, id, true)));
});

async function promptText(userId: number, name: string, args: Record<string, string>, scopes: string[] | null = null) {
  const harness = await createMcpHarness({ userId, scopes });
  try {
    const listed = (await harness.client.listPrompts()).prompts.map((p) => p.name);
    if (!listed.includes(name)) return null;
    const result = await harness.client.getPrompt({ name, arguments: args });
    return result.messages.map((m) => (m.content.type === 'text' ? m.content.text : '')).join('\n');
  } finally {
    await harness.cleanup();
  }
}

describe('workflow prompts', () => {
  it('PROMPT-WF-001: plan-day names the day by id and the tools to add places with', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { title: 'Lisbon' });
    const day = await makeDay(orm, trip.id, { date: '2026-12-02' });
    const text = await promptText(user.id, 'plan-day', { tripId: String(trip.id), date: '2026-12-02' });
    expect(text).toContain(`day id ${day.id}`);
    expect(text).toContain('assign_place_to_day');
    expect(await promptText(user.id, 'plan-day', { tripId: String(trip.id), date: '2030-01-01' })).toContain(
      'has no day on 2030-01-01',
    );
  });

  it('PROMPT-WF-002: pack-for-trip, budget-review and add-place point at their tools', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { title: 'Alps' });
    const id = String(trip.id);
    expect(await promptText(user.id, 'pack-for-trip', { tripId: id })).toContain('create_packing_item');
    expect(await promptText(user.id, 'budget-review', { tripId: id })).toContain('get_settlement_summary');
    const add = await promptText(user.id, 'add-place', { tripId: id, query: 'Belém Tower' });
    expect(add).toContain('"Belém Tower"');
    expect(add).toContain('search_place');
  });

  it('PROMPT-WF-003: a trip the user cannot see is refused, and a read-only client is not offered the writing ones', async () => {
    const { user } = await makeUser(orm);
    const { user: owner } = await makeUser(orm);
    const foreign = await makeTrip(orm, owner.id);
    expect(await promptText(user.id, 'add-place', { tripId: String(foreign.id), query: 'x' })).toBe(
      'Trip not found or access denied.',
    );
    const readOnly = ['trips:read', 'places:read', 'packing:read', 'budget:read'];
    expect(await promptText(user.id, 'add-place', { tripId: '1', query: 'x' }, readOnly)).toBeNull();
    expect(await promptText(user.id, 'pack-for-trip', { tripId: '1' }, readOnly)).toBeNull();
    expect(await promptText(user.id, 'budget-review', { tripId: String(foreign.id) }, readOnly)).toBe(
      'Trip not found or access denied.',
    );
  });
});
