import type { AiToolSpec } from '../ai-connections/ai-chat-client.interface';
import type { SettingsService } from '../settings/settings.service';
import { MAX_MEMORY_CHARS, tripMemoryOf } from './assistant-context';
import { REMEMBER_TOOL } from './assistant-tools.constants';
import type { ToolRun } from './assistant-tools.service';

/** The longest single note the model may keep. */
const MAX_NOTE_CHARS = 500;

/** How the model is offered the trip notes: one short fact per call, confirmed by the user like any change. */
export const REMEMBER_SPEC: AiToolSpec = {
  name: REMEMBER_TOOL,
  description:
    "Keep a fact or wish about this trip in the user's trip notes, which come along with every later conversation " +
    'about this trip (for example "we travel as two", "vegetarian", "no museums before 10"). Call it whenever the ' +
    'user asks you to remember something, instead of saying you cannot. The user confirms it like any change.',
  parameters: {
    type: 'object',
    properties: {
      note: {
        type: 'string',
        maxLength: MAX_NOTE_CHARS,
        description: "The fact as one short sentence, in the user's language.",
      },
    },
    required: ['note'],
    additionalProperties: false,
  },
};

/** The note a call carries, trimmed; null when there is none. */
export function noteOf(args: Record<string, unknown>): string | null {
  const note = typeof args.note === 'string' ? args.note.trim().slice(0, MAX_NOTE_CHARS) : '';
  return note || null;
}

/**
 * Adds the note to this trip's notes, below what is there. A note already
 * kept is not added twice; notes that would run past the limit are refused,
 * so nothing the user wrote is cut off.
 */
export async function rememberForTrip(
  settings: SettingsService,
  userId: number,
  tripId: number,
  args: Record<string, unknown>,
): Promise<ToolRun> {
  const note = noteOf(args);
  if (!note) return { ok: false, value: 'There is nothing to remember.' };
  const prefs = await settings.getUserSettings(userId);
  const current = tripMemoryOf(prefs, tripId);
  if (current?.split('\n').some((line) => line.trim() === note)) return { ok: true, value: { notes: current } };
  const next = current ? `${current}\n${note}` : note;
  if (next.length > MAX_MEMORY_CHARS) {
    return { ok: false, value: 'The trip notes are full. Ask the user to tidy them up in the chat menu first.' };
  }
  const all = prefs.assistant_memory && typeof prefs.assistant_memory === 'object' ? prefs.assistant_memory : {};
  await settings.upsertSetting(userId, 'assistant_memory', { ...all, [String(tripId)]: next });
  return { ok: true, value: { notes: next } };
}
