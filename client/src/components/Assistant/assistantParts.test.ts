/**
 * FE-AI-PARTS-001 to FE-AI-PARTS-019
 *
 * How an answer is laid out: text, the steps the assistant looked up, the
 * places and the weather they found, the cards its tools brought, and one
 * card per batch of proposed changes, each change in the state its approval
 * and receipt put it in, with its own card.
 */
import {
  ASSISTANT_CHANGE_LABEL_KEYS,
  type AssistantApplied,
  type AssistantChangePreview,
  type AssistantFoundPlace,
  type AssistantMessage,
  type AssistantMessagePart,
  type AssistantWeatherDay,
  type TrekCard,
} from '@trek/shared';
import { describe, expect, it } from 'vitest';

import {
  CHANGE_LABELS,
  type CardRules,
  hasUndecided,
  messageBlocks,
  suggestedFromStrip,
  undoLeftMs,
} from './assistantParts';

const AT = '2026-10-21T08:00:00.000Z';

function message(parts: AssistantMessagePart[]): AssistantMessage {
  return { id: 'm1', role: 'assistant', status: 'complete', createdAt: AT, parts };
}

function preview(toolCallId: string): AssistantChangePreview {
  return {
    toolCallId,
    verbKey: 'addTodo',
    subject: `Todo ${toolCallId}`,
    rows: [],
    dayId: null,
    placeIds: [],
    undoable: true,
  };
}

function applied(toolCallId: string, undoUntil: string | null = null): AssistantApplied {
  return { toolCallId, entity: 'todo', ids: [1], dayId: null, undoUntil };
}

const read = (id: string, result?: unknown): AssistantMessagePart => ({
  type: 'tool-call',
  toolCallId: id,
  toolName: 'list_places',
  args: {},
  ...(result !== undefined ? { result } : {}),
});

const write = (
  id: string,
  approval: { approved?: boolean; resolution?: 'cancelled' | 'expired' } = {},
  outcome: { result?: unknown; isError?: boolean } = {}
): AssistantMessagePart => ({
  type: 'tool-call',
  toolCallId: id,
  toolName: 'create_todo',
  args: {},
  approval: { id, ...approval },
  ...outcome,
});

describe('messageBlocks', () => {
  it('FE-AI-PARTS-001: keeps text, gathers adjacent reading steps and drops empty text', () => {
    const blocks = messageBlocks(
      message([
        { type: 'text', text: 'Let me look.' },
        read('r1', { ok: 1 }),
        read('r2', { ok: 2 }),
        { type: 'text', text: '  ' },
        { type: 'text', text: 'Found two.' },
      ]),
      false
    );
    expect(blocks.map((b) => b.kind)).toEqual(['text', 'steps', 'text']);
    expect(blocks[1]).toMatchObject({
      kind: 'steps',
      steps: [
        { toolCallId: 'r1', running: false },
        { toolCallId: 'r2', running: false },
      ],
    });
  });

  it('FE-AI-PARTS-002: a step without its result runs only while the answer is being written', () => {
    const parts = [read('r1')];
    expect(messageBlocks(message(parts), true)[0]).toMatchObject({ steps: [{ running: true }] });
    expect(messageBlocks(message(parts), false)[0]).toMatchObject({ steps: [{ running: false }] });
  });

  it('FE-AI-PARTS-003: the changes of one step share a card, each with its preview, wherever the preview sits', () => {
    const blocks = messageBlocks(
      message([
        write('w1'),
        { type: 'data-trek-change', data: preview('w1') },
        write('w2'),
        { type: 'data-trek-change', data: preview('w2') },
      ]),
      false
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      kind: 'change',
      items: [
        { toolCallId: 'w1', state: 'pending', preview: { subject: 'Todo w1' } },
        { toolCallId: 'w2', state: 'pending', preview: { subject: 'Todo w2' } },
      ],
    });
  });

  it('FE-AI-PARTS-004: reads each change state off its approval, result and receipt', () => {
    const parts: AssistantMessagePart[] = [
      write('applying', { approved: true }),
      write('done', { approved: true }, { result: { id: 1 } }),
      write('receipt', { approved: true }),
      { type: 'data-trek-applied', data: applied('receipt') },
      write('broke', { approved: true }, { result: 'nope', isError: true }),
      write('no', { approved: false }),
      write('late', { resolution: 'expired' }),
    ];
    const [card] = messageBlocks(message(parts), false);
    expect(card?.kind === 'change' && card.items.map((i) => [i.toolCallId, i.state])).toEqual([
      ['applying', 'applying'],
      ['done', 'applied'],
      ['receipt', 'applied'],
      ['broke', 'failed'],
      ['no', 'discarded'],
      ['late', 'expired'],
    ]);
    expect(card?.kind === 'change' && card.items[2]?.applied).toEqual(applied('receipt'));
  });

  it('FE-AI-PARTS-005: text between two batches of changes splits them into two cards', () => {
    const blocks = messageBlocks(message([write('w1'), { type: 'text', text: 'And one more.' }, write('w2')]), false);
    expect(blocks.map((b) => b.kind)).toEqual(['change', 'text', 'change']);
  });
});

