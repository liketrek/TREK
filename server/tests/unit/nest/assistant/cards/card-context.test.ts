/**
 * What the change cards are made with beyond the tool's own answer: the
 * turn's reads, each made once and cut off after four per change, the
 * categories read once a turn, the airports by their codes, the lookups of
 * a change the server proposes itself, and the card of an applied change
 * through the guarded registry.
 */
import { AirportsService } from '../../../../../src/nest/airports/airports.service';
import { buildTripCard } from '../../../../../src/nest/assistant/assistant-context';
import type { AssistantToolsService, ToolRun } from '../../../../../src/nest/assistant/assistant-tools.service';
import {
  AssistantCardContext,
  loadFor,
  MAX_CARD_READS,
  memoisedReader,
} from '../../../../../src/nest/assistant/cards/card-context';
import type { ToolCards } from '../../../../../src/nest/assistant/cards/card-types';
import { oneByOne } from '../../../../helpers/one-by-one';
import type { AssistantMessagePart, TrekCard } from '@trek/shared';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../../src/nest/audit/audit-log.logger', () => logMock);

beforeEach(() => vi.clearAllMocks());

/** A session that answers every read with its tool and arguments, or fails the ones named. */
function session(failing: readonly string[] = []) {
  return {
    read: vi.fn(async (name: string, args: Record<string, unknown> = {}): Promise<ToolRun> =>
      failing.includes(name) ? { ok: false, value: 'Not allowed.' } : { ok: true, value: { name, args } },
    ),
    hintOf: vi.fn(() => ({ destructive: false, creates: true, group: 'vacay' })),
  };
}

const airports = {
  findByIata: vi.fn((code: string) =>
    code === 'MUC'
      ? { iata: 'MUC', name: 'Munich', city: 'München', lat: 48.35, lng: 11.79, tz: 'Europe/Berlin' }
      : null,
  ),
};
const opened = { ...session(), close: vi.fn(async () => undefined) };
const tools = { open: vi.fn(async () => opened) };
const context = new AssistantCardContext(
  airports as unknown as AirportsService,
  tools as unknown as AssistantToolsService,
);
const card = buildTripCard(1, 7, { trip: { title: 'Bavaria' }, days: [{ id: 31, day_number: 1 }] }, null, null);

describe('memoisedReader', () => {
  it('ASTCCX-001: reads a tool and its arguments once, whatever their key order', async () => {
    const s = session();
    const read = memoisedReader(s);
    const first = await read('get_vacay_plan', { year: 2026, userId: 7 });
    const again = await read('get_vacay_plan', { userId: 7, year: 2026 });
    await read('get_vacay_plan', { year: 2027, userId: 7 });
    expect(again).toBe(first);
    expect(first).toEqual({ name: 'get_vacay_plan', args: { year: 2026, userId: 7 } });
    expect(s.read).toHaveBeenCalledTimes(2);
  });

  it('ASTCCX-002: a read that failed or threw reads as null', async () => {
    const s = session(['list_budget_items']);
    const read = memoisedReader(s);
    expect(await read('list_budget_items')).toBeNull();
    s.read.mockRejectedValueOnce(new Error('closed'));
    expect(await read('get_trip_summary')).toBeNull();
  });
});

describe('loadFor', () => {
  it('ASTCCX-010: a lookup gets at most four reads; the ones past it read as null and are logged', async () => {
    const seen: unknown[] = [];
    const cards: Record<string, ToolCards> = {
      plan_days: {
        load: async (_args, read) => {
          seen.push(...(await oneByOne([2021, 2022, 2023, 2024, 2025], (year) => read('get_vacay_plan', { year }))));
          return seen.length;
        },
      },
    };
    const s = session();
    expect(await loadFor('plan_days', {}, memoisedReader(s), cards)).toBe(5);
    expect(s.read).toHaveBeenCalledTimes(MAX_CARD_READS);
    expect(seen.at(-1)).toBeNull();
    expect(String(logMock.logWarn.mock.calls[0]?.[0])).toContain('more than 4 reads');
  });

  it('ASTCCX-011: a lookup that throws gives null; a tool without one reads nothing', async () => {
    const cards: Record<string, ToolCards> = {
      broken: {
        load: () => {
          throw new Error('bad shape');
        },
      },
    };
    const s = session();
    expect(await loadFor('broken', {}, memoisedReader(s), cards)).toBeNull();
    expect(String(logMock.logWarn.mock.calls[0]?.[0])).toContain('the lookup of broken failed: bad shape');
    expect(await loadFor('create_place', {}, memoisedReader(s))).toBeNull();
    expect(s.read).not.toHaveBeenCalled();
  });
});

