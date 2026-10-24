import type { CardPlace } from './assistant-context';
import { noteOf } from './assistant-memory';
import { ASSISTANT_SERVER_WRITE_TOOLS, REMEMBER_TOOL, writeToolOf } from './assistant-tools.constants';
import type { AppliedFrom, Described, PreviewContext } from './cards/card-types';
import {
  categoryName,
  clip,
  dayLabel,
  formatDate,
  id,
  localeOf,
  memberNames,
  money,
  placeName,
  Rows,
  text,
  UNCHECKED,
} from './cards/preview-format';
import {
  ASSISTANT_UNDO_MAP,
  ASSISTANT_WRITE_TOOLS,
  changeCardOf,
  describedOf,
  refuseCoreOverlap,
  TOOL_CARDS,
} from './cards/registry';
import { describeGeneric } from './tool-call-generic.helpers';
import type {
  AssistantApplied,
  AssistantChangeEffect,
  AssistantChangeLabelKey,
  AssistantChangePreview,
} from '@trek/shared';

/**
 * The change card of a held tool call: what it does and to what, in plain
 * words. Days, places, categories and people are named instead of numbered,
 * dates and amounts are written in the user's locale, and an update shows
 * what the field held before. A package's cards (cards/registry.ts) add the
 * describers, effects and drawn cards of their tools; the bookings, a booking
 * from a file among them, are the booking package's (cards/booking/).
 */

type Args = Record<string, unknown>;

const MAX_ROWS = 12;

function has(args: Args, key: string): boolean {
  return args[key] !== undefined;
}

function openingHours(ctx: PreviewContext, value: unknown): string {
  if (!Array.isArray(value)) return '';
  const weekday = new Intl.DateTimeFormat(localeOf(ctx), { weekday: 'short', timeZone: 'UTC' });
  return clip(
    value
      .map((entry: unknown, index) => {
        const day = weekday.format(new Date(Date.UTC(2024, 0, 1 + index)));
        const hours = (entry ?? {}) as { closed?: unknown; open?: unknown; close?: unknown };
        return hours.closed === true ? `${day} ${UNCHECKED}` : `${day} ${text(hours.open)}-${text(hours.close)}`;
      })
      .join(', '),
  );
}

function coordinates(args: Args): string {
  const { lat, lng } = args;
  return typeof lat === 'number' && typeof lng === 'number' ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : '';
}

/** The fields a new place carries, shared by both ways of creating one. */
function newPlaceRows(ctx: PreviewContext, args: Args, rows: Rows, notesKey: string): void {
  rows
    .add('address', text(args.address))
    .add('coordinates', coordinates(args))
    .add('category', categoryName(ctx, id(args, 'category_id')))
    .add('description', text(args.description))
    .add('notes', text(args[notesKey]))
    .add('website', text(args.website))
    .add('phone', text(args.phone))
    .add('email', text(args.email))
    .add('openingHours', openingHours(ctx, args.opening_hours))
    .add('price', typeof args.price === 'number' ? money(ctx, args.price, text(args.currency) || null) : '')
    .add('stopType', text(args.stop_type));
}

/** The plain fields of a place: the tool's argument, the row's label and the field the card knows it by. */
const PLACE_TEXT_FIELDS: ReadonlyArray<[string, AssistantChangeLabelKey, keyof CardPlace]> = [
  ['name', 'name', 'name'],
  ['address', 'address', 'address'],
  ['description', 'description', 'description'],
  ['notes', 'notes', 'notes'],
  ['website', 'website', 'website'],
  ['phone', 'phone', 'phone'],
  ['email', 'email', 'email'],
  ['place_time', 'time', 'placeTime'],
  ['end_time', 'endTime', 'endTime'],
  ['stop_type', 'stopType', 'stopType'],
];

function updatePlaceRows(ctx: PreviewContext, args: Args, rows: Rows): void {
  const current = ctx.card.places.get(id(args, 'placeId') ?? 0);
  for (const [argKey, labelKey, field] of PLACE_TEXT_FIELDS) {
    if (has(args, argKey)) rows.change(labelKey, current ? text(current[field]) : null, text(args[argKey]));
  }
  if (has(args, 'lat') || has(args, 'lng')) {
    const before = current ? coordinates({ lat: current.lat, lng: current.lng }) : null;
    rows.change('coordinates', before, coordinates({ lat: args.lat ?? current?.lat, lng: args.lng ?? current?.lng }));
  }
  if (has(args, 'category_id')) {
    rows.change('category', categoryName(ctx, current?.categoryId ?? null), categoryName(ctx, id(args, 'category_id')));
  }
  if (has(args, 'price')) {
    const currency = text(args.currency) || current?.currency || null;
    const before = current?.price != null ? money(ctx, current.price, current.currency) : null;
    rows.change('price', before, typeof args.price === 'number' ? money(ctx, args.price, currency) : '');
  }
  if (has(args, 'opening_hours')) rows.change('openingHours', null, openingHours(ctx, args.opening_hours));
}