function found(ref: string, extra: Partial<AssistantFoundPlace> = {}): AssistantFoundPlace {
  return {
    ref,
    name: `Place ${ref}`,
    address: null,
    lat: 41.89,
    lng: 12.47,
    kind: 'food',
    rating: null,
    openNow: null,
    googlePlaceId: null,
    osmId: null,
    photoKey: null,
    inTripPlaceId: null,
    ...extra,
  };
}

const places = (toolCallId: string, list: AssistantFoundPlace[], more = 0): AssistantMessagePart => ({
  type: 'data-trek-places',
  data: { toolCallId, places: list, more },
});

function sky(date: string, tempMax: number): AssistantWeatherDay {
  return { dayId: null, date, main: 'Clear', tempMax, tempMin: null, rainPct: null, kind: 'forecast' };
}

/** A change of the model that adds a place to day 3: a new one at a spot, or the trip's own by id. */
function adds(id: string, spot: { lat: number; lng: number } | null, placeId: number | null): AssistantMessagePart {
  return {
    type: 'data-trek-change',
    data: {
      ...preview(id),
      effect: {
        kind: 'add',
        dayId: 3,
        fromDayId: null,
        placeId,
        assignmentId: null,
        place: spot && { name: 'New', categoryId: null, ...spot },
      },
    },
  };
}

