import {
  ASSISTANT_ERROR_CODES,
  type AiAdminConnectionResponse,
  type AiAdminSettings,
  type AiApiKeyConnectRequest,
  type AiAuthStartResponse,
  type AiChatgptFinishRequest,
  type AiClaudeConnectorResponse,
  type AiConnectionScope,
  type AiConnectionView,
  type AiInstanceConnectionRequest,
  type AiModelListResponse,
  type AiOpenrouterFinishRequest,
  type AiPrivacyAckRequest,
  type AiStatusResponse,
  type AssistantAddFoundPlaceRequest,
  type AssistantAddFoundPlaceResponse,
  type AssistantChatRequest,
  type AssistantDecisionsRequest,
  type AssistantErrorCode,
  type AssistantRenderUploadResponse,
  type AssistantScope,
  type AssistantShareRequest,
  type AssistantTakeProposalRequest,
  type AssistantThreadListResponse,
  type AssistantThreadResponse,
  type AssistantUndoResponse,
  type BookDesignDraftResponse,
  type CollabMessageResponse,
  type SuccessResponse,
  type UiStreamChunk,
} from '@trek/shared';
import apiClient, { postMultipart } from './client';
import { parseUiMessageStream } from './uiMessageStream';
import { getSocketId } from './websocket';

/**
 * The assistant and the AI connections behind it, in their own file
 * rather than in the `client.ts` god module.
 *
 * The two streaming calls (a new message, and the decisions on held changes)
 * go through `fetch`, not axios: the answer is a server-sent event stream that
 * runs for as long as the model works, and axios would buffer it whole behind
 * its 8 s timeout. Everything else is plain JSON through `apiClient`.
 */

/** A refusal the server answered before the stream opened, named by its `AssistantErrorCode`. */
export class AssistantRequestError extends Error {
  readonly code: AssistantErrorCode;
  readonly status: number;

  constructor(code: AssistantErrorCode, status: number) {
    super(`Assistant request refused: ${code}`);
    this.name = 'AssistantRequestError';
    this.code = code;
    this.status = status;
  }
}

const KNOWN_CODES: ReadonlySet<string> = new Set(ASSISTANT_ERROR_CODES);

/**
 * The code of a refusal: the body's `code` when it names one, otherwise what
 * the status alone can say.
 */
async function refusalCode(res: Response): Promise<AssistantErrorCode> {
  try {
    const body: unknown = await res.json();
    const code = (body as { code?: unknown } | null)?.code;
    if (typeof code === 'string' && KNOWN_CODES.has(code)) return code as AssistantErrorCode;
  } catch {
    // Not JSON (a proxy's error page); the status below still says something.
  }
  // A bare 429 is TREK's own limit or a proxy's; a provider's limit always names its code.
  if (res.status === 429) return 'too_many_requests';
  if (res.status === 409) return 'busy';
  if (res.status === 502 || res.status === 503 || res.status === 504) return 'provider_unavailable';
  return 'generic';
}

async function openStream(path: string, body: unknown, signal: AbortSignal): Promise<AsyncGenerator<UiStreamChunk>> {
  // A file goes as multipart, where the browser sets the content type with its boundary.
  const form = body instanceof FormData;
  const headers: Record<string, string> = form
    ? { accept: 'text/event-stream' }
    : { 'content-type': 'application/json', accept: 'text/event-stream' };
  const socketId = getSocketId();
  if (socketId) headers['X-Socket-Id'] = socketId;
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: form ? body : JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new AssistantRequestError(await refusalCode(res), res.status);
  if (!res.body) throw new AssistantRequestError('generic', res.status);
  return parseUiMessageStream(res.body);
}

const tripBase = (tripId: number) => `/trips/${tripId}/assistant`;

/**
 * What a conversation call is about: a trip's id (the planner's chat), or a
 * scope, which also reaches a journey's chat in TREK Studio. Threads, turns,
 * decisions, undo and stop exist under both; files, found places, proposals
 * and sharing belong to a trip and take its id.
 */
export type AssistantTarget = number | AssistantScope;

function scopeBase(target: AssistantTarget): string {
  if (typeof target === 'number') return tripBase(target);
  return target.kind === 'trip' ? tripBase(target.tripId) : `/journeys/${target.journeyId}/assistant`;
}

/** Where the Studio uploads a page a running turn of a journey's chat asked for. */
const renderPath = (journeyId: number, threadId: number, requestId: string) =>
  `/journeys/${journeyId}/assistant/threads/${threadId}/renders/${encodeURIComponent(requestId)}`;

/**
 * For the calls that make the server go and ask the provider (listing models,
 * testing a key, exchanging a sign-in code): the shared 8 s is TREK's own
 * budget and too short for a provider's.
 */
const viaProvider = { timeout: 30_000 };

