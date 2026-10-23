import { ASSISTANT_MESSAGE_PARTS, ASSISTANT_PROVIDER_STATE } from '../../db/json-columns';
import type { AssistantMessageRow } from '../../db/repositories/AssistantMessages.repository';
import type { AssistantToolCallRow } from '../../db/repositories/AssistantToolCalls.repository';
import { parseDbTimestamp, utcSuffix } from '../../db/types';
import { decodeJson } from '../../utils/json-column';
import type { AiChatMessage, AiToolCall } from '../ai-connections/ai-chat-client.interface';
import { fitToSize } from './assistant-output';
import {
  ADD_FOUND_PLACE_TOOL,
  APPROVAL_TTL_MS,
  ASSISTANT_SERVER_TOOLS,
  IMPORT_BOOKING_TOOL,
  READ_BOOKING_FILE_TOOL,
  TAKE_PROPOSAL_TOOL,
} from './assistant-tools.constants';
import type { AssistantMessage, AssistantMessagePart, AssistantToolApproval } from '@trek/shared';

/**
 * A thread's stored messages, read two ways: as the conversation the
 * provider is sent, and as the messages the client shows.
 *
 * Every model step is one row, so a provider that needs its own items
 * replayed (`provider_state`) gets them exactly per step. The client sees the
 * steps of one answer as one message, the way they streamed.
 */

/** How far a tool answer from an earlier turn is cut, so old lookups do not crowd out the current one. */
const EARLIER_TOOL_OUTPUT_CHARS = 8_000;

/** What the model is told about a held change that never ran. */
const NOT_APPLIED = JSON.stringify({ applied: false, reason: 'The user did not apply this change.' });

/** The stable id a message has on the wire and in the thread: its first row. */
export function messageIdOf(rowId: number): string {
  return `msg-${rowId}`;
}

export function partsOf(row: AssistantMessageRow): AssistantMessagePart[] {
  return decodeJson(ASSISTANT_MESSAGE_PARTS, row.parts, `message ${row.id}`);
}

/** A tool answer as the text a provider takes: a message as it was written, anything else as JSON. */
export function outputText(result: unknown): string {
  return typeof result === 'string' ? result : JSON.stringify(result);
}

