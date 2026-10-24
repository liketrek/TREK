import type { AssistantMessagePart } from '@trek/shared';

/**
 * The server's own tour steps as the model is told of them (P6, P7): a found
 * place the user took into a tour with "+ Tour", a route file read, a track
 * of it taken in. Like the booking file's notes in assistant-history.ts, in
 * plain words, since none of them is a call the model made.
 */

type ToolCallPart = Extract<AssistantMessagePart, { type: 'tool-call' }>;

function quoted(value: unknown): string {
  return `"${typeof value === 'string' && value !== '' ? value : '?'}"`;
}

/** What became of a decided change, in the words of what it was. */
function decided(part: ToolCallPart, what: string, done: string, waiting: string): string {
  if (part.approval?.approved === true) return part.isError ? `${what} could not be ${done}.` : `${what} was ${done}.`;
  if (part.approval?.approved === false) return `The user discarded ${what}.`;
  if (part.approval?.resolution) return `${what} was not ${done}; the user moved on without deciding.`;
  return waiting;
}

/** A found place the user took into a saved tour as a stop. */
export function tourStopOutcome(part: ToolCallPart): string {
  const stop = part.args.stop && typeof part.args.stop === 'object' ? (part.args.stop as Record<string, unknown>) : {};
  const what = `${quoted(stop.name)} as a stop of the tour ${quoted(part.args.tourName)}`;
  const waiting = `The user picked ${what} from the search results; it waits for them to add or discard it.`;
  return decided(part, what, 'added', waiting);
}

/** A route file read into its tracks. */
export function tourFileReadNote(part: ToolCallPart): string {
  const file = quoted(part.args.name);
  if (part.isError) return `TREK could not read the attached route file ${file}.`;
  const result = (part.result ?? {}) as { tracks?: unknown };
  const tracks = Array.isArray(result.tracks) ? result.tracks : [];
  if (tracks.length === 0) return `TREK read the attached route file ${file} and found no track or route in it.`;
  return `TREK read the attached route file ${file} and found ${tracks.length} track(s): ${JSON.stringify(tracks)}.`;
}

/** One track of a route file taken in as a hike. */
export function tourFileOutcome(part: ToolCallPart): string {
  const what = `The track ${quoted(part.args.track_name)} of ${quoted(part.args.file_name)}`;
  const waiting = `${what} waits for the user to take it in as a hike or discard it.`;
  return decided(part, what, 'taken in as a hike', waiting);
}
