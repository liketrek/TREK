/**
 * FE-AI-LOOK-001 to FE-AI-LOOK-007
 *
 * The chat's merged look: every verb, tool and kind has its row with a
 * literal key, applied changes open what they opened before the cards came,
 * every kind has a view, the shapes the map hooks of a kind fill, the
 * layout and map sides read through each kind's look, and a verb or entity
 * this build does not know looks like its generic one.
 */
import {
  ASSISTANT_CHANGE_VERB_KEYS,
  type AssistantApplied,
  type AssistantChangeVerbKey,
  type TrekCard,
  type TrekCardKind,
  type TrekCardOf,
  trekCardSchema,
} from '@trek/shared';
import { describe, expect, it } from 'vitest';

import type { GhostPoint, RouteLineSpec, RouteUse } from '../../../types/assistantMap';
import {
  CARD_LOOKS,
  CARD_MAP_LOOK,
  CARD_RULES,
  ENTITY_LOOK,
  STEP_LOOKS,
  TOOL_LABELS,
  VERB_LOOK,
  entityLookOf,
  verbLookOf,
} from './cardLooks';
import type { CardLook } from './cardTypes';
import { CARD_VIEWS } from './cardViews';

const KINDS = trekCardSchema.options.map((option) => option.shape.kind.value) as TrekCardKind[];
/** A vacation card cut down to its kind: the layout and map rules read nothing else of it. */
const VACAY = { kind: 'vacay' } as TrekCard;
/** A day route cut down to its kind, for the same reason. */
const DAY_ROUTE = { kind: 'dayRoute' } as TrekCardOf<'dayRoute'>;

describe('cardLooks', () => {
  it('FE-AI-LOOK-001: every verb is named by its own key', () => {
    for (const verb of ASSISTANT_CHANGE_VERB_KEYS) {
      expect(VERB_LOOK[verb].labelKey).toBe(`assistant.change.verb.${verb}`);
    }
  });

  it('FE-AI-LOOK-002: every tool label and step is a key of its own namespace', () => {
    for (const [tool, look] of Object.entries(TOOL_LABELS)) expect(look?.labelKey).toBe(`assistant.tool.${tool}`);
    for (const look of Object.values(STEP_LOOKS)) expect(look?.stepKey).toMatch(/^assistant\.step\./);
    expect(STEP_LOOKS.get_trip_summary?.stepKey).toBe('assistant.step.reading');
    // The Studio's page preview is the server's own read; it waits for the page and says so.
    expect(STEP_LOOKS.preview_book_page?.stepKey).toBe('assistant.step.lookingAtPage');
  });

  it('FE-AI-LOOK-003: a place, a stop, a note, a booking and a stay show on the map; a kept note never', () => {
    const onMap = Object.entries(ENTITY_LOOK).flatMap(([entity, look]) => (look.onMap ? [entity] : []));
    // The core's own; a part of TREK may add its entities (a stay shows its place).
    expect(onMap).toEqual(expect.arrayContaining(['assignment', 'day_note', 'place', 'reservation', 'accommodation']));
    expect(onMap).not.toContain('memory');
    expect(onMap).not.toContain('other');
    for (const entity of ['place', 'assignment', 'day_note', 'memory', 'other'] as const) {
      expect(ENTITY_LOOK[entity].open).toBeUndefined();
    }
  });

  it('FE-AI-LOOK-004: every kind has a look and a view; a pending view groups by kind and gives way to nothing', () => {
    expect(Object.keys(CARD_LOOKS).sort()).toEqual([...KINDS].sort());
    expect(Object.keys(CARD_VIEWS).sort()).toEqual([...KINDS].sort());
    expect(CARD_RULES.group(VACAY)).toBe('vacay');
    expect(CARD_RULES.yieldsToChange({ kind: 'costPerPerson' } as TrekCard, VACAY)).toBe(false);
  });

  it('FE-AI-LOOK-005: a kind draws its lines and points on the map through its look', () => {
    const look: CardLook<'dayRoute'> = {
      lines: (_card, use: RouteUse): RouteLineSpec[] => [
        { id: `day:${use}`, lines: [[[45.1, 7.2]]], color: 'var(--accent)', dashed: use !== 'pending' },
      ],
      ghosts: (): GhostPoint[] => [{ id: 'via', lat: 45.1, lng: 7.2, name: 'Col', variant: 'point' }],
    };
    expect(look.lines?.(DAY_ROUTE, 'before')).toEqual([
      { id: 'day:before', lines: [[[45.1, 7.2]]], color: 'var(--accent)', dashed: true },
    ]);
    expect(look.ghosts?.(DAY_ROUTE)[0]?.variant).toBe('point');
  });

  it("FE-AI-LOOK-006: the layout rules and the map read a kind's look, nothing for one that says nothing", () => {
    const route = CARD_LOOKS.dayRoute;
    route.group = () => 'routes';
    route.yieldsToChange = (_answer, change) => change.kind === 'dayRoute';
    route.lines = (_card, use) => [{ id: `day:${use}`, lines: [], color: 'var(--accent)' }];
    try {
      expect(CARD_RULES.group(DAY_ROUTE)).toBe('routes');
      expect(CARD_RULES.yieldsToChange(DAY_ROUTE, DAY_ROUTE)).toBe(true);
      expect(CARD_MAP_LOOK.lines(DAY_ROUTE, 'look')).toEqual([{ id: 'day:look', lines: [], color: 'var(--accent)' }]);
    } finally {
      delete route.group;
      delete route.yieldsToChange;
      delete route.lines;
    }
    expect(CARD_MAP_LOOK.lines(DAY_ROUTE, 'look')).toEqual([]);
    expect(CARD_MAP_LOOK.ghosts(VACAY)).toEqual([]);
    expect(CARD_MAP_LOOK.hidesEffectGhost(VACAY)).toBe(false);
  });

  it('FE-AI-LOOK-007: a verb or entity only a newer server knows looks like a plain update or an other', () => {
    expect(verbLookOf('laterVerb' as AssistantChangeVerbKey)).toBe(VERB_LOOK.genericUpdate);
    expect(entityLookOf('later_entity' as AssistantApplied['entity'])).toBe(ENTITY_LOOK.other);
    expect(verbLookOf('addPlace')).toBe(VERB_LOOK.addPlace);
    expect(entityLookOf('place')).toBe(ENTITY_LOOK.place);
  });
});
