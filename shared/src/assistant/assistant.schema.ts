import { bookElementIdSchema, bookSpreadIdSchema } from '../book/book-ops.schema';
import { idParamSchema, idSchema } from '../common/primitives.schema';
import { assistantPageRenderSchema, assistantPageViewSchema } from './assistant-vision.schema';
import {
  assistantCardSchema,
  assistantCardWriteSchema,
  ATLAS_APPLIED_ENTITIES,
  ATLAS_VERB_KEYS,
  BOOK_APPLIED_ENTITIES,
  BOOK_DESIGN_VERB_KEYS,
  BOOK_VERB_KEYS,
  BOOKING_APPLIED_ENTITIES,
  BOOKING_VERB_KEYS,
  BUDGET_APPLIED_ENTITIES,
  BUDGET_VERB_KEYS,
  COLLAB_APPLIED_ENTITIES,
  COLLAB_VERB_KEYS,
  COLLECTION_APPLIED_ENTITIES,
  COLLECTION_VERB_KEYS,
  JOURNEY_APPLIED_ENTITIES,
  JOURNEY_VERB_KEYS,
  PACKING_APPLIED_ENTITIES,
  PACKING_VERB_KEYS,
  ROADTRIP_APPLIED_ENTITIES,
  ROADTRIP_VERB_KEYS,
  storedTrekCardSchema,
  TOUR_APPLIED_ENTITIES,
  TOUR_VERB_KEYS,
  trekCardSchema,
  VACAY_APPLIED_ENTITIES,
  VACAY_VERB_KEYS,
  type AssistantCard,
} from './cards';

import { z } from 'zod';

/**
 * Trip assistant contract for /api/trips/:tripId/assistant.
 *
 * The assistant works the trip through the same MCP tools any client uses.
 * Reading tools run at once; every writing call is held as a change preview
 * the user applies or discards, and only then runs, with the arguments the
 * server stored, never ones the client sends back. A file attached in the
 * chat (`attachments`) is read by the server itself: the step is the call
 * `read_booking_file`, and each booking it finds is held as an
 * `import_booking` change like any other. Neither is a tool the model knows.
 *
 * `chat`, `attachments` and `threads/:threadId/decisions` answer with a stream of UI message
 * chunks (`uiStreamChunkSchema`, a subset of the UI Message Stream v1 plus the
 * `data-trek-*` parts), one `data: <json>` event each, closed by
 * `data: [DONE]`. `__fixtures__/ui-stream.v1.txt` is one such stream; the
 * server's writer and the client's parser are both tested against it.
 */

/** Why a turn could not run or stopped, as the `error` chunk and the JSON errors name it. */
export const ASSISTANT_ERROR_CODES = [
  'not_connected',
  'busy',
  'daily_limit',
  'rate_limited',
  'needs_reauth',
  'usage_limit',
  'not_eligible',
  'invalid_key',
  'provider_unavailable',
  'max_steps',
  // The model answered with nothing, not even after it was asked to go on.
  'empty_answer',
  'offline',
  'no_bookings_found',
  'import_unavailable',
  // A found place was suggested while the thread still holds changes nobody decided on.
  'decide_first',
  // TREK's own per-user limit on turns and changes, apart from the provider's `rate_limited`.
  'too_many_requests',
  'generic',
] as const;
export const assistantErrorCodeSchema = z.enum(ASSISTANT_ERROR_CODES);
export type AssistantErrorCode = z.infer<typeof assistantErrorCodeSchema>;

/**
 * What a change does, one per writing tool. The client labels the card with
 * `assistant.change.verb.<key>`. These are the core verbs; each part of TREK
 * adds its own in its cards contract (`cards/<pkg>.contract.ts`).
 */
