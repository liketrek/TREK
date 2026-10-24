import type {
  AssistantApplied,
  AssistantCard,
  AssistantDecision,
  AssistantMessage,
  AssistantMessagePart,
  UiStreamChunk,
} from '@trek/shared';

/**
 * Folding the assistant's stream into the messages of a thread. Pure and
 * React-free: the store runs it per chunk, and the messages it produces have
 * the same shape the server stores and `GET threads/:id` answers, so a
 * reloaded thread and a streamed one render through the same code.
 *
 * The message being written is the last one, an assistant message opened by
 * `start`. Results of tool calls, decisions and applied changes are matched
 * by `toolCallId` across the thread instead, because the decisions stream
 * reports on calls an earlier message holds.
 */

type ToolCallPart = Extract<AssistantMessagePart, { type: 'tool-call' }>;

/** Whether a tool call still waits for the user to apply or discard it. */
function isAwaitingDecision(part: AssistantMessagePart): part is ToolCallPart {
  return (
    part.type === 'tool-call' &&
    part.approval !== undefined &&
    part.approval.approved === undefined &&
    part.approval.resolution === undefined
  );
}

/** The calls of the thread that wait for a decision, in order; a decisions request has to name all of them. */
export function pendingToolCallIds(messages: readonly AssistantMessage[]): string[] {
  return messages.flatMap((m) => m.parts.filter(isAwaitingDecision).map((p) => p.toolCallId));
}

export function applyChunk(
  messages: AssistantMessage[],
  chunk: UiStreamChunk,
  now: () => string = () => new Date().toISOString()
): AssistantMessage[] {
  switch (chunk.type) {
    case 'start':
      return openMessage(messages, chunk.messageId, now);
    case 'text-start':
      return withCurrent(messages, now, (parts) => [...parts, { type: 'text', text: '' }]);
    case 'text-delta':
      return withCurrent(messages, now, (parts) => appendText(parts, chunk.delta));
    case 'data-trek-change':
      return withCurrent(messages, now, (parts) => [
        ...parts.filter((p) => !(p.type === 'data-trek-change' && p.data.toolCallId === chunk.data.toolCallId)),
        { type: 'data-trek-change', data: chunk.data },
      ]);
    case 'data-trek-applied':
      return placeApplied(messages, now, chunk.data);
    case 'data-trek-places':
      // One part per search step; a repeated chunk for the same step replaces it.
      return withCurrent(messages, now, (parts) => [
        ...parts.filter((p) => !(p.type === 'data-trek-places' && p.data.toolCallId === chunk.data.toolCallId)),
        { type: 'data-trek-places', data: chunk.data },
      ]);
    case 'data-trek-weather':
      return withCurrent(messages, now, (parts) => [...parts, { type: 'data-trek-weather', data: chunk.data }]);
    case 'data-trek-sources':
      return withCurrent(messages, now, (parts) => [...parts, { type: 'data-trek-sources', data: chunk.data }]);
    case 'data-trek-follow-ups':
      return withCurrent(messages, now, (parts) => [...parts, { type: 'data-trek-follow-ups', data: chunk.data }]);
    case 'data-trek-card':
      return chunk.data.card ? placeCard(messages, now, chunk.data) : messages;
    case 'data-trek-page-view':
      // A Studio page the turn looked at, as the server stores it: what it was, never the image.
      return withCurrent(messages, now, (parts) => [...parts, { type: 'data-trek-page-view', data: chunk.data }]);
    case 'finish':
      return withStatus(messages, (m) =>
        m.status === 'error' ? m.status : m.parts.some(isAwaitingDecision) ? 'awaiting_approval' : 'complete'
      );
    case 'error':
      return withStatus(messages, () => 'error');
    case 'abort':
      return withStatus(messages, () => 'aborted');
    default:
      return applyToolChunk(messages, chunk, now);
  }
}

function applyToolChunk(messages: AssistantMessage[], chunk: UiStreamChunk, now: () => string): AssistantMessage[] {
  switch (chunk.type) {
    case 'tool-input-start':
      return upsertCall(messages, now, chunk.toolCallId, chunk.toolName, (p) => p);
    case 'tool-input-available':
      return upsertCall(messages, now, chunk.toolCallId, chunk.toolName, (p) => ({ ...p, args: chunk.input }));
    case 'tool-approval-request':
      return updateCall(messages, chunk.toolCallId, (p) => ({ ...p, approval: { id: chunk.approvalId } }));
    case 'tool-output-available':
      return updateCall(messages, chunk.toolCallId, (p) => ({ ...p, result: chunk.output, isError: false }));
    case 'tool-output-error':
      return updateCall(messages, chunk.toolCallId, (p) => ({ ...p, result: chunk.errorText, isError: true }));
    case 'tool-output-denied':
      // The shape the server stores for a discarded change.
      return updateCall(messages, chunk.toolCallId, (p) => ({
        ...p,
        result: { rejected: true },
        approval: { ...(p.approval ?? { id: p.toolCallId }), approved: false },
      }));
    default:
      // start-step, finish-step, text-end, and the thread, quota and live activity data the store reads itself.
      return messages;
  }
}

/** Marks the decided calls before the request goes out, so a card cannot be decided twice. */
export function markDecisions(
  messages: AssistantMessage[],
  decisions: readonly AssistantDecision[]
): AssistantMessage[] {
  const approved = new Map(decisions.map((d) => [d.toolCallId, d.approved]));
  return messages.map((m) => {
    if (!m.parts.some((p) => isAwaitingDecision(p) && approved.has(p.toolCallId))) return m;
    const parts = m.parts.map((p) => {
      if (!isAwaitingDecision(p)) return p;
      const decision = approved.get(p.toolCallId);
      return decision === undefined ? p : { ...p, approval: { id: p.toolCallId, ...p.approval, approved: decision } };
    });
    const status = m.status === 'awaiting_approval' && !parts.some(isAwaitingDecision) ? 'complete' : m.status;
    return { ...m, parts, status };
  });
}

