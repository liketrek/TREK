/**
 * The trip notes the assistant keeps: a note goes below what is there, the
 * same note is not added twice, notes that would run past the limit are
 * refused whole, and other trips' notes stay as they are.
 */
import { noteOf, REMEMBER_SPEC, rememberForTrip } from '../../../../src/nest/assistant/assistant-memory';
import type { SettingsService } from '../../../../src/nest/settings/settings.service';

import { describe, expect, it, vi } from 'vitest';

function settingsWith(prefs: Record<string, unknown>) {
  const upsertSetting = vi.fn(async () => undefined);
  const settings = { getUserSettings: vi.fn(async () => prefs), upsertSetting } as unknown as SettingsService;
  return { settings, upsertSetting };
}

describe('the trip notes', () => {
  it('ASTMEM-001: a note goes below the trip notes there are, and other trips keep theirs', async () => {
    const { settings, upsertSetting } = settingsWith({ assistant_memory: { '4': 'Vegetarian', '9': 'Other trip' } });
    const run = await rememberForTrip(settings, 1, 4, { note: '  We travel as two.  ' });
    expect(run).toEqual({ ok: true, value: { notes: 'Vegetarian\nWe travel as two.' } });
    expect(upsertSetting).toHaveBeenCalledWith(1, 'assistant_memory', {
      '4': 'Vegetarian\nWe travel as two.',
      '9': 'Other trip',
    });
  });

  it('ASTMEM-002: the first note starts them, and a note kept already is not added again', async () => {
    const first = settingsWith({});
    expect(await rememberForTrip(first.settings, 1, 4, { note: 'No museums' })).toEqual({
      ok: true,
      value: { notes: 'No museums' },
    });
    expect(first.upsertSetting).toHaveBeenCalledWith(1, 'assistant_memory', { '4': 'No museums' });

    const again = settingsWith({ assistant_memory: { '4': 'No museums' } });
    expect((await rememberForTrip(again.settings, 1, 4, { note: 'No museums' })).ok).toBe(true);
    expect(again.upsertSetting).not.toHaveBeenCalled();
  });

  it('ASTMEM-003: nothing to keep, or no room left, is refused and writes nothing', async () => {
    const empty = settingsWith({});
    expect(await rememberForTrip(empty.settings, 1, 4, { note: '   ' })).toMatchObject({ ok: false });
    const full = settingsWith({ assistant_memory: { '4': 'x'.repeat(1_990) } });
    expect(await rememberForTrip(full.settings, 1, 4, { note: 'One more thing to keep' })).toMatchObject({
      ok: false,
    });
    expect(empty.upsertSetting).not.toHaveBeenCalled();
    expect(full.upsertSetting).not.toHaveBeenCalled();
  });

  it('ASTMEM-004: the note is read trimmed and capped, and the model is offered one short sentence', () => {
    expect(noteOf({ note: 42 })).toBeNull();
    expect(noteOf({ note: 'y'.repeat(600) })).toHaveLength(500);
    expect(REMEMBER_SPEC.parameters).toMatchObject({ required: ['note'], additionalProperties: false });
  });
});
