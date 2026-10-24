/**
 * The cards registry: the packages' entries merged by tool name, every overlap
 * refused at load, and the guarded card calls that give no card, never a
 * broken turn, for a builder that throws, misbuilds or builds too much. The
 * receipt card of an applied change rides on the same guard.
 */
import { buildTripCard } from '../../../../../src/nest/assistant/assistant-context';
import { withPackageControllers } from '../../../../../src/nest/assistant/assistant-tool-offer';
import { CORE_WRITE_TOOLS } from '../../../../../src/nest/assistant/assistant-tools.constants';
import { receiptCard } from '../../../../../src/nest/assistant/cards/applied-cards';
import type { DomainCards, PreviewContext, ToolCards } from '../../../../../src/nest/assistant/cards/card-types';
import { Rows } from '../../../../../src/nest/assistant/cards/preview-format';
import {
  answerCardOf,
  ASSISTANT_UNDO_MAP,
  ASSISTANT_WRITE_TOOLS,
  CARD_PROMPT_LINES,
  DOMAINS,
  guardedCards,
  mergeDomains,
  nameArgOf,
  refuseCoreOverlap,
  TOOL_CARDS,
  undoReadsOf,
  type CardCheck,
} from '../../../../../src/nest/assistant/cards/registry';
import type { AssistantMessagePart, TrekCard } from '@trek/shared';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z, type ZodType } from 'zod';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../../src/nest/audit/audit-log.logger', () => logMock);

beforeEach(() => vi.clearAllMocks());

const card = buildTripCard(1, 7, { trip: { title: 'Alps' } }, null, null);
const ctx: PreviewContext = { card, categories: new Map(), locale: 'en', today: '2026-06-01', airport: () => null };

/**
 * A stand-in for the card union with one kind of its own, so these cases hold
 * whatever fields the packages give their kinds.
 */
const PROBE: CardCheck = {
  schema: z.object({ kind: z.literal('probe'), title: z.string().max(12) }) as unknown as ZodType<TrekCard>,
  maxChars: 60,
};
const probe = (title: string) => ({ kind: 'probe', title }) as unknown as TrekCard;

const domain = (id: DomainCards['id'], tools: Record<string, ToolCards>, extra: Partial<DomainCards> = {}) => ({
  id,
  tools,
  ...extra,
});
const described = () => ({ subject: 'x', rows: new Rows(), dayId: null, placeIds: [] });