export const CORE_VERB_KEYS = [
  'addPlace',
  'addPlaceToDay',
  'updatePlace',
  'assignPlace',
  'moveAssignment',
  'removeFromDay',
  'addDayNote',
  'updateDayNote',
  'addPackingItem',
  'updatePackingItem',
  'addTodo',
  'addBudgetItem',
  'updateBudgetItem',
  'addReservation',
  'importBooking',
  'rememberNote',
  // A tour: a hike or a city walk created, a hike changed, tours taken in from a GPX file.
  'addTour',
  'updateTour',
  'importTour',
  // Any other tool: by what its annotations say it does.
  'genericCreate',
  'genericUpdate',
  'genericRemove',
] as const;
export const ASSISTANT_CHANGE_VERB_KEYS = [
  ...CORE_VERB_KEYS,
  ...TOUR_VERB_KEYS,
  ...ROADTRIP_VERB_KEYS,
  ...BUDGET_VERB_KEYS,
  ...BOOKING_VERB_KEYS,
  ...COLLAB_VERB_KEYS,
  ...COLLECTION_VERB_KEYS,
  ...ATLAS_VERB_KEYS,
  ...VACAY_VERB_KEYS,
  ...JOURNEY_VERB_KEYS,
  ...PACKING_VERB_KEYS,
  ...BOOK_VERB_KEYS,
  ...BOOK_DESIGN_VERB_KEYS,
] as const;
export const assistantChangeVerbKeySchema = z.enum(ASSISTANT_CHANGE_VERB_KEYS);
export type AssistantChangeVerbKey = z.infer<typeof assistantChangeVerbKeySchema>;

/** The field a change row shows, labelled `assistant.change.label.<key>`. */
export const ASSISTANT_CHANGE_LABEL_KEYS = [
  'name',
  'description',
  'address',
  'coordinates',
  'category',
  'day',
  'time',
  'endTime',
  'notes',
  'website',
  'phone',
  'email',
  'openingHours',
  'price',
  'currency',
  'stopType',
  'text',
  'icon',
  'color',
  'position',
  'quantity',
  'weight',
  'bag',
  'packed',
  'dueDate',
  'priority',
  'assignee',
  'type',
  'location',
  'link',
  'confirmation',
  'checkIn',
  'checkOut',
  'stay',
  'members',
  'route',
  // The hardest SAC grade a hike's way may take, T1 to T6.
  'difficulty',
  // A new order of a day's places or of the days, as the names in that order.
  'order',
  // An argument of a tool without a card of its own; the row names it in `field`.
  'field',
] as const;
export const assistantChangeLabelKeySchema = z.enum(ASSISTANT_CHANGE_LABEL_KEYS);
export type AssistantChangeLabelKey = z.infer<typeof assistantChangeLabelKeySchema>;

const latSchema = z.number().min(-90).max(90);
const lngSchema = z.number().min(-180).max(180);

// ── Requests ────────────────────────────────────────────────────────────────

/**
 * A day, place or booking the user named with `@` in the message. The server
 * checks each against the trip and takes the label from its own data, never
 * from the request; one that is not in the trip is dropped without a word.
 */
export const ASSISTANT_MENTION_KINDS = ['day', 'place', 'reservation'] as const;
export const assistantMentionSchema = z
  .object({
    kind: z.enum(ASSISTANT_MENTION_KINDS),
    id: idSchema,
  })
  .strict();
export type AssistantMention = z.infer<typeof assistantMentionSchema>;

/** The part of the map the planner shows, so "here" and "nearby" mean what is on screen. */
export const assistantMapViewSchema = z
  .object({ south: latSchema, west: lngSchema, north: latSchema, east: lngSchema })
  .strict();
export type AssistantMapView = z.infer<typeof assistantMapViewSchema>;

/**
 * What the user is looking at when they ask: the selected day, or the places
 * they asked about, and the part of the map on screen.
 */
export const assistantFocusSchema = z
  .object({
    dayId: idSchema.optional(),
    placeIds: z.array(idSchema).max(20).optional(),
    view: assistantMapViewSchema.optional(),
    /** In the Studio: the page (spread) on screen, and the elements selected on it. */
    spreadId: bookSpreadIdSchema.optional(),
    elementIds: z.array(bookElementIdSchema).max(30).optional(),
  })
  .strict();
export type AssistantFocus = z.infer<typeof assistantFocusSchema>;

/** The language to answer in and the zone "today" is read in, sent with every turn. */
export const assistantClientCtxSchema = z.object({
  locale: z.string().min(2).max(10),
  timeZone: z.string().min(1).max(64),
});
export type AssistantClientCtx = z.infer<typeof assistantClientCtxSchema>;