describe('messageBlocks: found places and weather', () => {
  it('FE-AI-PARTS-008: joins the places of all searches into one strip, each once, and steps after it join the row before it', () => {
    const blocks = messageBlocks(
      message([
        read('s1', []),
        places('s1', [found('s1:0'), found('s1:1', { googlePlaceId: 'ChIJa' })], 2),
        read('s2', []),
        places('s2', [found('s2:0', { name: 'Place s1:0' }), found('s2:1', { googlePlaceId: 'ChIJa', lat: 40 })], 3),
        places('s3', [found('s3:0', { lat: 40 })]),
        { type: 'text', text: 'Three good ones, Place s3:0 first.' },
      ]),
      false
    );
    expect(blocks.map((b) => b.kind)).toEqual(['steps', 'places', 'text']);
    expect(blocks[0]).toMatchObject({ steps: [{ toolCallId: 's1' }, { toolCallId: 's2' }] });
    // The same name at the same spot, or the same Google id, shows once.
    expect(blocks[1]).toMatchObject({
      found: { toolCallId: 's3', more: 5, places: [{ ref: 's3:0' }, { ref: 's1:0' }, { ref: 's1:1' }] },
    });
  });

  it('FE-AI-PARTS-008d: an answer that planned a tour shows no found places, even one whose planning failed', () => {
    const blocks = messageBlocks(
      message([
        places('s1', [found('s1:0', { name: 'Treseburg' })]),
        {
          type: 'tool-call',
          toolCallId: 'h1',
          toolName: 'propose_hike',
          args: {},
          result: 'Router down',
          isError: true,
        },
        { type: 'text', text: 'Treseburg is the turning point.' },
      ]),
      false
    );
    expect(blocks.map((b) => b.kind)).not.toContain('places');
  });

  it('FE-AI-PARTS-008c: a note kept in the trip notes is a line of its own, a refused or running one a step', () => {
    const kept = (id: string, extra: Record<string, unknown>): AssistantMessagePart =>
      ({
        type: 'tool-call',
        toolCallId: id,
        toolName: 'remember_for_trip',
        args: { note: ' Vegetarian ' },
        ...extra,
      }) as AssistantMessagePart;
    const blocks = messageBlocks(
      message([
        kept('m1', { result: { notes: 'Vegetarian' } }),
        kept('m2', { result: 'The trip notes are full.', isError: true }),
      ]),
      false
    );
    expect(blocks).toMatchObject([
      { kind: 'remembered', note: 'Vegetarian' },
      { kind: 'steps', steps: [{ toolCallId: 'm2' }] },
    ]);
    expect(messageBlocks(message([kept('m3', {})]), true)).toMatchObject([{ kind: 'steps' }]);
  });

  it('FE-AI-PARTS-008b: an answer that names none of the places it found shows no strip', () => {
    const blocks = messageBlocks(
      message([places('s1', [found('s1:0', { name: 'Café Ñandú' })]), { type: 'text', text: 'It rains all day.' }]),
      false
    );
    expect(blocks.map((b) => b.kind)).toEqual(['text']);
    // Named with other accents and case, it is the same place.
    const named = messageBlocks(
      message([places('s1', [found('s1:0', { name: 'Café Ñandú' })]), { type: 'text', text: 'Try cafe nandu.' }]),
      false
    );
    expect(named.map((b) => b.kind)).toEqual(['places', 'text']);
  });

  it('FE-AI-PARTS-009: drops the places a change of the model proposes, and the strip if none is left', () => {
    const blocks = messageBlocks(
      message([
        places('s1', [found('s1:0'), found('s1:1', { lat: 40, inTripPlaceId: 8 }), found('s1:2', { lat: 39 })]),
        write('w1'),
        adds('w1', { lat: 41.89, lng: 12.47 }, null),
        write('w2'),
        adds('w2', null, 8),
      ]),
      false
    );
    expect(blocks[0]).toMatchObject({ kind: 'places', found: { places: [{ ref: 's1:2' }] } });

    const none = messageBlocks(
      message([places('s1', [found('s1:0')]), write('w1'), adds('w1', { lat: 41.89, lng: 12.47 }, null)]),
      false
    );
    expect(none.map((b) => b.kind)).toEqual(['change']);
  });

  it('FE-AI-PARTS-010: a place suggested from the strip stays on it and reads as suggested', () => {
    const msg = message([
      places('s1', [found('s1:0'), found('s1:1', { lat: 40 })]),
      {
        type: 'tool-call',
        toolCallId: 'f1',
        toolName: 'add_found_place',
        args: { via: 'create_and_assign_place', dayId: 3, name: 'Place s1:0', lat: 41.89, lng: 12.47 },
        approval: { id: 'f1' },
      },
      adds('f1', { lat: 41.89, lng: 12.47 }, null),
    ]);
    const [strip] = messageBlocks(msg, false);
    expect(strip).toMatchObject({ kind: 'places', found: { places: [{ ref: 's1:0' }, { ref: 's1:1' }] } });
    expect(suggestedFromStrip(msg, found('s1:0'))).toBe(true);
    expect(suggestedFromStrip(msg, found('s1:1', { lat: 40 }))).toBe(false);

    const inTrip = message([
      {
        type: 'tool-call',
        toolCallId: 'f2',
        toolName: 'add_found_place',
        args: { placeId: 8 },
        approval: { id: 'f2' },
      },
    ]);
    expect(suggestedFromStrip(inTrip, found('x', { inTripPlaceId: 8 }))).toBe(true);
    expect(suggestedFromStrip(inTrip, found('x', { inTripPlaceId: 9 }))).toBe(false);
  });

  it('FE-AI-PARTS-014: each suggestion from the strip is a card of its own, apart from the changes around it', () => {
    const fromStrip = (id: string, approval: { approved?: boolean } = {}): AssistantMessagePart => ({
      type: 'tool-call',
      toolCallId: id,
      toolName: 'add_found_place',
      args: { placeId: 8 },
      approval: { id, ...approval },
    });
    const blocks = messageBlocks(
      message([write('w1', { approved: true }), fromStrip('f1', { approved: true }), fromStrip('f2'), write('w2')]),
      false
    );
    expect(blocks.map((b) => (b.kind === 'change' ? b.items.map((i) => i.toolCallId) : b.kind))).toEqual([
      ['w1'],
      ['f1'],
      ['f2'],
      ['w2'],
    ]);
  });

  it('FE-AI-PARTS-011: the weather of all steps is one row, one entry per date, where the first look sat', () => {
    const blocks = messageBlocks(
      message([
        read('w1', {}),
        { type: 'data-trek-weather', data: { days: [sky('2026-11-03', 18), sky('2026-11-02', 20)] } },
        { type: 'text', text: 'Mild.' },
        { type: 'data-trek-weather', data: { days: [sky('2026-11-03', 15)] } },
      ]),
      false
    );
    expect(blocks.map((b) => b.kind)).toEqual(['steps', 'weather', 'text']);
    expect(blocks[1]).toMatchObject({
      kind: 'weather',
      days: [
        { date: '2026-11-02', tempMax: 20 },
        { date: '2026-11-03', tempMax: 15 },
      ],
    });
  });
});