describe('mergeDomains', () => {
  it('ASTREG-001: the live registry holds every package once, the core tables and the tours they brought', () => {
    expect(new Set(DOMAINS.map((d) => d.id)).size).toBe(DOMAINS.length);
    expect(DOMAINS).toHaveLength(13);
    for (const name of Object.keys(CORE_WRITE_TOOLS)) expect(ASSISTANT_WRITE_TOOLS[name]).toBe(CORE_WRITE_TOOLS[name]);
    expect(ASSISTANT_WRITE_TOOLS.create_hike).toEqual({ verbKey: 'addTour', entity: 'tour' });
    expect(ASSISTANT_UNDO_MAP.create_city_walk?.tool).toBe('delete_place');
    expect(ASSISTANT_UNDO_MAP.create_city_walk?.args({}, { tour: { place_id: 9 } }, null)).toEqual({ placeId: 9 });
    expect(TOOL_CARDS.update_tour?.undo).toBeUndefined();
    expect(CARD_PROMPT_LINES).toEqual(DOMAINS.flatMap((d) => d.prompt ?? []));
  });

  it('ASTREG-002: two packages may fill different fields of one tool, never the same one', () => {
    const answer = () => null;
    const merged = mergeDomains([
      domain('tour', { list_tours: { answer } }),
      domain('packing', { list_tours: { appliedIds: () => [1] } }),
    ]);
    expect(Object.keys(merged.tools.list_tours ?? {})).toEqual(['answer', 'appliedIds']);
    expect(() =>
      mergeDomains([domain('tour', { list_tours: { answer } }), domain('packing', { list_tours: { answer } })]),
    ).toThrow('"answer" of "list_tours" is claimed by tour and packing');
  });

  it("ASTREG-003: a package never takes the core's entry of a tool, nor half a curated card", () => {
    const write = { verbKey: 'genericCreate', entity: 'other' } as const;
    expect(() => mergeDomains([domain('budget', { create_place: { write, describe: described } })])).toThrow(
      '"write" of "create_place" is the core\'s own',
    );
    expect(() => mergeDomains([domain('budget', { import_booking: { write, describe: described } })])).toThrow(
      '"write" of "import_booking"',
    );
    const undo = { tool: 'delete_todo', args: () => null, unchanged: () => true };
    expect(() => mergeDomains([domain('packing', { create_todo: { undo } })])).toThrow('"undo" of "create_todo"');
    expect(() => mergeDomains([domain('tour', { update_place: { argPolicy: { stripped: ['x'] } } })])).toThrow(
      '"argPolicy" of "update_place"',
    );
    expect(() => mergeDomains([domain('vacay', { set_vacay: { describe: described } })])).toThrow(
      'needs both a write entry and a describer',
    );
    expect(() => mergeDomains([domain('vacay', { set_vacay: { write } })])).toThrow('needs both');
    // A change the server proposes itself keeps its verb in the core; a package may give it its words.
    const words = mergeDomains([domain('booking', { import_booking: { describe: described } })]);
    expect(words.tools.import_booking?.describe).toBe(described);
  });

  it('ASTREG-004: a package comes once, with at most two prompt lines; its lines, groups and projections are gathered', () => {
    expect(() => mergeDomains([domain('atlas', {}), domain('atlas', {})])).toThrow('registered twice');
    expect(() => mergeDomains([domain('atlas', {}, { prompt: ['a', 'b', 'c'] })])).toThrow('more than 2 prompt lines');
    const merged = mergeDomains([
      domain(
        'collection',
        { list_collection: { project: (value) => ({ kept: value }) } },
        {
          prompt: ['Collections are drawn as cards.'],
          foreignIdGroups: ['collections'],
        },
      ),
      domain('atlas', {}, { prompt: ['The atlas too.'], foreignIdGroups: ['atlas'] }),
    ]);
    expect(merged.promptLines).toEqual(['Collections are drawn as cards.', 'The atlas too.']);
    expect([...merged.foreignIdGroups]).toEqual(['collections', 'atlas']);
    expect(merged.projections.list_collection?.(3)).toEqual({ kept: 3 });
  });

  it("ASTREG-005: the core's describers, effects and projections refuse a package's entry for their tool", () => {
    const tools: Record<string, ToolCards> = { create_place: { effect: () => null } };
    expect(() => refuseCoreOverlap('effect', ['create_place'], tools)).toThrow('"effect" of "create_place"');
    expect(() => refuseCoreOverlap('describe', ['create_place'], tools)).not.toThrow();
  });

  it('ASTREG-006: the controllers and held reads of the packages are gathered, a controller only once', () => {
    const merged = mergeDomains([
      domain('roadtrip', {}, { toolControllers: { roadtrip: ['CorridorMcp'] }, heldReads: ['fetch_corridor'] }),
      domain('budget', {}, { toolControllers: { roadtrip: ['TollMcp'], files: ['ReceiptMcp'] } }),
    ]);
    expect(merged.toolControllers).toEqual({ roadtrip: ['CorridorMcp', 'TollMcp'], files: ['ReceiptMcp'] });
    expect([...merged.heldReads]).toEqual(['fetch_corridor']);
    expect(() =>
      mergeDomains([
        domain('roadtrip', {}, { toolControllers: { roadtrip: ['CorridorMcp'] } }),
        domain('budget', {}, { toolControllers: { files: ['CorridorMcp'] } }),
      ]),
    ).toThrow('controller "CorridorMcp" is listed twice');
  });

  it('ASTREG-007: a package adds controllers to a known tool group, never to a new one or twice', () => {
    const core = { roadtrip: { about: 'Road trips.', controllers: ['RoadtripMcp'] } };
    expect(withPackageControllers(core, { roadtrip: ['CorridorMcp'] }).roadtrip?.controllers).toEqual([
      'RoadtripMcp',
      'CorridorMcp',
    ]);
    expect(core.roadtrip.controllers).toEqual(['RoadtripMcp']);
    expect(() => withPackageControllers(core, { trains: ['RailMcp'] })).toThrow('no group "trains"');
    expect(() => withPackageControllers(core, { roadtrip: ['RoadtripMcp'] })).toThrow(
      '"RoadtripMcp" is listed already',
    );
  });
});