/** POST /chat: a new message, in an existing thread or (threadId null) a new one. */
export const assistantChatRequestSchema = assistantClientCtxSchema
  .extend({
    threadId: idSchema.nullable(),
    text: z.string().trim().min(1).max(32_000),
    focus: assistantFocusSchema.optional(),
    mentions: z.array(assistantMentionSchema).max(50).optional(),
    /** The client draws a Studio page when the turn asks for one (the Studio's chat, assistant-vision.schema.ts). */
    renders: z.boolean().optional(),
  })
  .strict();
export type AssistantChatRequest = z.infer<typeof assistantChatRequestSchema>;

/**
 * POST /attachments, multipart: the file in the field `file`, these as text
 * fields beside it. A new thread when threadId is left out. Multipart sends
 * every field as a string, so the id is read from its text.
 */
export const assistantAttachmentRequestSchema = assistantClientCtxSchema
  .extend({
    threadId: idParamSchema.optional(),
  })
  .strict();
export type AssistantAttachmentRequest = z.infer<typeof assistantAttachmentRequestSchema>;

/** One decision on a held change. */
export const assistantDecisionSchema = z
  .object({
    toolCallId: z.string().min(1).max(64),
    approved: z.boolean(),
  })
  .strict();
export type AssistantDecision = z.infer<typeof assistantDecisionSchema>;

/** POST /threads/:threadId/decisions: every change the step holds, applied or discarded. */
export const assistantDecisionsRequestSchema = assistantClientCtxSchema
  .extend({
    decisions: z.array(assistantDecisionSchema).min(1).max(50),
    /** As on a chat turn: the client draws a Studio page when the turn asks for one. */
    renders: z.boolean().optional(),
  })
  .strict();
export type AssistantDecisionsRequest = z.infer<typeof assistantDecisionsRequestSchema>;

/** POST /stop. No fields: the body is JSON only so the request cannot be sent cross-site as a form. */
export const assistantStopRequestSchema = z.object({}).strict();
export type AssistantStopRequest = z.infer<typeof assistantStopRequestSchema>;

/** POST /tool-calls/:toolCallId/undo. No fields, for the same reason as stop. */
export const assistantUndoRequestSchema = z.object({}).strict();
export type AssistantUndoRequest = z.infer<typeof assistantUndoRequestSchema>;

/**
 * POST /threads/:threadId/found-places: suggest a place from a search result
 * for a day. `ref` names the place in the thread's stored places part; the
 * server holds the change like any other and runs no model turn for it.
 */
export const assistantAddFoundPlaceRequestSchema = assistantClientCtxSchema
  .extend({
    ref: z.string().min(1).max(80),
    dayId: idSchema,
  })
  .strict();
export type AssistantAddFoundPlaceRequest = z.infer<typeof assistantAddFoundPlaceRequestSchema>;

/**
 * POST /threads/:threadId/proposals: take a proposal an answer showed as a
 * card ("Plan this"). `toolCallId` names the read whose card it was; the
 * server holds the matching change like a found place, from what it stored,
 * and answers like the found places route.
 */
export const assistantTakeProposalRequestSchema = assistantClientCtxSchema
  .extend({
    toolCallId: z.string().min(1).max(64),
  })
  .strict();
export type AssistantTakeProposalRequest = z.infer<typeof assistantTakeProposalRequestSchema>;

// ── Change previews ─────────────────────────────────────────────────────────

/**
 * What a change does to the day plan, so the map can show it before it is
 * applied: the day it lands on (for a removal, the day it leaves), the day a
 * move comes from, and for a place that does not exist yet its name and
 * position. Null for a change that does not touch the plan.
 */
export const assistantChangeEffectSchema = z.object({
  kind: z.enum(['add', 'remove', 'move']),
  dayId: idSchema,
  fromDayId: idSchema.nullable(),
  placeId: idSchema.nullable(),
  assignmentId: idSchema.nullable(),
  place: z
    .object({
      name: z.string().max(200),
      lat: latSchema,
      lng: lngSchema,
      categoryId: idSchema.nullable(),
    })
    .nullable(),
});
export type AssistantChangeEffect = z.infer<typeof assistantChangeEffectSchema>;

/** One line of a change card, in plain words: names, dates and times, never ids. */
export const assistantChangeRowSchema = z.object({
  op: z.enum(['add', 'change', 'move']),
  labelKey: assistantChangeLabelKeySchema,
  before: z.string().nullable(),
  after: z.string(),
  // The argument a `field` row shows, as the tool names it.
  field: z.string().max(60).optional(),
});
export type AssistantChangeRow = z.infer<typeof assistantChangeRowSchema>;