describe('messageBlocks: cards', () => {
  const ROUTE = { kind: 'tourRoute' } as TrekCard;
  const LIST = { kind: 'tourList' } as TrekCard;
  const card = (toolCallId: string, value: TrekCard | null): AssistantMessagePart => ({
    type: 'data-trek-card',
    data: { toolCallId, card: value },
  });

  it('FE-AI-PARTS-015: a read card joins the cards of its kind across steps, and the steps stay one row', () => {
    const blocks = messageBlocks(
      message([read('r1', {}), card('r1', LIST), read('r2', {}), card('r2', LIST), read('r3', {}), card('r3', ROUTE)]),
      false
    );
    expect(blocks.map((b) => b.kind)).toEqual(['steps', 'cards', 'cards']);
    expect(blocks[0]).toMatchObject({ steps: [{ toolCallId: 'r1' }, { toolCallId: 'r2' }, { toolCallId: 'r3' }] });
    expect(blocks[1]).toMatchObject({ group: 'tourList', entries: [{ toolCallId: 'r1' }, { toolCallId: 'r2' }] });
    expect(blocks[2]).toMatchObject({ group: 'tourRoute', entries: [{ toolCallId: 'r3', card: ROUTE }] });
  });

  it('FE-AI-PARTS-016: text between cards starts a new block; a card that did not read leaves nothing', () => {
    const blocks = messageBlocks(
      message([card('r1', LIST), { type: 'text', text: 'And more:' }, card('r2', LIST), card('r3', null)]),
      false
    );
    expect(blocks.map((b) => b.kind)).toEqual(['cards', 'text', 'cards']);
    expect(blocks[2]).toMatchObject({ entries: [{ toolCallId: 'r2' }] });
  });

  it('FE-AI-PARTS-017: a change carries its preview card until the applied card replaces it, and forms no block', () => {
    const held = { ...preview('w1'), card: ROUTE };
    const before = messageBlocks(message([write('w1'), { type: 'data-trek-change', data: held }]), false);
    expect(before).toHaveLength(1);
    expect(before[0]).toMatchObject({ kind: 'change', items: [{ toolCallId: 'w1', card: ROUTE }] });

    const after = messageBlocks(
      message([
        write('w1', { approved: true }, { result: {} }),
        { type: 'data-trek-change', data: held },
        { type: 'data-trek-applied', data: applied('w1') },
        card('w1', LIST),
      ]),
      false
    );
    expect(after.map((b) => b.kind)).toEqual(['change']);
    expect(after[0]).toMatchObject({ items: [{ toolCallId: 'w1', state: 'applied', card: LIST }] });

    const plain = messageBlocks(message([write('w2'), { type: 'data-trek-change', data: preview('w2') }]), false);
    expect(plain[0]).toMatchObject({ items: [{ card: null }] });
  });

  it('FE-AI-PARTS-018: the rules group cards, and a lookup card that served a change gives way to it', () => {
    const rules: CardRules = {
      group: () => 'tours',
      yieldsToChange: (answer, change) => answer.kind === 'tourList' && change.kind === 'tourRoute',
    };
    const parts: AssistantMessagePart[] = [
      card('r1', LIST),
      card('r2', ROUTE),
      write('w1'),
      { type: 'data-trek-change', data: { ...preview('w1'), card: ROUTE } },
    ];
    const blocks = messageBlocks(message(parts), false, rules);
    expect(blocks.map((b) => b.kind)).toEqual(['cards', 'change']);
    expect(blocks[0]).toMatchObject({ group: 'tours', entries: [{ toolCallId: 'r2' }] });

    // Without a change card nothing gives way; with the plain rules each kind is its own group.
    const plain = messageBlocks(message(parts.slice(0, 2)), false);
    expect(plain.map((b) => (b.kind === 'cards' ? b.group : b.kind))).toEqual(['tourList', 'tourRoute']);
  });

  it('FE-AI-PARTS-019: a block left with no card goes, and a step after the cards joins the steps before them', () => {
    const rules: CardRules = { group: (c) => c.kind, yieldsToChange: () => true };
    const blocks = messageBlocks(
      message([
        read('r1', {}),
        card('r1', LIST),
        read('r2', {}),
        write('w1'),
        { type: 'data-trek-change', data: { ...preview('w1'), card: ROUTE } },
      ]),
      false,
      rules
    );
    expect(blocks.map((b) => b.kind)).toEqual(['steps', 'change']);
    expect(blocks[0]).toMatchObject({ steps: [{ toolCallId: 'r1' }, { toolCallId: 'r2' }] });
  });
});