export const assistantApi = {
  threads: (target: AssistantTarget): Promise<AssistantThreadListResponse> =>
    apiClient.get(`${scopeBase(target)}/threads`).then((r) => r.data),
  thread: (target: AssistantTarget, threadId: number): Promise<AssistantThreadResponse> =>
    apiClient.get(`${scopeBase(target)}/threads/${threadId}`).then((r) => r.data),
  deleteThread: (target: AssistantTarget, threadId: number): Promise<SuccessResponse> =>
    apiClient.delete(`${scopeBase(target)}/threads/${threadId}`).then((r) => r.data),
  undo: (target: AssistantTarget, toolCallId: string): Promise<AssistantUndoResponse> =>
    apiClient.post(`${scopeBase(target)}/tool-calls/${encodeURIComponent(toolCallId)}/undo`, {}).then((r) => r.data),
  // Ends this user's running turn, wherever it runs (another tab included).
  stop: (target: AssistantTarget): Promise<SuccessResponse> =>
    apiClient.post(`${scopeBase(target)}/stop`, {}).then((r) => r.data),
  // A place a search found, suggested for a day: answers with the message holding the change.
  addFoundPlace: (
    tripId: number,
    threadId: number,
    body: AssistantAddFoundPlaceRequest
  ): Promise<AssistantAddFoundPlaceResponse> =>
    apiClient.post(`${tripBase(tripId)}/threads/${threadId}/found-places`, body).then((r) => r.data),
  // A proposal an answer showed as a card ("Plan this"): answers like a found place, with the message holding it.
  takeProposal: (
    tripId: number,
    threadId: number,
    body: AssistantTakeProposalRequest
  ): Promise<AssistantAddFoundPlaceResponse> =>
    apiClient.post(`${tripBase(tripId)}/threads/${threadId}/proposals`, body).then((r) => r.data),
  // An answer posted to the trip chat, marked as shared from the assistant; the client's socket id skips the echo.
  share: (
    tripId: number,
    threadId: number,
    messageId: string,
    body: AssistantShareRequest
  ): Promise<CollabMessageResponse> =>
    apiClient
      .post(`${tripBase(tripId)}/threads/${threadId}/messages/${encodeURIComponent(messageId)}/share`, body)
      .then((r) => r.data),

  chat: (target: AssistantTarget, body: AssistantChatRequest, signal: AbortSignal) =>
    openStream(`${scopeBase(target)}/chat`, body, signal),
  decide: (target: AssistantTarget, threadId: number, body: AssistantDecisionsRequest, signal: AbortSignal) =>
    openStream(`${scopeBase(target)}/threads/${threadId}/decisions`, body, signal),
  // A booking file: the server reads it and proposes each booking it finds as a change.
  attach: (tripId: number, form: FormData, signal: AbortSignal) =>
    openStream(`${tripBase(tripId)}/attachments`, form, signal),
  // A Studio page a running turn asked for, drawn by this tab: the image and what it shows, as multipart.
  uploadRender: (
    journeyId: number,
    threadId: number,
    requestId: string,
    form: FormData,
    signal: AbortSignal
  ): Promise<AssistantRenderUploadResponse> =>
    postMultipart(renderPath(journeyId, threadId, requestId), form, { signal }),
  // A whole-book design draft, for a page of it a running turn asked the Studio to draw.
  bookDesign: (journeyId: number, designId: string): Promise<BookDesignDraftResponse> =>
    apiClient.get(`/journeys/${journeyId}/book-designs/${encodeURIComponent(designId)}`).then((r) => r.data),
};

/** A user's own connection, and what the assistant runs on for them. */
export const aiApi = {
  status: (): Promise<AiStatusResponse> => apiClient.get('/ai/status').then((r) => r.data),
  models: (): Promise<AiModelListResponse> => apiClient.get('/ai/models', viaProvider).then((r) => r.data),
  // Saving tests the key against the provider first.
  connectKey: (body: AiApiKeyConnectRequest): Promise<AiConnectionView> =>
    apiClient.put('/ai/connection', body, viaProvider).then((r) => r.data),
  setModel: (model: string): Promise<AiConnectionView> =>
    apiClient.patch('/ai/connection/model', { model }).then((r) => r.data),
  disconnect: (): Promise<SuccessResponse> => apiClient.delete('/ai/connection').then((r) => r.data),
  ackPrivacy: (body: AiPrivacyAckRequest): Promise<SuccessResponse> =>
    apiClient.post('/ai/privacy-ack', body).then((r) => r.data),

  chatgptStart: (scope: AiConnectionScope = 'user'): Promise<AiAuthStartResponse> =>
    apiClient
      .post(scope === 'instance' ? '/admin/ai/connect/chatgpt/start' : '/ai/connect/chatgpt/start', {})
      .then((r) => r.data),
  chatgptFinish: (body: AiChatgptFinishRequest): Promise<AiConnectionView> =>
    apiClient.post('/ai/connect/chatgpt/finish', body, viaProvider).then((r) => r.data),
  chatgptSignOut: (): Promise<SuccessResponse> =>
    apiClient.post('/ai/connect/chatgpt/sign-out', {}).then((r) => r.data),

  openrouterStart: (scope: AiConnectionScope): Promise<AiAuthStartResponse> =>
    apiClient
      .post(scope === 'instance' ? '/admin/ai/connect/openrouter/start' : '/ai/connect/openrouter/start', { scope })
      .then((r) => r.data),
  openrouterFinish: (body: AiOpenrouterFinishRequest): Promise<AiConnectionView> =>
    apiClient.post('/ai/connect/openrouter/finish', body, viaProvider).then((r) => r.data),
};

/** The connection the instance provides for everyone, and the assistant's admin settings. */
export const aiAdminApi = {
  settings: (): Promise<AiAdminSettings> => apiClient.get('/admin/ai/settings').then((r) => r.data),
  saveSettings: (body: AiAdminSettings): Promise<AiAdminSettings> =>
    apiClient.put('/admin/ai/settings', body).then((r) => r.data),
  connection: (): Promise<AiAdminConnectionResponse> => apiClient.get('/admin/ai/connection').then((r) => r.data),
  saveConnection: (body: AiInstanceConnectionRequest): Promise<AiAdminConnectionResponse> =>
    apiClient.put('/admin/ai/connection', body, viaProvider).then((r) => r.data),
  removeConnection: (): Promise<SuccessResponse> => apiClient.delete('/admin/ai/connection').then((r) => r.data),
  models: (): Promise<AiModelListResponse> => apiClient.get('/admin/ai/models', viaProvider).then((r) => r.data),
};

export const claudeConnectorApi = {
  get: (): Promise<AiClaudeConnectorResponse> => apiClient.get('/integrations/claude-connector').then((r) => r.data),
};