/** A held writing call as the server writes it: every verb and card one this build knows. */
export const assistantChangePreviewWriteSchema = z.object({
  toolCallId: z.string(),
  verbKey: assistantChangeVerbKeySchema,
  // What the change is about: the place, note or item name.
  subject: z.string(),
  rows: z.array(assistantChangeRowSchema).max(12),
  // Where "Show on map" goes after the change was applied.
  dayId: idSchema.nullable(),
  placeIds: z.array(idSchema),
  // Whether applying it can be undone for a while (a create with a matching delete).
  undoable: z.boolean(),
  // Left out by servers and stored previews from before the map showed changes.
  effect: assistantChangeEffectSchema.nullable().optional(),
  // The tool behind a card without one of its own, and the part of TREK it works in.
  tool: z.string().max(80).optional(),
  domain: z.string().max(40).optional(),
  // What the change will do, drawn as a card; absent on older rows and on cards without one.
  card: trekCardSchema.nullable().optional(),
  // The proposal a change held by "Plan this" was taken from (its call id); absent on every other change.
  takenFrom: assistantTakeProposalRequestSchema.shape.toolCallId.optional(),
});

/**
 * A held writing call as the user sees it before deciding, and as it is read
 * back: a verb a later build added reads as a plain update and a card this
 * build cannot draw as none, so an older client or a rolled back server still
 * shows the change instead of dropping it.
 */
export const assistantChangePreviewSchema = assistantChangePreviewWriteSchema.extend({
  verbKey: assistantChangeVerbKeySchema.catch('genericUpdate'),
  card: storedTrekCardSchema.optional(),
});
export type AssistantChangePreview = z.infer<typeof assistantChangePreviewSchema>;

/** What an applied change can touch in the core; each part of TREK adds its own in its cards contract. */
export const CORE_APPLIED_ENTITIES = [
  'place',
  'assignment',
  'day_note',
  'packing',
  'todo',
  'budget',
  'reservation',
  'memory',
  'tour',
  'other',
] as const;

const assistantAppliedEntitySchema = z.enum([
  ...CORE_APPLIED_ENTITIES,
  ...TOUR_APPLIED_ENTITIES,
  ...ROADTRIP_APPLIED_ENTITIES,
  ...BUDGET_APPLIED_ENTITIES,
  ...BOOKING_APPLIED_ENTITIES,
  ...COLLAB_APPLIED_ENTITIES,
  ...COLLECTION_APPLIED_ENTITIES,
  ...ATLAS_APPLIED_ENTITIES,
  ...VACAY_APPLIED_ENTITIES,
  ...JOURNEY_APPLIED_ENTITIES,
  ...PACKING_APPLIED_ENTITIES,
  ...BOOK_APPLIED_ENTITIES,
]);

/** An applied change as the server writes it: what it touched, and until when it can be undone. */
const assistantAppliedWriteSchema = z.object({
  toolCallId: z.string(),
  entity: assistantAppliedEntitySchema,
  ids: z.array(idSchema),
  dayId: idSchema.nullable(),
  undoUntil: z.string().nullable(),
});

/** An applied change as it is read back: an entity a later build added reads as `other`, with nothing to open. */
export const assistantAppliedSchema = assistantAppliedWriteSchema.extend({
  entity: assistantAppliedEntitySchema.catch('other'),
});
export type AssistantApplied = z.infer<typeof assistantAppliedSchema>;

// ── Cards in an answer ──────────────────────────────────────────────────────

/** The kind a found place is drawn as, read from whatever its source calls it. */
export const ASSISTANT_FOUND_PLACE_KINDS = [
  'lodging',
  'food',
  'drinks',
  'sight',
  'shopping',
  'transport',
  'beach',
  'nature',
  'activity',
] as const;

/**
 * One place a search step found, normalized by the server from the tool's
 * result. It never carries a URL: the client asks TREK's photo proxy with
 * `photoKey` (a source id or `coords:lat,lng`) and shows only a same-origin
 * answer. `openNow` is set only from the source's own flag and only while
 * the trip is running; `inTripPlaceId` names the trip's place when it is the
 * same one.
 */
