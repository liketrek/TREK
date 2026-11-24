import type { APIRequestContext, Page, Route } from '@playwright/test';
import { toggleAddon } from './external';
import { seededTrip } from './fixtures';
import { PICTURE_DAY } from './guide';

/**
 * What the AI guides need: an AI provider that answers. The run has none and
 * must not depend on one, so the browser's side of the conversation is
 * answered here instead, with `page.context().route` (a route on the page
 * alone misses what the PWA's service worker fetches, see the Immich mock in
 * `journey.guide.ts`):
 *
 *   - `/api/ai/status`: whether the assistant runs and on whose connection,
 *   - `/api/ai/connection` and `/api/ai/models`: a person's own key, taken as good,
 *   - `/api/admin/ai/connection` and `/api/admin/ai/models`: the admin's,
 *   - `/api/trips/:id/assistant/...`: the chat, its decisions and sharing.
 *
 * What the provider would write is fixed below, short and in the shape the
 * server streams it (`uiStreamChunkSchema`). What a decision changes in the
 * trip is done for real through the REST API, so the plan behind the window
 * shows the new place the way it would after a real Apply, and the answer
 * shared to the trip chat is a real chat message. Cleanup takes both away.
 *
 * Only the addons are switched for real (the AI tile and the Integrations card
 * show by them); the admin's AI settings are the server's own.
 */

const PROVIDER = { kind: 'anthropic', host: 'api.anthropic.com' } as const;
const MODEL = 'claude-sonnet-4-5';
export const AI_KEY = 'sk-ant-api03-hm7Rk2vLq9Tz4Wc8Yp1Nd6Fs3Bx5Gj0Ue-x7Qa';
const HINT = '…x7Qa';