describe('hasUndecided', () => {
  it('FE-AI-PARTS-012: is true only while a change waits for the user', () => {
    expect(hasUndecided([message([write('w1')])])).toBe(true);
    expect(hasUndecided([message([write('w1', { approved: true })])])).toBe(false);
    expect(hasUndecided([message([write('w1', { resolution: 'expired' })])])).toBe(false);
    expect(hasUndecided([message([read('r1')])])).toBe(false);
  });
});

describe('undoLeftMs', () => {
  it('FE-AI-PARTS-006: counts down to the end of the undo window and stops at zero', () => {
    const now = Date.parse(AT);
    expect(undoLeftMs(applied('a', '2026-10-21T08:10:00.000Z'), now)).toBe(10 * 60_000);
    expect(undoLeftMs(applied('a', '2026-10-21T07:59:00.000Z'), now)).toBe(0);
    expect(undoLeftMs(applied('a', null), now)).toBe(0);
    expect(undoLeftMs(null, now)).toBe(0);
  });
});

describe('CHANGE_LABELS', () => {
  it('FE-AI-PARTS-013: names a route', () => {
    expect(CHANGE_LABELS.route.labelKey).toBe('assistant.change.label.route');
  });

  it('FE-AI-PARTS-007: names every field a change row can carry', () => {
    for (const key of ASSISTANT_CHANGE_LABEL_KEYS) {
      expect(CHANGE_LABELS[key].labelKey).toBe(`assistant.change.label.${key}`);
    }
  });
});