type Describer = (ctx: PreviewContext, args: Args) => Described;

/** Who shares an expense: the uneven split's members, else the equal one's. */
function splitOf(args: Args): unknown {
  return Array.isArray(args.members)
    ? args.members.map((member: unknown) => (member as { user_id?: unknown } | null)?.user_id)
    : args.member_ids;
}

const DESCRIBERS: Readonly<Record<string, Describer>> = {
  create_place: (ctx, args) => {
    const rows = new Rows();
    newPlaceRows(ctx, args, rows, 'notes');
    return { subject: text(args.name), rows, dayId: null, placeIds: [] };
  },
  create_and_assign_place: (ctx, args) => {
    const dayId = id(args, 'dayId');
    const rows = new Rows().add('day', dayLabel(ctx, dayId));
    newPlaceRows(ctx, args, rows, 'place_notes');
    return { subject: text(args.name), rows, dayId, placeIds: [] };
  },
  update_place: (ctx, args) => {
    const placeId = id(args, 'placeId');
    const rows = new Rows();
    updatePlaceRows(ctx, args, rows);
    return { subject: placeName(ctx, placeId), rows, dayId: null, placeIds: placeId ? [placeId] : [] };
  },
  assign_place_to_day: (ctx, args) => {
    const dayId = id(args, 'dayId');
    const placeId = id(args, 'placeId');
    const rows = new Rows().add('day', dayLabel(ctx, dayId)).add('notes', text(args.notes));
    return { subject: placeName(ctx, placeId), rows, dayId, placeIds: placeId ? [placeId] : [] };
  },
  move_assignment: (ctx, args) => {
    const assignment = ctx.card.assignments.get(id(args, 'assignmentId') ?? 0);
    const dayId = id(args, 'newDayId');
    const rows = new Rows().move('day', dayLabel(ctx, assignment?.dayId ?? null), dayLabel(ctx, dayId));
    const placeId = assignment?.placeId ?? null;
    return { subject: placeName(ctx, placeId), rows, dayId, placeIds: placeId ? [placeId] : [] };
  },
  unassign_place: (ctx, args) => {
    const assignment = ctx.card.assignments.get(id(args, 'assignmentId') ?? 0);
    const dayId = assignment?.dayId ?? id(args, 'dayId');
    const placeId = assignment?.placeId ?? null;
    const rows = new Rows().add('day', dayLabel(ctx, dayId));
    return { subject: placeName(ctx, placeId), rows, dayId, placeIds: placeId ? [placeId] : [] };
  },
  create_day_note: (ctx, args) => {
    const dayId = id(args, 'dayId');
    const rows = new Rows()
      .add('day', dayLabel(ctx, dayId))
      .add('time', text(args.time))
      .add('icon', text(args.icon))
      .add('color', text(args.color));
    return { subject: text(args.text), rows, dayId, placeIds: [] };
  },
  update_day_note: (ctx, args) => {
    const note = ctx.card.notes.get(id(args, 'noteId') ?? 0);
    const rows = new Rows();
    if (has(args, 'text')) rows.change('text', note?.text ?? null, text(args.text));
    if (has(args, 'time')) rows.change('time', note?.time ?? null, text(args.time));
    if (has(args, 'icon')) rows.change('icon', note?.icon ?? null, text(args.icon));
    if (has(args, 'color')) rows.change('color', note?.color ?? null, text(args.color));
    return { subject: note?.text ?? text(args.text), rows, dayId: id(args, 'dayId'), placeIds: [] };
  },
  create_packing_item: (_ctx, args) => {
    const rows = new Rows()
      .add('category', text(args.category))
      .add('quantity', text(args.quantity))
      .add('weight', typeof args.weight_grams === 'number' ? `${args.weight_grams} g` : '')
      .add('packed', args.checked === undefined ? '' : text(!!args.checked));
    return { subject: text(args.name), rows, dayId: null, placeIds: [] };
  },
  update_packing_item: (ctx, args) => {
    const item = ctx.card.packing.get(id(args, 'itemId') ?? 0);
    const rows = new Rows();
    if (has(args, 'name')) rows.change('name', item?.name ?? null, text(args.name));
    if (has(args, 'category')) rows.change('category', item?.category ?? null, text(args.category));
    if (has(args, 'quantity')) rows.change('quantity', text(item?.quantity), text(args.quantity));
    if (has(args, 'packed_quantity')) rows.change('packed', text(item?.packedQuantity), text(args.packed_quantity));
    if (has(args, 'weight_grams')) {
      const grams = (value: unknown) => (typeof value === 'number' ? `${value} g` : '');
      rows.change('weight', grams(item?.weight), grams(args.weight_grams));
    }
    return { subject: item?.name ?? text(args.name), rows, dayId: null, placeIds: [] };
  },
  create_todo: (ctx, args) => {
    const priority = typeof args.priority === 'number' && args.priority > 0 ? `P${args.priority}` : '';
    const rows = new Rows()
      .add('category', text(args.category))
      .add('dueDate', typeof args.due_date === 'string' ? formatDate(ctx, args.due_date) : '')
      .add('priority', priority)
      .add('assignee', memberNames(ctx, has(args, 'assigned_user_id') ? [args.assigned_user_id] : null))
      .add('description', text(args.description));
    return { subject: text(args.name), rows, dayId: null, placeIds: [] };
  },
  create_budget_item: (ctx, args) => {
    const placeId = id(args, 'place_id');
    const rows = new Rows()
      .add(
        'price',
        typeof args.total_price === 'number'
          ? money(ctx, args.total_price, text(args.currency) || ctx.card.currency)
          : '',
      )
      .add('category', text(args.category))
      .add('members', memberNames(ctx, splitOf(args)))
      .add('location', placeName(ctx, placeId))
      .add('notes', text(args.note));
    return { subject: text(args.name), rows, dayId: null, placeIds: placeId ? [placeId] : [] };
  },
  update_budget_item: (ctx, args) => {
    const price =
      typeof args.total_price === 'number'
        ? money(ctx, args.total_price, text(args.currency) || ctx.card.currency)
        : '';
    const rows = new Rows()
      .add('name', text(args.name))
      .add('price', price)
      .add('category', text(args.category))
      .add('members', memberNames(ctx, splitOf(args)))
      .add('notes', text(args.note));
    return { subject: text(args.name) || `#${id(args, 'itemId') ?? ''}`, rows, dayId: null, placeIds: [] };
  },
  [REMEMBER_TOOL]: (_ctx, args) => ({ subject: noteOf(args) ?? '', rows: new Rows(), dayId: null, placeIds: [] }),
};