export const assistantFoundPlaceSchema = z.object({
  // `${toolCallId}:${index}`, the handle a suggestion for a day names it by.
  ref: z.string().max(80),
  name: z.string().max(120),
  address: z.string().max(200).nullable(),
  lat: latSchema,
  lng: lngSchema,
  kind: z.enum(ASSISTANT_FOUND_PLACE_KINDS).nullable(),
  rating: z.number().min(0).max(5).nullable(),
  openNow: z.boolean().nullable(),
  googlePlaceId: z
    .string()
    .regex(/^[\w-]{1,200}$/)
    .nullable(),
  osmId: z.string().max(40).nullable(),
  photoKey: z
    .string()
    .regex(/^([\w-]{1,200}|coords:-?\d{1,3}(\.\d{1,12})?,-?\d{1,3}(\.\d{1,12})?)$/)
    .nullable(),
  inTripPlaceId: idSchema.nullable(),
});
export type AssistantFoundPlace = z.infer<typeof assistantFoundPlaceSchema>;

/** The places one search step found: at most eight, `more` counts the rest. */
export const assistantPlacesSchema = z.object({
  toolCallId: z.string().max(64),
  places: z.array(assistantFoundPlaceSchema).max(20),
  more: z.number().int().nonnegative(),
});
export type AssistantPlaces = z.infer<typeof assistantPlacesSchema>;

/**
 * The weather the steps of an answer looked up, one entry per date.
 * Temperatures are °C; the client converts them to the user's unit. `main`
 * is the condition the weather icon is chosen by.
 */
export const assistantWeatherDaySchema = z.object({
  dayId: idSchema.nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  main: z.string().max(20),
  tempMax: z.number(),
  tempMin: z.number().nullable(),
  rainPct: z.number().int().min(0).max(100).nullable(),
  kind: z.enum(['forecast', 'climate', 'current']),
});
export type AssistantWeatherDay = z.infer<typeof assistantWeatherDaySchema>;

export const assistantWeatherSchema = z.object({
  days: z.array(assistantWeatherDaySchema).min(1).max(16),
});
export type AssistantWeather = z.infer<typeof assistantWeatherSchema>;

/**
 * The tool the model ends an answer with to offer what the user may ask
 * next. The server answers it itself and never shows it as a step.
 */
export const ASSISTANT_FOLLOW_UPS_TOOL = 'suggest_follow_ups';
/** The longest follow-up question the chat shows on one chip. */
export const MAX_FOLLOW_UP_CHARS = 80;
/** How many follow-up questions an answer offers at most. */
export const MAX_FOLLOW_UPS = 3;

/** The questions the model offers to ask next, fitting the conversation, in the user's language. */
export const assistantFollowUpsSchema = z.object({
  questions: z.array(z.string().min(1).max(MAX_FOLLOW_UP_CHARS)).min(1).max(MAX_FOLLOW_UPS),
});
export type AssistantFollowUps = z.infer<typeof assistantFollowUpsSchema>;

/** Where a running step looks: a point with a radius, or a box. */
export const assistantActivityAreaSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('point'),
    lat: latSchema,
    lng: lngSchema,
    radiusM: z.number().int().min(50).max(50_000),
  }),
  z.object({
    type: z.literal('bbox'),
    south: latSchema,
    west: lngSchema,
    north: latSchema,
    east: lngSchema,
  }),
]);
export type AssistantActivityArea = z.infer<typeof assistantActivityAreaSchema>;

/**
 * What a running step is doing, for the live line and the map: the place or
 * query it names (shortened), and the area it searches when that is small
 * enough to show. Only streamed, never stored.
 */
export const assistantActivitySchema = z.object({
  toolCallId: z.string().max(64),
  label: z.string().max(80).nullable(),
  area: assistantActivityAreaSchema.nullable(),
});
export type AssistantActivity = z.infer<typeof assistantActivitySchema>;

/** The mentions of a user message as the server checked them, with the labels it took from the trip. */
export const assistantMentionsSchema = z.object({
  items: z
    .array(
      z.object({
        kind: z.enum(ASSISTANT_MENTION_KINDS),
        id: idSchema,
        label: z.string().max(120),
      }),
    )
    .max(50),
});
export type AssistantMentions = z.infer<typeof assistantMentionsSchema>;

// ── Threads and messages ────────────────────────────────────────────────────