describe('the guarded card calls', () => {
  const answerInput = { toolCallId: 'c1', args: {}, value: {}, card, today: '2026-06-01' };

  it('ASTREG-010: a card that fits its kind comes through as the union reads it', () => {
    const calls = guardedCards(
      { find: { answer: () => ({ ...probe('Lake'), extra: 1 }) as unknown as TrekCard } },
      PROBE,
    );
    expect(calls.answerCardOf('find', answerInput)).toEqual({ kind: 'probe', title: 'Lake' });
    expect(calls.answerCardOf('other', answerInput)).toBeNull();
    expect(logMock.logWarn).not.toHaveBeenCalled();
  });

  it('ASTREG-011: a builder that throws, misbuilds or builds past the size cap gives null and a log line', () => {
    const calls = guardedCards(
      {
        thrown: {
          answer: () => {
            throw new Error('boom');
          },
        },
        misbuilt: { change: () => probe('A title far too long') },
        heavy: { applied: () => probe('x'.repeat(12)) },
      },
      { ...PROBE, maxChars: 30 },
    );
    expect(calls.answerCardOf('thrown', answerInput)).toBeNull();
    expect(calls.changeCardOf('misbuilt', ctx, {}, null)).toBeNull();
    expect(calls.appliedCardOf('heavy', { args: {}, result: {}, preview: null })).toBeNull();
    const lines = logMock.logWarn.mock.calls.map(([line]) => String(line));
    expect(lines[0]).toContain('the answer card of thrown failed: boom');
    expect(lines[1]).toContain('the change card of misbuilt does not fit its kind: title');
    expect(lines[2]).toContain('the applied card of heavy is too large');
  });

  it('ASTREG-012: the live calls check against the card union itself', () => {
    expect(answerCardOf('list_places', answerInput)).toBeNull();
    const unknown = guardedCards({ list_places: { answer: () => ({ kind: 'bookPage' }) as unknown as TrekCard } });
    expect(unknown.answerCardOf('list_places', answerInput)).toBeNull();
    expect(String(logMock.logWarn.mock.calls[0]?.[0])).toContain('does not fit its kind');
  });

  it('ASTREG-013: a package names no id and reads nothing for an undo unless it says so', () => {
    expect(nameArgOf('create_hike', 'placeId', 3, card)).toBeNull();
    expect(undoReadsOf('create_hike', {}, {})).toEqual([]);
    expect(undoReadsOf('no_such_tool', {}, {})).toEqual([]);
  });
});

describe('receiptCard', () => {
  it('ASTREG-020: streams and keeps the applied card under the write id, for the tool a found place runs as', () => {
    const w = { card: vi.fn() };
    const receipts: AssistantMessagePart[] = [];
    const build = vi.fn(() => probe('Lake'));
    const args = { via: 'create_and_assign_place', dayId: 3, name: 'Lake' };
    receiptCard(w, receipts, { id: 'w1', tool_name: 'add_found_place' }, args, { place: { id: 4 } }, null, build);
    expect(build).toHaveBeenCalledWith('create_and_assign_place', {
      args,
      result: { place: { id: 4 } },
      preview: null,
    });
    expect(w.card).toHaveBeenCalledWith({ toolCallId: 'w1', card: probe('Lake') });
    expect(receipts).toEqual([{ type: 'data-trek-card', data: { toolCallId: 'w1', card: probe('Lake') } }]);
  });

  it('ASTREG-021: adds nothing when the tool has no applied card', () => {
    const w = { card: vi.fn() };
    const receipts: AssistantMessagePart[] = [];
    receiptCard(w, receipts, { id: 'w1', tool_name: 'create_place' }, {}, {}, null);
    expect(w.card).not.toHaveBeenCalled();
    expect(receipts).toEqual([]);
  });
});