function textOf(parts: readonly AssistantMessagePart[]): string {
  return parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

/** A user message as the provider reads it: what they wrote, and a line for each file they attached. */
function userText(parts: readonly AssistantMessagePart[]): string {
  const files = parts
    .filter((part) => part.type === 'attachment')
    .map((part) => `[The user attached the file "${part.name}" (${part.mime}, ${part.size} bytes).]`);
  return [textOf(parts), ...files].filter((line) => line !== '').join('\n');
}

type ToolCallPart = Extract<AssistantMessagePart, { type: 'tool-call' }>;

function quoted(value: unknown): string {
  return `"${typeof value === 'string' && value !== '' ? value : '?'}"`;
}

/** What became of a booking from a file, as its stored part says. */
function bookingOutcome(part: ToolCallPart): string {
  const title = quoted(part.args.title);
  if (part.approval?.approved === true) {
    return part.isError ? `${title} could not be added.` : `${title} was added to the trip as a booking.`;
  }
  if (part.approval?.approved === false) return `The user discarded ${title}.`;
  if (part.approval?.resolution) return `${title} was not added; the user moved on without deciding.`;
  return `${title} is waiting for the user to add or discard it.`;
}

/** What became of a place the user picked from search results for a day, as its stored part says. */
function foundPlaceOutcome(part: ToolCallPart): string {
  const place = quoted(part.args.name);
  const day = `day ${typeof part.args.dayId === 'number' ? part.args.dayId : '?'}`;
  if (part.approval?.approved === true) {
    return part.isError ? `${place} could not be added to ${day}.` : `${place} was added to ${day}.`;
  }
  if (part.approval?.approved === false) return `The user discarded ${place} for ${day}.`;
  if (part.approval?.resolution) return `${place} was not added to ${day}; the user moved on without deciding.`;
  return `The user picked ${place} from the search results for ${day}; it waits for them to add or discard it.`;
}

/** What became of a proposal the user took from an answer to add it to the trip, as its stored part says. */
function takenProposalOutcome(part: ToolCallPart): string {
  const name = quoted(part.args.name);
  const what = part.args.via === 'create_city_walk' ? 'city walk' : 'hike';
  if (part.approval?.approved === true) {
    return part.isError ? `The ${what} ${name} could not be added.` : `The ${what} ${name} was added to the trip.`;
  }
  if (part.approval?.approved === false) return `The user discarded the ${what} ${name}.`;
  if (part.approval?.resolution) return `The ${what} ${name} was not added; the user moved on without deciding.`;
  return `The user took the proposed ${what} ${name} to add it; it waits for them to add or discard it.`;
}

/**
 * The server's own steps of a message (reading an attached file, the bookings
 * it found) as one note in plain words. They are no tools the provider knows,
 * so they are never replayed as calls; the note lets the model answer
 * questions about the file all the same.
 */
export function serverStepsNote(calls: readonly ToolCallPart[]): string {
  const lines: string[] = [];
  for (const part of calls) {
    if (part.toolName === READ_BOOKING_FILE_TOOL) {
      const result = (part.result ?? {}) as { bookings?: unknown };
      const titles = Array.isArray(result.bookings) ? result.bookings.map(quoted) : [];
      const file = quoted(part.args.name);
      const found = titles.length === 0 ? 'no booking in it' : `${titles.length} booking(s): ${titles.join(', ')}`;
      const read = `TREK read the attached file ${file} and found ${found}.`;
      lines.push(part.isError ? `TREK could not read the attached file ${file}.` : read);
    } else if (part.toolName === IMPORT_BOOKING_TOOL) {
      lines.push(bookingOutcome(part));
    } else if (part.toolName === ADD_FOUND_PLACE_TOOL) {
      lines.push(foundPlaceOutcome(part));
    } else if (part.toolName === TAKE_PROPOSAL_TOOL) {
      lines.push(takenProposalOutcome(part));
    }
  }
  return lines.join(' ');
}

/**
 * The thread as the provider reads it, oldest first, from its first user
 * message on. A step's tool calls are followed by their answers; a held
 * change that was never applied answers that it was not, since every call
 * must be answered. `providerIds` maps a held call's own id to the id the
 * provider gave it.
 */
export function toChatHistory(
  rows: readonly AssistantMessageRow[],
  providerIds: ReadonlyMap<string, string>,
): AiChatMessage[] {
  const first = rows.findIndex((row) => row.role === 'user');
  if (first < 0) return [];
  const lastUser = rows.map((row) => row.role).lastIndexOf('user');
  const history: AiChatMessage[] = [];
  rows.slice(first).forEach((row, offset) => {
    const parts = partsOf(row);
    if (row.role === 'user') {
      history.push({ role: 'user', text: userText(parts) });
      return;
    }
    const earlier = first + offset < lastUser;
    const allCalls = parts.filter((part) => part.type === 'tool-call');
    const serverCalls = allCalls.filter((part) => ASSISTANT_SERVER_TOOLS.has(part.toolName));
    // Told as the user's side of the conversation: the history then ends on it
    // when a decision on these bookings starts the next answer.
    if (serverCalls.length > 0) history.push({ role: 'user', text: serverStepsNote(serverCalls) });
    const calls = allCalls.filter((part) => !ASSISTANT_SERVER_TOOLS.has(part.toolName));
    const toolCalls: AiToolCall[] = calls.map((part) => ({
      id: providerIds.get(part.toolCallId) ?? part.toolCallId,
      name: part.toolName,
      args: part.args,
    }));
    const text = textOf(parts);
    if (!text && toolCalls.length === 0) return;
    const providerState = decodeJson(ASSISTANT_PROVIDER_STATE, row.provider_state, `message ${row.id}`);
    history.push({ role: 'assistant', text, toolCalls, providerState });
    calls.forEach((part, index) => {
      const output =
        part.result === undefined
          ? NOT_APPLIED
          : outputText(earlier ? fitToSize(part.result, EARLIER_TOOL_OUTPUT_CHARS) : part.result);
      history.push({
        role: 'tool',
        toolCallId: toolCalls[index].id,
        name: part.toolName,
        output,
        ...(part.isError ? { isError: true } : {}),
      });
    });
  });
  return history;
}

/** What became of a held change, as its approval reads now. */
function approvalOf(
  part: AssistantToolApproval,
  call: AssistantToolCallRow | undefined,
  now: Date,
): AssistantToolApproval {
  if (!call) return part;
  switch (call.state) {
    case 'approval_requested': {
      const proposed = parseDbTimestamp(call.created_at)?.getTime() ?? 0;
      return now.getTime() - proposed > APPROVAL_TTL_MS ? { id: part.id, resolution: 'expired' } : { id: part.id };
    }
    case 'rejected':
      return part.resolution ? part : { id: part.id, approved: false };
    case 'expired':
      return { id: part.id, resolution: 'expired' };
    case 'approved':
      // Taken but never run (the turn died before it): closed, not shown as applied.
      return { id: part.id, resolution: 'cancelled' };
    default:
      return { id: part.id, approved: true };
  }
}

/** Until when an applied change can still be undone; null once undone or past its window. */
function undoUntilOf(call: AssistantToolCallRow | undefined, now: Date): string | null {
  if (call?.state !== 'executed') return null;
  const until = parseDbTimestamp(call.undo_until);
  return until && until.getTime() > now.getTime() ? utcSuffix(call.undo_until) : null;
}

/**
 * The parts as they read now: the stored parts carry the state of the moment
 * they were written, the tool call rows what happened since (a decision, an
 * expiry, an undo, an undo window that closed).
 */
function currentParts(
  parts: readonly AssistantMessagePart[],
  calls: ReadonlyMap<string, AssistantToolCallRow>,
  now: Date,
): AssistantMessagePart[] {
  return parts.map((part) => {
    if (part.type === 'tool-call' && part.approval) {
      return { ...part, approval: approvalOf(part.approval, calls.get(part.toolCallId), now) };
    }
    if (part.type === 'data-trek-applied') {
      return { ...part, data: { ...part.data, undoUntil: undoUntilOf(calls.get(part.data.toolCallId), now) } };
    }
    return part;
  });
}

function isPending(part: AssistantMessagePart): boolean {
  return (
    part.type === 'tool-call' && !!part.approval && part.approval.approved === undefined && !part.approval.resolution
  );
}

/**
 * The thread as the client shows it: the steps of one answer, which follow
 * each other as rows, are one message under the id of the first. An answer
 * waits for the user only while one of its changes still does.
 */
export function toThreadMessages(
  rows: readonly AssistantMessageRow[],
  calls: ReadonlyMap<string, AssistantToolCallRow>,
  now: Date,
): AssistantMessage[] {
  const messages: AssistantMessage[] = [];
  let previousRole: string | null = null;
  for (const row of rows) {
    const parts = currentParts(partsOf(row), calls, now);
    const last = messages[messages.length - 1];
    if (row.role === 'assistant' && previousRole === 'assistant' && last) {
      last.parts.push(...parts);
      last.status = row.status as AssistantMessage['status'];
    } else {
      messages.push({
        id: messageIdOf(row.id),
        role: row.role === 'user' ? 'user' : 'assistant',
        parts,
        status: row.status as AssistantMessage['status'],
        createdAt: utcSuffix(row.created_at) ?? row.created_at,
      });
    }
    previousRole = row.role;
  }
  for (const message of messages) {
    if (message.status === 'awaiting_approval' && !message.parts.some(isPending)) message.status = 'complete';
  }
  return messages;
}
