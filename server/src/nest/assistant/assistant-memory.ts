import type { AiToolSpec } from '../ai-connections/ai-chat-client.interface';
import type { SettingsService } from '../settings/settings.service';
import type { AgentToolPort } from './assistant-agent';
import { MAX_MEMORY_CHARS, tripMemoryOf } from './assistant-context';
import { REMEMBER_TOOL } from './assistant-tools.constants';
import type { ToolRun } from './assistant-tools.service';

/** The longest single note the model may keep. */
const MAX_NOTE_CHARS = 500;

/**
 * How the model is offered the trip notes: one short fact per call, kept at
 * once without a card (the chat shows it as kept, and the notes are the
 * user's to edit in the chat menu).
 */
export const REMEMBER_SPEC: AiToolSpec = {
  name: REMEMBER_TOOL,
  description:
    "Keep a fact or wish about this trip in the user's trip notes, which come along with every later conversation " +
    'about this trip (for example "we travel as two", "vegetarian", "no museums before 10", "Anna has a bad knee"). ' +
    'It is kept at once, without asking: call it on your own whenever the user tells you something that will ' +
    'matter for later suggestions on this trip (who travels, needs, likes and dislikes, budget, pace, fixed ' +
    'times), and whenever they ask you to remember something, instead of saying you cannot. Keep nothing ' +
    'that only matters for this one answer, nothing already in <trip_notes>, and nothing private beyond what the ' +
    'trip needs (no passport or card numbers). Say in a few words that you noted it.',
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

/**
 * The turn's tools with the trip notes kept at once: remember_for_trip runs
 * as a read (the loop carries on with its answer) through `remember`, every
 * other tool as the port has it. Without a trip the port stays as it is.
 */
export function rememberingPort(
  port: AgentToolPort,
  remember: ((args: Record<string, unknown>) => Promise<ToolRun>) | null,
): AgentToolPort {
  if (!remember) return port;
  return {
    specs: () => port.specs(),
    kindOf: (name) => (name === REMEMBER_TOOL && port.kindOf(name) !== null ? 'read' : port.kindOf(name)),
    pinArgs: (name, args) => (name === REMEMBER_TOOL ? { args } : port.pinArgs(name, args)),
    call: (name, args) => (name === REMEMBER_TOOL ? remember(args) : port.call(name, args)),
  };
}