export const assistantThreadSummarySchema = z.object({
  id: idSchema,
  title: z.string(),
  lastMessageAt: z.string(),
});
export type AssistantThreadSummary = z.infer<typeof assistantThreadSummarySchema>;

/** GET /threads: the user's latest threads in this trip. */
export const assistantThreadListResponseSchema = z.object({ threads: z.array(assistantThreadSummarySchema) });
export type AssistantThreadListResponse = z.infer<typeof assistantThreadListResponseSchema>;

/**
 * A server-side approval gate on a tool call. `resolution` closes a request
 * nobody decided: it expired after 24 hours, or the turn was cancelled.
 */
export const assistantToolApprovalSchema = z.object({
  id: z.string(),
  approved: z.boolean().optional(),
  resolution: z.enum(['cancelled', 'expired']).optional(),
});
export type AssistantToolApproval = z.infer<typeof assistantToolApprovalSchema>;

/**
 * The parts of a message, with the change, receipt and card parts read or
 * written as given. Generic over the three schemas so the emitted declaration
 * keeps each one's own Zod type instead of a precomputed object type, which a
 * consumer without strictNullChecks would read differently from its own infer.
 */
function messagePartSchema<
  Change extends z.ZodType<AssistantChangePreview>,
  Applied extends z.ZodType<AssistantApplied>,
  Card extends z.ZodType<AssistantCard>,
>(change: Change, applied: Applied, card: Card) {
  return z.discriminatedUnion('type', [
    z.object({ type: z.literal('text'), text: z.string() }),
    // A file the user handed the assistant. Only its description is kept, never its content.
    z.object({
      type: z.literal('attachment'),
      name: z.string(),
      mime: z.string(),
      size: z.number().int().nonnegative(),
    }),
    z.object({
      type: z.literal('tool-call'),
      toolCallId: z.string(),
      toolName: z.string(),
      args: z.record(z.string(), z.unknown()),
      result: z.unknown().optional(),
      isError: z.boolean().optional(),
      approval: assistantToolApprovalSchema.optional(),
    }),
    z.object({ type: z.literal('data-trek-change'), data: change }),
    z.object({ type: z.literal('data-trek-applied'), data: applied }),
    z.object({ type: z.literal('data-trek-places'), data: assistantPlacesSchema }),
    z.object({ type: z.literal('data-trek-weather'), data: assistantWeatherSchema }),
    // What the model offers to ask next, at the end of an answer.
    z.object({ type: z.literal('data-trek-follow-ups'), data: assistantFollowUpsSchema }),
    // The card of one tool call: a read's beside the answer, an applied write's on the message that proposed it.
    z.object({ type: z.literal('data-trek-card'), data: card }),
    // Only on a user message.
    z.object({ type: z.literal('data-trek-mentions'), data: assistantMentionsSchema }),
    // A Studio page the turn looked at: what it was and its description, never the image.
    z.object({ type: z.literal('data-trek-page-view'), data: assistantPageViewSchema }),
  ]);
}

/** One stored part of a message, in the order the model produced it, as a reader takes it. */
export const assistantMessagePartSchema = messagePartSchema(
  assistantChangePreviewSchema,
  assistantAppliedSchema,
  assistantCardSchema,
);
export type AssistantMessagePart = z.infer<typeof assistantMessagePartSchema>;

/** The parts as the server writes them: a verb, entity or card this build cannot name is a bug in the writer. */
export const assistantMessagePartWriteSchema = messagePartSchema(
  assistantChangePreviewWriteSchema,
  assistantAppliedWriteSchema,
  assistantCardWriteSchema,
);

/**
 * A message's parts as they are read back: a `data-trek-*` part this build
 * does not know, or one that no longer reads, is dropped, so a part a later
 * build added never blanks the message around it. Any other broken part
 * still fails the whole list. A known part reads through its tolerant fields
 * (a later verb, entity or card kind); parts are written strictly, with
 * `assistantMessagePartWriteSchema`.
 */
export const assistantStoredPartsSchema = z
  .array(
    z.union([
      assistantMessagePartSchema,
      z.object({ type: z.string().startsWith('data-trek-') }).transform(() => null),
    ]),
  )
  .transform((parts) => parts.filter((part): part is AssistantMessagePart => part !== null));

export const assistantMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  parts: z.array(assistantMessagePartSchema),
  status: z.enum(['complete', 'awaiting_approval', 'aborted', 'error']),
  createdAt: z.string(),
});
export type AssistantMessage = z.infer<typeof assistantMessageSchema>;

