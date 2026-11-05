import {
  PLACE_CONTRIB_FIELDS,
  type PlaceContribField,
  type PlaceContribFieldSwitches,
  type PlaceContribState,
} from '@trek/shared';
import type { TranslationFn } from '../../types';

/** Every switch on: what the prompt proposes, and what an installation that never decided reads as. */
export const ALL_FIELDS_ON: PlaceContribFieldSwitches = {
  website: true,
  phone: true,
  email: true,
  opening_hours: true,
  description: true,
  image: true,
};

export const fieldLabel = (t: TranslationFn, field: PlaceContribField): string => t(`admin.contribute.field.${field}`);

/** The switches as a list, in the order the contract names the fields. */
export const fieldEntries = (switches: PlaceContribFieldSwitches): [PlaceContribField, boolean][] =>
  PLACE_CONTRIB_FIELDS.map((field) => [field, switches[field]]);

export type ContribStatus = 'active' | 'paused' | 'off' | 'unavailable';

/** Where sharing stands, as the pill beside the title says it. */
export function contribStatus(state: PlaceContribState): ContribStatus {
  if (!state.eligible) return 'unavailable';
  if (!state.active) return 'off';
  return state.pauseReason ? 'paused' : 'active';
}

/** The sentence under the title: why it cannot run, why it waits, or what it does. */
export function contribNote(t: TranslationFn, state: PlaceContribState): string {
  if (!state.eligible && state.ineligibleReason) return t(`admin.contribute.ineligible.${state.ineligibleReason}`);
  if (state.active && state.pauseReason) return t(`admin.contribute.pause.${state.pauseReason}`);
  return t(state.active ? 'admin.contribute.noteActive' : 'admin.contribute.noteOff');
}

/** The refusal a decision can meet, as the server names it in `reason`, or null for any other failure. */
export function refusalReason(err: unknown): string | null {
  const reason = (err as { response?: { data?: { reason?: unknown } } } | null)?.response?.data?.reason;
  return typeof reason === 'string' && reason ? reason : null;
}