/** A held write of the model's tools or of the server's own (a booking from a file). */
function writeTool(toolName: string) {
  return ASSISTANT_WRITE_TOOLS[toolName] ?? ASSISTANT_SERVER_WRITE_TOOLS[toolName];
}

function inRange(value: unknown, limit: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= limit;
}

/** A change to the day plan, with nothing of what the kind does not name. */
function effect(
  kind: AssistantChangeEffect['kind'],
  dayId: number | null,
  fields: Partial<Omit<AssistantChangeEffect, 'kind' | 'dayId'>>,
): AssistantChangeEffect | null {
  if (dayId === null) return null;
  return { kind, dayId, fromDayId: null, placeId: null, assignmentId: null, place: null, ...fields };
}

/**
 * What a change does to the day plan, for the map and the day's timeline: the
 * day a place lands on or leaves, and for a place that does not exist yet its
 * name and position. Changes that do not touch the plan have none.
 */
const EFFECTS: Readonly<Record<string, (ctx: PreviewContext, args: Args) => AssistantChangeEffect | null>> = {
  create_and_assign_place: (_ctx, args) => {
    const { lat, lng } = args;
    const name = text(args.name);
    if (!inRange(lat, 90) || !inRange(lng, 180) || name === '') return effect('add', id(args, 'dayId'), {});
    return effect('add', id(args, 'dayId'), { place: { name, lat, lng, categoryId: id(args, 'category_id') } });
  },
  assign_place_to_day: (_ctx, args) => effect('add', id(args, 'dayId'), { placeId: id(args, 'placeId') }),
  move_assignment: (ctx, args) => {
    const assignmentId = id(args, 'assignmentId');
    const assignment = ctx.card.assignments.get(assignmentId ?? 0);
    return effect('move', id(args, 'newDayId'), {
      fromDayId: assignment?.dayId ?? null,
      placeId: assignment?.placeId ?? null,
      assignmentId,
    });
  },
  unassign_place: (ctx, args) => {
    const assignmentId = id(args, 'assignmentId');
    const assignment = ctx.card.assignments.get(assignmentId ?? 0);
    return effect('remove', assignment?.dayId ?? id(args, 'dayId'), {
      placeId: assignment?.placeId ?? null,
      assignmentId,
    });
  },
};

// A tool's words and its effect come from the core or from its package, never from both.
refuseCoreOverlap('describe', Object.keys(DESCRIBERS));
refuseCoreOverlap('effect', Object.keys(EFFECTS));

