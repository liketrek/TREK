import {
  ASSISTANT_CHANGE_VERB_KEYS,
  assistantAppliedSchema,
  assistantChangePreviewSchema,
  assistantMessagePartSchema,
  assistantMessagePartWriteSchema,
  assistantStoredPartsSchema,
  assistantTakeProposalRequestSchema,
  CORE_APPLIED_ENTITIES,
  CORE_VERB_KEYS,
  uiStreamChunkSchema,
  UI_STREAM_DONE,
} from '../assistant.schema';
import { cardFileKeySchema, cardPersonSchema, cardText, MAX_CARD_CHARS } from './card-parts';
import { assistantCardSchema, storedTrekCardSchema, trekCardSchema } from './index';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const CALL = 'call_1';
const preview = {
  toolCallId: CALL,
  verbKey: 'addTour',
  subject: 'Lake loop',
  rows: [],
  dayId: null,
  placeIds: [],
  undoable: true,
};

/** Every kind as its package declares it today, built from its own literal. */
const KINDS = trekCardSchema.options.map((option) => option.shape.kind.value);

/**
 * A kind as the packages build theirs, from the card parts, with bounds to
 * cross: the read tolerance is the same for every kind, so these cases hold
 * whatever fields the packages give their own.
 */
const probeSchema = z
  .discriminatedUnion('kind', [
    z.object({ kind: z.literal('probe'), title: cardText(8), people: z.array(cardPersonSchema).max(2) }),
  ])
  .nullable()
  .catch(null);

describe('the card union', () => {
  it('CARDS-001: holds every kind once, each read as itself', () => {
    expect(new Set(KINDS).size).toBe(KINDS.length);
    expect(KINDS).toEqual(expect.arrayContaining(['tourRoute', 'tourList', 'packingList', 'todoList']));
    for (const kind of KINDS) {
      const read = storedTrekCardSchema.parse({ kind });
      if (read !== null) expect(read.kind).toBe(kind);
    }
  });

  it('CARDS-002: reads an unknown kind, a missing kind or no card at all as null', () => {
    for (const card of [{ kind: 'bookPage' }, {}, null, undefined, 'tourRoute', 7]) {
      expect(storedTrekCardSchema.parse(card)).toBeNull();
    }
  });

  it('CARDS-003: reads a field past its bound as null, and drops keys a kind does not declare', () => {
    expect(probeSchema.parse({ kind: 'probe', title: 'Far too long a title', people: [] })).toBeNull();
    const four = [1, 2, 3, 4].map((id) => ({ id, name: `P${id}`, avatarKey: null }));
    expect(probeSchema.parse({ kind: 'probe', title: 'Walk', people: four })).toBeNull();
    expect(probeSchema.parse({ kind: 'probe', title: 'Walk', people: [], url: 'https://x.test' })).toEqual({
      kind: 'probe',
      title: 'Walk',
      people: [],
    });
  });

  it('CARDS-004: a stored file key is a file name, never a path, a URL or a way up', () => {
    expect(cardFileKeySchema.safeParse('a1b2c3.jpg').success).toBe(true);
    for (const key of ['../secret', 'avatars/a.jpg', 'https://x.test/a.jpg', '.hidden', 'a..b', '']) {
      expect(cardFileKeySchema.safeParse(key).success).toBe(false);
    }
    expect(MAX_CARD_CHARS).toBe(24_000);
  });
});

describe('cards in parts, chunks and previews', () => {
  it('CARDS-010: a card part reads an unknown, a kindless or a broken card as null and keeps the part', () => {
    for (const card of [{ kind: 'bookPage', page: 3 }, { title: 'x' }, 'nope']) {
      const part = assistantMessagePartSchema.parse({ type: 'data-trek-card', data: { toolCallId: CALL, card } });
      expect(part).toEqual({ type: 'data-trek-card', data: { toolCallId: CALL, card: null } });
    }
  });

  it('CARDS-011: a card chunk reads the same way, and a known card comes through with extra keys dropped', () => {
    const unknown = uiStreamChunkSchema.parse({
      type: 'data-trek-card',
      data: { toolCallId: CALL, card: { kind: 'x' } },
    });
    expect(unknown).toEqual({ type: 'data-trek-card', data: { toolCallId: CALL, card: null } });
    const known = assistantCardSchema.parse({ toolCallId: CALL, card: { kind: KINDS[0], later: 1 }, extra: true });
    expect(known).not.toHaveProperty('extra');
    if (known.card !== null) expect(known.card).not.toHaveProperty('later');
  });

  it('CARDS-012: a change preview reads without a card, and with a broken one as null', () => {
    expect(assistantChangePreviewSchema.parse(preview)).not.toHaveProperty('card');
    expect(assistantChangePreviewSchema.parse({ ...preview, card: { kind: 'nope' } }).card).toBeNull();
    expect(assistantChangePreviewSchema.parse({ ...preview, card: { title: 'no kind' } }).card).toBeNull();
  });

  it('CARDS-014: a verb or an entity a later build added reads as a plain update and as other', () => {
    const later = { ...preview, verbKey: 'laterVerb' };
    expect(assistantChangePreviewSchema.parse(later).verbKey).toBe('genericUpdate');
    const receipt = { toolCallId: CALL, entity: 'later_entity', ids: [4], dayId: null, undoUntil: null };
    expect(assistantAppliedSchema.parse(receipt).entity).toBe('other');
    const parts = assistantStoredPartsSchema.parse([
      { type: 'data-trek-change', data: later },
      { type: 'data-trek-applied', data: receipt },
    ]);
    expect(parts.map((part) => part.type)).toEqual(['data-trek-change', 'data-trek-applied']);
  });

  it('CARDS-013: a card is always under its call, whose id is 1 to 64 characters', () => {
    expect(assistantCardSchema.safeParse({ toolCallId: '', card: null }).success).toBe(false);
    expect(assistantCardSchema.safeParse({ toolCallId: 'x'.repeat(65), card: null }).success).toBe(false);
  });
});