describe('AssistantCardContext', () => {
  it('ASTCCX-020: a turn reads the categories once, when the first change needs them', async () => {
    const s = session();
    s.read.mockImplementation(async (name: string) =>
      name === 'list_categories'
        ? { ok: true, value: { categories: [{ id: 2, name: 'Food', icon: null }] } }
        : { ok: false, value: 'no' },
    );
    const turn = context.forTurn(s, card, 'en', '2026-06-01');
    expect(s.read).not.toHaveBeenCalled();
    const first = await turn.describe('create_place', 'w1', { name: 'Hofbräuhaus', category_id: 2 });
    const second = await turn.describe('create_place', 'w2', { name: 'Viktualienmarkt', category_id: 2 });
    expect(first.rows).toContainEqual({ op: 'add', labelKey: 'category', before: null, after: 'Food' });
    expect(second.toolCallId).toBe('w2');
    expect(s.read).toHaveBeenCalledTimes(1);
  });

  it('ASTCCX-021: a tool without a card of its own is described from its arguments and its hint', async () => {
    const s = session();
    const preview = await context.forTurn(s, card, 'en', '2026-06-01').describe('set_vacay_days', 'w1', { days: 3 });
    expect(preview).toMatchObject({ verbKey: 'genericCreate', tool: 'set_vacay_days', domain: 'vacay' });
    expect(s.hintOf).toHaveBeenCalledWith('set_vacay_days');
  });

  it('ASTCCX-022: names an airport by its code, any case, and nothing for what is no code', () => {
    const ctx = context.contextOf(card, new Map(), 'en', '2026-06-01');
    expect(ctx.airport('muc')).toEqual({ city: 'München', lat: 48.35, lng: 11.79, tz: 'Europe/Berlin' });
    expect(ctx.airport('XXX')).toBeNull();
    expect(ctx.airport('Munich')).toBeNull();
    expect(airports.findByIata).toHaveBeenCalledTimes(2);
    expect(ctx).not.toHaveProperty('hintOf');
  });

  it('ASTCCX-024: a proposed change without a lookup is described without opening a session', async () => {
    const ctx = context.contextOf(card, new Map(), 'en', '2026-06-01');
    const [change] = await context.describeProposed(7, 1, ctx, [{ id: 'p1', toolName: 'create_place', args: {} }]);
    expect(change).toMatchObject({ id: 'p1', toolName: 'create_place', preview: { toolCallId: 'p1' } });
    expect(tools.open).not.toHaveBeenCalled();
  });

  it('ASTCCX-025: proposed changes with a lookup share one session and its memo, closed after', async () => {
    const ctx = context.contextOf(card, new Map(), 'en', '2026-06-01');
    const looked: unknown[] = [];
    const cards: Record<string, ToolCards> = {
      import_booking: {
        load: async (_args, read) => {
          looked.push(await read('list_reservations'));
          return null;
        },
      },
    };
    const calls = [
      { id: 'p1', toolName: 'import_booking', args: {} },
      { id: 'p2', toolName: 'import_booking', args: {} },
    ];
    const changes = await context.describeProposed(7, 1, ctx, calls, cards);
    expect(changes.map((change) => change.preview.toolCallId)).toEqual(['p1', 'p2']);
    expect(tools.open).toHaveBeenCalledTimes(1);
    expect(tools.open).toHaveBeenCalledWith(7, 1);
    expect(opened.read).toHaveBeenCalledTimes(1);
    expect(looked).toEqual([
      { name: 'list_reservations', args: {} },
      { name: 'list_reservations', args: {} },
    ]);
    expect(opened.close).toHaveBeenCalledTimes(1);
  });

  it('ASTCCX-023: the receipt of an applied change carries the card its builder gave', () => {
    const built = { kind: 'tourRoute' } as TrekCard;
    const applied = vi.spyOn(context, 'appliedCard').mockReturnValue(built);
    const w = { card: vi.fn() };
    const receipts: AssistantMessagePart[] = [];
    context.receipt(w, receipts, { id: 'w1', tool_name: 'create_hike' }, { name: 'Lake' }, { tour: {} }, null);
    expect(applied).toHaveBeenCalledWith('create_hike', {
      args: { name: 'Lake' },
      result: { tour: {} },
      preview: null,
    });
    expect(receipts).toEqual([{ type: 'data-trek-card', data: { toolCallId: 'w1', card: built } }]);
    applied.mockRestore();
    expect(context.appliedCard('create_place', { args: {}, result: {}, preview: null })).toBeNull();
  });
});