/** GET /threads/:threadId: the thread with its latest 50 messages, oldest first. */
export const assistantThreadResponseSchema = z.object({
  thread: assistantThreadSummarySchema,
  messages: z.array(assistantMessageSchema),
});
export type AssistantThreadResponse = z.infer<typeof assistantThreadResponseSchema>;

/** POST /threads/:threadId/found-places: the new assistant message holding the suggested change. */
export const assistantAddFoundPlaceResponseSchema = z.object({ message: assistantMessageSchema });
export type AssistantAddFoundPlaceResponse = z.infer<typeof assistantAddFoundPlaceResponseSchema>;

/** POST /tool-calls/:toolCallId/undo */
export const assistantUndoResponseSchema = z.object({ undone: z.literal(true) });
export type AssistantUndoResponse = z.infer<typeof assistantUndoResponseSchema>;

// ── Stream ──────────────────────────────────────────────────────────────────

/** The marker the last `data:` event of a stream carries instead of a chunk. */
export const UI_STREAM_DONE = '[DONE]';

/**
 * The chunks of an assistant stream. A client ignores a chunk whose type it
 * does not know, so new types can be added without breaking older clients.
 * An error names an `AssistantErrorCode`; one this client does not know reads
 * as `generic`.
 */
export const uiStreamChunkSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('start'), messageId: z.string() }),
  z.object({ type: z.literal('start-step') }),
  z.object({ type: z.literal('text-start'), id: z.string() }),
  z.object({ type: z.literal('text-delta'), id: z.string(), delta: z.string() }),
  z.object({ type: z.literal('text-end'), id: z.string() }),
  z.object({ type: z.literal('tool-input-start'), toolCallId: z.string(), toolName: z.string() }),
  z.object({
    type: z.literal('tool-input-available'),
    toolCallId: z.string(),
    toolName: z.string(),
    input: z.record(z.string(), z.unknown()),
  }),
  // approvalId is the toolCallId: one id addresses the call and its decision.
  z.object({ type: z.literal('tool-approval-request'), approvalId: z.string(), toolCallId: z.string() }),
  z.object({ type: z.literal('tool-output-available'), toolCallId: z.string(), output: z.unknown() }),
  z.object({ type: z.literal('tool-output-error'), toolCallId: z.string(), errorText: z.string() }),
  z.object({ type: z.literal('tool-output-denied'), toolCallId: z.string() }),
  z.object({ type: z.literal('data-trek-thread'), data: z.object({ threadId: idSchema, title: z.string() }) }),
  z.object({ type: z.literal('data-trek-change'), data: assistantChangePreviewSchema }),
  z.object({ type: z.literal('data-trek-applied'), data: assistantAppliedSchema }),
  z.object({ type: z.literal('data-trek-places'), data: assistantPlacesSchema }),
  z.object({ type: z.literal('data-trek-weather'), data: assistantWeatherSchema }),
  z.object({ type: z.literal('data-trek-follow-ups'), data: assistantFollowUpsSchema }),
  z.object({ type: z.literal('data-trek-card'), data: assistantCardSchema }),
  // Live progress of a running step; the message never keeps it.
  z.object({
    type: z.literal('data-trek-activity'),
    data: assistantActivitySchema,
    transient: z.literal(true).optional(),
  }),
  // A Studio page the turn asks the Studio tab to draw and upload; the message never keeps it.
  z.object({
    type: z.literal('data-trek-render-request'),
    data: assistantPageRenderSchema,
    transient: z.literal(true).optional(),
  }),
  z.object({ type: z.literal('data-trek-page-view'), data: assistantPageViewSchema }),
  z.object({
    type: z.literal('data-trek-quota'),
    data: z.object({ used: z.number().int().nonnegative(), limit: z.number().int().nonnegative() }),
  }),
  z.object({ type: z.literal('finish-step') }),
  z.object({ type: z.literal('finish'), finishReason: z.enum(['stop', 'tool-calls', 'error']).optional() }),
  z.object({ type: z.literal('error'), errorText: assistantErrorCodeSchema.catch('generic') }),
  z.object({ type: z.literal('abort') }),
]);
export type UiStreamChunk = z.infer<typeof uiStreamChunkSchema>;