const MODELS = {
  models: [
    { id: MODEL, label: 'Claude Sonnet 4.5', supportsTools: true, recommended: true },
    { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', supportsTools: true },
    { id: 'claude-opus-4-1', label: 'Claude Opus 4.1', supportsTools: true },
  ],
};

const RETENTION = { mode: 'days', days: 90 } as const;

/** The assistant on the admin's connection, as everyone on the instance sees it. */
function instanceStatus() {
  return {
    available: true,
    policy: 'instance_or_user',
    canConnectOwn: true,
    effective: { source: 'instance', kind: PROVIDER.kind, model: MODEL, host: PROVIDER.host, paidBy: 'instance' },
    own: null,
    instance: { kind: PROVIDER.kind, model: MODEL, host: PROVIDER.host },
    quota: { used: 3, limit: 50 },
    privacyAcked: true,
    retention: RETENTION,
    openrouterOAuth: false,
  };
}

/** Everyone brings their own: nothing yet, or the key the guide connected. */
function ownStatus(connected: boolean) {
  const own = { scope: 'user', kind: PROVIDER.kind, model: MODEL, hint: HINT, status: 'ok', host: PROVIDER.host };
  return {
    available: connected,
    policy: 'user',
    canConnectOwn: true,
    effective: connected
      ? { source: 'user', kind: PROVIDER.kind, model: MODEL, host: PROVIDER.host, paidBy: 'user' }
      : null,
    own: connected ? own : null,
    instance: null,
    quota: null,
    privacyAcked: connected,
    retention: RETENTION,
    openrouterOAuth: false,
  };
}

/** A server-sent event stream as the server writes it: one `data:` per chunk, closed by [DONE]. */
function sse(chunks: unknown[]): string {
  return [...chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`), 'data: [DONE]\n\n'].join('');
}

const fulfillStream = (route: Route, chunks: unknown[]) =>
  route.fulfill({
    status: 200,
    contentType: 'text/event-stream',
    headers: { 'cache-control': 'no-cache' },
    body: sse(chunks),
  });

const pathOf = (route: Route) => new URL(route.request().url()).pathname;

// ── Settings: a person's own key ─────────────────────────────────────────────

/** Settings, Integrations: the AI card with nothing connected, and a key that connects. */
export async function mockOwnConnection(page: Page): Promise<void> {
  await toggleAddon(page.request, 'ai_assistant', true);
  let connected = false;
  await page.context().route(/\/api\/ai\/(status|connection|models|privacy-ack)(\/.*)?(\?.*)?$/, async (route) => {
    const path = pathOf(route);
    const method = route.request().method();
    if (path.endsWith('/ai/status')) return route.fulfill({ json: ownStatus(connected) });
    if (path.endsWith('/ai/models')) return route.fulfill({ json: MODELS });
    if (path.endsWith('/ai/privacy-ack')) return route.fulfill({ json: { success: true } });
    if (path.endsWith('/ai/connection') && method === 'PUT') {
      connected = true;
      return route.fulfill({ json: ownStatus(true).own });
    }
    if (path.endsWith('/ai/connection') && method === 'DELETE') {
      connected = false;
      return route.fulfill({ json: { success: true } });
    }
    return route.fallback();
  });
}

export async function resetOwnConnection(api: APIRequestContext): Promise<void> {
  await toggleAddon(api, 'ai_assistant', false);
}

// ── Admin: the connection for everyone ──────────────────────────────────────

/** Admin, Addons: the AI dialog with no connection for everyone yet, and a key that connects. */
export async function mockInstanceConnection(page: Page): Promise<void> {
  let connected = false;
  const view = () => ({
    connection: connected
      ? {
          scope: 'instance',
          kind: PROVIDER.kind,
          model: MODEL,
          hint: HINT,
          status: 'ok',
          host: PROVIDER.host,
          baseUrl: null,
        }
      : null,
    prefill: null,
  });
  await page.context().route(/\/api\/admin\/ai\/(connection|models)(\/.*)?(\?.*)?$/, async (route) => {
    const path = pathOf(route);
    const method = route.request().method();
    if (path.endsWith('/admin/ai/models')) return route.fulfill({ json: MODELS });
    if (method === 'PUT') connected = true;
    if (method === 'DELETE') {
      connected = false;
      return route.fulfill({ json: { success: true } });
    }
    return route.fulfill({ json: view() });
  });
}

// ── Trip: the chat ───────────────────────────────────────────────────────────

/** What the guide asks, and the place the answer suggests for day 1. */
export const QUESTION = 'Where should we have dinner near Senso-ji on day 1?';
export const SUGGESTED = {
  name: 'Asakusa Imahan',
  address: '3-1-12 Nishiasakusa, Taito City, Tokyo',
  lat: 35.7127,
  lng: 139.7905,
  notes: 'Sukiyaki dinner, around 19:00. Book a table a day ahead.',
  // Its own front on Kokusai-dori (Wikimedia Commons, CC0); the lookup by position found a car park nearby.
  image:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/86/Asakusa_Imahan_Kokusai-dori_main_branch.jpg/960px-Asakusa_Imahan_Kokusai-dori_main_branch.jpg',
};

const THREAD = { id: 901, title: 'Dinner near Senso-ji' };
const MESSAGE_ID = 'msg-9002';
const QUESTION_ID = 'msg-9001';
const CALL_ID = 'call-help-imahan-0001';

const ANSWER =
  '**Asakusa Imahan** is a good fit: a sukiyaki restaurant known for its wagyu, a short walk from Senso-ji. ' +
  'Your day ends at teamLab Planets at 16:00, so a table at 19:00 leaves time to get back to Asakusa.\n\n' +
  'It fills up in the evening, so book a day ahead. Shall I put it on day 1?';

const FOLLOW_UPS = [
  'What else is near Senso-ji?',
  'Is day 1 too packed now?',
  'Where can we have breakfast in Asakusa?',
];

/** What the mock made for real, so cleanup can take it away again. */
export interface AssistantRun {
  placeIds: number[];
  chatMessageIds: number[];
}

const listIn = <T>(body: unknown, key: string): T[] =>
  Array.isArray(body) ? (body as T[]) : (((body as Record<string, unknown>)?.[key] as T[] | undefined) ?? []);

/** A day as the change card names it: its date the way the server writes it in English. */
function dayLabel(date: string | null | undefined, number: number): string {
  if (!date) return `Day ${number}`;
  return new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${date.slice(0, 10)}T00:00:00Z`)
  );
}

/**
 * The trip's assistant: switched on, answering on the admin's connection, with
 * one turn that suggests dinner on day 1 and holds it as a change to apply.
 */