/** Closes the undo window of an applied change, after it was undone or can no longer be. */
export function closeUndo(messages: AssistantMessage[], toolCallId: string): AssistantMessage[] {
  return messages.map((m) =>
    m.parts.some((p) => p.type === 'data-trek-applied' && p.data.toolCallId === toolCallId)
      ? {
          ...m,
          parts: m.parts.map((p) =>
            p.type === 'data-trek-applied' && p.data.toolCallId === toolCallId
              ? { ...p, data: { ...p.data, undoUntil: null } }
              : p
          ),
        }
      : m
  );
}

function emptyAssistant(id: string, createdAt: string): AssistantMessage {
  return { id, role: 'assistant', parts: [], status: 'complete', createdAt };
}

/** Opens the assistant message `start` names; the decisions stream may continue the one that is already last. */
function openMessage(messages: AssistantMessage[], id: string, now: () => string): AssistantMessage[] {
  const last = messages[messages.length - 1];
  if (last?.role === 'assistant' && last.id === id) return messages;
  return [...messages, emptyAssistant(id, now())];
}

function appendText(parts: AssistantMessagePart[], delta: string): AssistantMessagePart[] {
  const last = parts[parts.length - 1];
  if (last?.type === 'text') return [...parts.slice(0, -1), { type: 'text', text: last.text + delta }];
  return [...parts, { type: 'text', text: delta }];
}

/** Rewrites the parts of the message being written, opening one if the stream skipped `start`. */
function withCurrent(
  messages: AssistantMessage[],
  now: () => string,
  edit: (parts: AssistantMessagePart[]) => AssistantMessagePart[]
): AssistantMessage[] {
  const last = messages[messages.length - 1];
  if (last?.role === 'assistant') return [...messages.slice(0, -1), { ...last, parts: edit(last.parts) }];
  const opened = emptyAssistant(`stream-${messages.length}`, now());
  return [...messages, { ...opened, parts: edit(opened.parts) }];
}

/** Sets the status of the message being written; a stream that never opened one has nothing to mark. */
function withStatus(
  messages: AssistantMessage[],
  next: (m: AssistantMessage) => AssistantMessage['status']
): AssistantMessage[] {
  const last = messages[messages.length - 1];
  if (last?.role !== 'assistant') return messages;
  return [...messages.slice(0, -1), { ...last, status: next(last) }];
}

function findCall(messages: readonly AssistantMessage[], toolCallId: string): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.parts.some((p) => p.type === 'tool-call' && p.toolCallId === toolCallId)) return i;
  }
  return -1;
}

function updateCall(
  messages: AssistantMessage[],
  toolCallId: string,
  edit: (part: ToolCallPart) => ToolCallPart
): AssistantMessage[] {
  const at = findCall(messages, toolCallId);
  if (at < 0) return messages;
  return messages.map((m, i) =>
    i === at
      ? { ...m, parts: m.parts.map((p) => (p.type === 'tool-call' && p.toolCallId === toolCallId ? edit(p) : p)) }
      : m
  );
}

function upsertCall(
  messages: AssistantMessage[],
  now: () => string,
  toolCallId: string,
  toolName: string,
  edit: (part: ToolCallPart) => ToolCallPart
): AssistantMessage[] {
  if (findCall(messages, toolCallId) >= 0) return updateCall(messages, toolCallId, (p) => edit({ ...p, toolName }));
  return withCurrent(messages, now, (parts) => [...parts, edit({ type: 'tool-call', toolCallId, toolName, args: {} })]);
}

/**
 * Puts a card where it belongs: an applied write's next to the change that
 * proposed it (an earlier message, when the decisions stream sends it), a
 * read's into the message being written. A repeated card for the same call
 * replaces the one before.
 */
function placeCard(messages: AssistantMessage[], now: () => string, data: AssistantCard): AssistantMessage[] {
  const card: AssistantMessagePart = { type: 'data-trek-card', data };
  const keep = (parts: AssistantMessagePart[]) => [
    ...parts.filter((p) => !(p.type === 'data-trek-card' && p.data.toolCallId === data.toolCallId)),
    card,
  ];
  const at = findChange(messages, data.toolCallId);
  if (at < 0) return withCurrent(messages, now, keep);
  return messages.map((m, i) => (i === at ? { ...m, parts: keep(m.parts) } : m));
}

/** The message holding the change a call proposed, or -1. */
function findChange(messages: readonly AssistantMessage[], toolCallId: string): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.parts.some((p) => p.type === 'tool-call' && p.toolCallId === toolCallId && p.approval)) return i;
  }
  return -1;
}

/** Puts the receipt of an applied change next to its call, so the card and its receipt stay together. */
function placeApplied(messages: AssistantMessage[], now: () => string, data: AssistantApplied): AssistantMessage[] {
  const receipt: AssistantMessagePart = { type: 'data-trek-applied', data };
  const keep = (parts: AssistantMessagePart[]) => [
    ...parts.filter((p) => !(p.type === 'data-trek-applied' && p.data.toolCallId === data.toolCallId)),
    receipt,
  ];
  const at = findCall(messages, data.toolCallId);
  if (at < 0) return withCurrent(messages, now, keep);
  return messages.map((m, i) => (i === at ? { ...m, parts: keep(m.parts) } : m));
}