describe('stored parts', () => {
  it('CARDS-020: drop a data part this build does not know, or one that no longer reads, and keep the rest', () => {
    const parts = assistantStoredPartsSchema.parse([
      { type: 'text', text: 'Here is the walk.' },
      { type: 'data-trek-book-page', data: { page: 3 } },
      { type: 'data-trek-places', data: { toolCallId: CALL } },
      { type: 'data-trek-card', data: { toolCallId: CALL, card: { kind: 'future' } } },
      { type: 'data-trek-change', data: preview },
    ]);
    expect(parts.map((part) => part.type)).toEqual(['text', 'data-trek-card', 'data-trek-change']);
  });

  it('CARDS-021: still refuse a broken part that is not a data part', () => {
    expect(assistantStoredPartsSchema.safeParse([{ type: 'text', text: 5 }]).success).toBe(false);
    expect(assistantStoredPartsSchema.safeParse([{ type: 'tool-call' }]).success).toBe(false);
  });

  it('CARDS-022: are written strictly: an unknown part is no part', () => {
    expect(assistantMessagePartSchema.safeParse({ type: 'data-trek-book-page', data: {} }).success).toBe(false);
    expect(assistantMessagePartWriteSchema.safeParse({ type: 'data-trek-book-page', data: {} }).success).toBe(false);
  });

  it('CARDS-023: are written strictly: no verb, entity or card kind this build does not know', () => {
    const write = (part: unknown) => assistantMessagePartWriteSchema.safeParse(part).success;
    expect(write({ type: 'data-trek-change', data: preview })).toBe(true);
    expect(write({ type: 'data-trek-change', data: { ...preview, verbKey: 'laterVerb' } })).toBe(false);
    expect(write({ type: 'data-trek-change', data: { ...preview, card: { kind: 'nope' } } })).toBe(false);
    const receipt = { toolCallId: CALL, entity: 'later_entity', ids: [4], dayId: null, undoUntil: null };
    expect(write({ type: 'data-trek-applied', data: receipt })).toBe(false);
    expect(write({ type: 'data-trek-card', data: { toolCallId: CALL, card: { kind: 'nope' } } })).toBe(false);
    expect(write({ type: 'data-trek-card', data: { toolCallId: CALL, card: null } })).toBe(true);
  });
});

describe('the enums the packages extend', () => {
  it('CARDS-030: keep every core verb and entity, the hike verbs among them', () => {
    expect(ASSISTANT_CHANGE_VERB_KEYS).toEqual(expect.arrayContaining([...CORE_VERB_KEYS]));
    expect(ASSISTANT_CHANGE_VERB_KEYS).toEqual(expect.arrayContaining(['addTour', 'updateTour', 'importTour']));
    expect(new Set(ASSISTANT_CHANGE_VERB_KEYS).size).toBe(ASSISTANT_CHANGE_VERB_KEYS.length);
    for (const entity of CORE_APPLIED_ENTITIES) {
      expect(assistantAppliedSchema.shape.entity.safeParse(entity).success).toBe(true);
    }
  });
});

describe('assistantTakeProposalRequestSchema', () => {
  it('CARDS-040: names the read whose proposal is taken, with the turn context and nothing else', () => {
    const ctx = { locale: 'en', timeZone: 'Europe/Berlin' };
    expect(assistantTakeProposalRequestSchema.parse({ ...ctx, toolCallId: CALL })).toEqual({
      ...ctx,
      toolCallId: CALL,
    });
    expect(assistantTakeProposalRequestSchema.safeParse({ ...ctx, toolCallId: '' }).success).toBe(false);
    expect(assistantTakeProposalRequestSchema.safeParse({ ...ctx, toolCallId: CALL, args: {} }).success).toBe(false);
    expect(assistantTakeProposalRequestSchema.safeParse({ toolCallId: CALL }).success).toBe(false);
  });
});

describe('ui-stream.cards.v1 fixture', () => {
  const text = readFileSync(resolve(__dirname, '../__fixtures__/ui-stream.cards.v1.txt'), 'utf8');
  const events = text
    .split('\n\n')
    .filter(Boolean)
    .map((event) => event.slice('data: '.length));
  const chunks = events.slice(0, -1).map((event) => uiStreamChunkSchema.parse(JSON.parse(event)));

  it('CARDS-050: is a stream of valid chunks closed by [DONE]', () => {
    expect(events.at(-1)).toBe(UI_STREAM_DONE);
    expect(chunks.length).toBeGreaterThan(10);
  });

  it('CARDS-051: carries an applied write card after its receipt, a read card after its answer, a held one in its preview', () => {
    const types = chunks.map((chunk) => chunk.type);
    const cards = chunks.flatMap((chunk) => (chunk.type === 'data-trek-card' ? [chunk.data.toolCallId] : []));
    const applied = chunks.find((chunk) => chunk.type === 'data-trek-applied');
    const read = chunks.find((chunk) => chunk.type === 'tool-input-start' && chunk.toolName === 'list_tours');
    expect(applied?.type === 'data-trek-applied' && applied.data.toolCallId).toBe(cards[0]);
    expect(read?.type === 'tool-input-start' && read.toolCallId).toBe(cards[1]);
    expect(types.indexOf('data-trek-applied')).toBeLessThan(types.indexOf('data-trek-card'));
    const change = chunks.find((chunk) => chunk.type === 'data-trek-change');
    expect(change?.type === 'data-trek-change' && 'card' in change.data).toBe(true);
  });
});