/**
 * The change card for a held call of one of the writing tools, or of a
 * change the server proposed itself (a booking from a file, a found place).
 * `args` are the arguments as stored (the trip id is not among them). A found
 * place reads as the tool it runs through. `loaded` is what the tool's
 * package looked up for it (card-context.ts), null when it looked up nothing.
 */
export function describeToolCall(
  toolName: string,
  toolCallId: string,
  args: Args,
  ctx: PreviewContext,
  loaded: unknown = null,
): AssistantChangePreview {
  const runs = writeToolOf(toolName, args);
  const tool = writeTool(runs);
  const cards = TOOL_CARDS[runs];
  const describe: ((c: PreviewContext, a: Args) => Described | null) | undefined = cards?.describe
    ? (c, a) => describedOf(runs, c, a, loaded)
    : DESCRIBERS[runs];
  // The server's own steps all have a card; one without is a call that names no real tool.
  if (tool && !describe) throw new Error(`No change card for tool "${toolName}"`);
  const card = changeCardOf(runs, ctx, args, loaded);
  const drawn = card ? { card } : {};
  // A package describer that failed gives way to the card built from the arguments.
  const described = tool && describe ? describe(ctx, args) : null;
  if (!tool || !described) {
    return { ...describeGeneric(runs, toolCallId, args, ctx.card, ctx.hintOf?.(runs) ?? null), ...drawn };
  }
  const planned = cards?.effect ? cards.effect(ctx, args, loaded) : EFFECTS[runs]?.(ctx, args);
  return {
    toolCallId,
    verbKey: described.verbKey ?? tool.verbKey,
    subject: clip(described.subject),
    rows: described.rows.rows.slice(0, MAX_ROWS),
    dayId: described.dayId,
    placeIds: described.placeIds,
    undoable: runs in ASSISTANT_UNDO_MAP && described.undoable !== false,
    effect: planned ?? null,
    ...(described.tool ? { tool: described.tool } : {}),
    ...(described.domain ? { domain: described.domain } : {}),
    ...drawn,
  };
}

/** Where a tool's answer names what it created or changed, and the argument that names it otherwise. */
const RESULT_KEYS = ['place', 'assignment', 'note', 'item', 'reservation'] as const;
const ARG_KEYS = ['placeId', 'assignmentId', 'noteId', 'itemId'] as const;

/**
 * The tours an answer names: a tour created or changed (`tour`), or those a
 * file brought in (`tours`). A tour's id is its place's.
 */
function tourIds(result: Args): number[] {
  const tours = Array.isArray(result.tours) ? result.tours : [result.tour];
  return tours.flatMap((tour: unknown) => {
    const placeId = tour && typeof tour === 'object' ? id(tour as Args, 'place_id') : null;
    return placeId === null ? [] : [placeId];
  });
}

function createdIds(result: unknown): number[] {
  if (!result || typeof result !== 'object') return [];
  const tours = tourIds(result as Args);
  if (tours.length > 0) return tours;
  for (const key of RESULT_KEYS) {
    const created = (result as Args)[key];
    const value = created && typeof created === 'object' ? id(created as Args, 'id') : null;
    if (value !== null) return [value];
  }
  return [];
}

/** The day a created booking landed on, when its answer names one. */
function bookedDay(result: unknown): number | null {
  const reservation = result && typeof result === 'object' ? (result as Args).reservation : null;
  return reservation && typeof reservation === 'object' ? id(reservation as Args, 'day_id') : null;
}

/** Where a change came from when its caller does not say: no held card, no trip. */
const NOT_FROM: AppliedFrom = { preview: null, tripId: null };

/**
 * The receipt of an applied change: what it touched (the created row from its
 * answer, the changed one from its arguments), the day "Show on map" goes to
 * (the card's, else the one a created booking landed on), and until when it
 * can be undone. A package that names the ids itself reads `from` too: the
 * stored preview, and the trip the conversation is on.
 */
export function appliedChange(
  toolName: string,
  toolCallId: string,
  args: Args,
  result: unknown,
  dayId: number | null,
  undoUntil: string | null,
  from: AppliedFrom = NOT_FROM,
): AssistantApplied | null {
  // A tool without a card of its own touched something the client has no view for.
  const runs = writeToolOf(toolName, args);
  const tool = writeTool(runs) ?? { entity: 'other' as const };
  const own = TOOL_CARDS[runs]?.appliedIds?.(args, result, from) ?? [];
  const created = own.length > 0 ? own : createdIds(result);
  const named = ARG_KEYS.map((key) => id(args, key)).filter((value): value is number => value !== null);
  return {
    toolCallId,
    entity: tool.entity,
    ids: created.length > 0 ? created : named.slice(0, 1),
    dayId: dayId ?? bookedDay(result),
    undoUntil,
  };
}