export async function mockTripAssistant(page: Page): Promise<AssistantRun> {
  const run: AssistantRun = { placeIds: [], chatMessageIds: [] };
  const api = page.request;
  const { tripId, dayIds } = seededTrip();
  await toggleAddon(api, 'ai_assistant', true);

  const days = listIn<{ id: number; date?: string | null }>(
    await (await api.get(`/api/trips/${tripId}/days`)).json(),
    'days'
  );
  const dayId = dayIds[0];
  const day = days.find((d) => d.id === dayId);
  const categories = listIn<{ id: number; name: string }>(
    await (await api.get('/api/categories')).json(),
    'categories'
  );
  const category = categories.find((c) => /restaurant|food/i.test(c.name)) ?? null;

  const args = {
    dayId,
    name: SUGGESTED.name,
    address: SUGGESTED.address,
    lat: SUGGESTED.lat,
    lng: SUGGESTED.lng,
    ...(category ? { category_id: category.id } : {}),
    place_notes: SUGGESTED.notes,
  };
  const rows = [
    { op: 'add', labelKey: 'day', before: null, after: dayLabel(day?.date, 1) },
    { op: 'add', labelKey: 'address', before: null, after: SUGGESTED.address },
    ...(category ? [{ op: 'add', labelKey: 'category', before: null, after: category.name }] : []),
    { op: 'add', labelKey: 'notes', before: null, after: SUGGESTED.notes },
  ];
  const preview = {
    toolCallId: CALL_ID,
    verbKey: 'addPlaceToDay',
    subject: SUGGESTED.name,
    rows,
    dayId,
    placeIds: [],
    undoable: true,
    effect: {
      kind: 'add',
      dayId,
      fromDayId: null,
      placeId: null,
      assignmentId: null,
      place: { name: SUGGESTED.name, lat: SUGGESTED.lat, lng: SUGGESTED.lng, categoryId: category?.id ?? null },
    },
  };

  const createdAt = PICTURE_DAY.toISOString();
  const question = {
    id: QUESTION_ID,
    role: 'user',
    status: 'complete',
    createdAt,
    parts: [{ type: 'text', text: QUESTION }],
  };
  const answer: { id: string; role: string; status: string; createdAt: string; parts: Record<string, unknown>[] } = {
    id: MESSAGE_ID,
    role: 'assistant',
    status: 'awaiting_approval',
    createdAt,
    parts: [
      { type: 'text', text: ANSWER },
      { type: 'tool-call', toolCallId: CALL_ID, toolName: 'create_and_assign_place', args, approval: { id: CALL_ID } },
      { type: 'data-trek-change', data: preview },
      { type: 'data-trek-follow-ups', data: { questions: FOLLOW_UPS } },
    ],
  };
  let asked = false;

  const turn = [
    { type: 'start', messageId: MESSAGE_ID },
    { type: 'data-trek-thread', data: { threadId: THREAD.id, title: THREAD.title } },
    { type: 'start-step' },
    { type: 'text-start', id: 'text-1' },
    { type: 'text-delta', id: 'text-1', delta: ANSWER },
    { type: 'text-end', id: 'text-1' },
    { type: 'tool-input-start', toolCallId: CALL_ID, toolName: 'create_and_assign_place' },
    { type: 'tool-input-available', toolCallId: CALL_ID, toolName: 'create_and_assign_place', input: args },
    { type: 'data-trek-change', data: preview },
    { type: 'tool-approval-request', approvalId: CALL_ID, toolCallId: CALL_ID },
    { type: 'finish-step' },
    { type: 'data-trek-follow-ups', data: { questions: FOLLOW_UPS } },
    { type: 'data-trek-quota', data: { used: 4, limit: 50 } },
    { type: 'finish', finishReason: 'tool-calls' },
  ];

  /** Apply: the place made and planned for real, then the receipt the server would stream. */
  async function apply(): Promise<unknown[]> {
    const placeRes = await api.post(`/api/trips/${tripId}/places`, {
      data: {
        name: SUGGESTED.name,
        address: SUGGESTED.address,
        lat: SUGGESTED.lat,
        lng: SUGGESTED.lng,
        notes: SUGGESTED.notes,
        image_url: SUGGESTED.image,
        ...(category ? { category_id: category.id } : {}),
      },
    });
    if (!placeRes.ok())
      throw new Error(`could not create ${SUGGESTED.name}: ${placeRes.status()} ${await placeRes.text()}`);
    const placeBody = (await placeRes.json()) as { place?: { id: number }; id?: number };
    const placeId = placeBody.place?.id ?? placeBody.id;
    if (typeof placeId !== 'number') throw new Error('the new place came back without an id');
    run.placeIds.push(placeId);
    const assigned = await api.post(`/api/trips/${tripId}/days/${dayId}/assignments`, { data: { place_id: placeId } });
    if (!assigned.ok())
      throw new Error(`could not plan ${SUGGESTED.name}: ${assigned.status()} ${await assigned.text()}`);
    const applied = {
      toolCallId: CALL_ID,
      entity: 'place',
      ids: [placeId],
      dayId,
      undoUntil: new Date(PICTURE_DAY.getTime() + 2 * 3600_000).toISOString(),
    };
    answer.status = 'complete';
    answer.parts = answer.parts.map((p) =>
      p.type === 'tool-call'
        ? { ...p, result: { place: { id: placeId } }, isError: false, approval: { id: CALL_ID, approved: true } }
        : p
    );
    answer.parts.push({ type: 'data-trek-applied', data: applied });
    return [
      { type: 'start', messageId: MESSAGE_ID },
      { type: 'tool-output-available', toolCallId: CALL_ID, output: { place: { id: placeId } } },
      { type: 'data-trek-applied', data: applied },
      { type: 'finish', finishReason: 'stop' },
    ];
  }

  await page
    .context()
    .route(/\/api\/ai\/(status|privacy-ack)(\?.*)?$/, (route) =>
      pathOf(route).endsWith('/status')
        ? route.fulfill({ json: instanceStatus() })
        : route.fulfill({ json: { success: true } })
    );
  await page.context().route(new RegExp(`/api/trips/${tripId}/assistant/`), async (route) => {
    const path = pathOf(route).replace(`/api/trips/${tripId}/assistant`, '');
    const method = route.request().method();
    if (path === '/threads' && method === 'GET') {
      return route.fulfill({
        json: { threads: asked ? [{ id: THREAD.id, title: THREAD.title, lastMessageAt: createdAt }] : [] },
      });
    }
    if (path === `/threads/${THREAD.id}` && method === 'GET') {
      return route.fulfill({
        json: {
          thread: { id: THREAD.id, title: THREAD.title, lastMessageAt: createdAt },
          messages: [question, answer],
        },
      });
    }
    if (path === '/chat' && method === 'POST') {
      asked = true;
      return fulfillStream(route, turn);
    }
    if (path === `/threads/${THREAD.id}/decisions` && method === 'POST') {
      const body = route.request().postDataJSON() as { decisions?: { toolCallId: string; approved: boolean }[] };
      const approved = body.decisions?.find((d) => d.toolCallId === CALL_ID)?.approved;
      if (!approved) {
        answer.status = 'complete';
        return fulfillStream(route, [
          { type: 'start', messageId: MESSAGE_ID },
          { type: 'tool-output-denied', toolCallId: CALL_ID },
          { type: 'finish', finishReason: 'stop' },
        ]);
      }
      return fulfillStream(route, await apply());
    }
    if (path.startsWith(`/threads/${THREAD.id}/messages/`) && path.endsWith('/share') && method === 'POST') {
      // A real message in the trip chat, so the chat shows what was shared.
      const { text } = route.request().postDataJSON() as { text: string };
      const posted = await api.post(`/api/trips/${tripId}/collab/messages`, { data: { text } });
      const json = (await posted.json()) as { message?: { id: number } };
      if (json.message?.id) run.chatMessageIds.push(json.message.id);
      return route.fulfill({ status: posted.status(), json });
    }
    if (path === '/stop') return route.fulfill({ json: { success: true } });
    if (path.startsWith('/tool-calls/') && path.endsWith('/undo')) {
      for (const id of run.placeIds.splice(0)) await api.delete(`/api/trips/${tripId}/places/${id}`);
      return route.fulfill({ json: { undone: true } });
    }
    return route.fulfill({ status: 404, json: { error: 'not mocked' } });
  });
  return run;
}

/** Take away what the chat made, and switch the assistant off again. */
export async function resetTripAssistant(api: APIRequestContext, run: AssistantRun | null): Promise<void> {
  const { tripId } = seededTrip();
  for (const id of run?.chatMessageIds ?? []) await api.delete(`/api/trips/${tripId}/collab/messages/${id}`);
  // By name as well: a run that stopped between the create and the receipt left one the list does not know.
  const places = listIn<{ id: number; name: string }>(
    await (await api.get(`/api/trips/${tripId}/places`)).json(),
    'places'
  );
  for (const place of places.filter((p) => p.name === SUGGESTED.name)) {
    await api.delete(`/api/trips/${tripId}/places/${place.id}`);
  }
  await toggleAddon(api, 'ai_assistant', false);
}
