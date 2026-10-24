// FE-JRN-RECORDING-DAY-001 to FE-JRN-RECORDING-DAY-008
//
// JRN-01: taking one day's recorded route over, for the desktop dialog and the
// phone sheet alike. Nothing is kept before the button, what is kept is the
// preview that was shown, and a recording that changed in between is shown
// again instead of kept unseen.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRecordedDay, buildRecordingPreview } from '../../../tests/helpers/journeyRecording';
import { act, renderHook, waitFor } from '../../../tests/helpers/render';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { OnlineOnlyError } from '../../repo/onlineOnly';
import { useJourneyRecordingDay } from './useJourneyRecordingDay';

const repo = vi.hoisted(() => ({ preview: vi.fn(), save: vi.fn(), remove: vi.fn() }));
vi.mock('../../repo/journeyRecordingsRepo', () => ({ journeyRecordingsRepo: repo }));

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));

const HASH = 'a'.repeat(64);
const httpError = (code: string) => Object.assign(new Error(code), { response: { data: { error: code, code } } });

function setup() {
  const onKept = vi.fn();
  const onRemoved = vi.fn();
  const onClose = vi.fn();
  // Wrapped, so the strings are the English ones and not their keys.
  const view = renderHook(
    () => useJourneyRecordingDay({ journeyId: 7, date: '2026-05-14', onKept, onRemoved, onClose }),
    { wrapper: TranslationProvider }
  );
  return { ...view, onKept, onRemoved, onClose };
}

beforeEach(() => {
  for (const fn of [...Object.values(repo), ...Object.values(toast)]) fn.mockReset();
});

describe('useJourneyRecordingDay', () => {
  it('FE-JRN-RECORDING-DAY-001: reads the day in the zone Dawarich records in first, and offers to keep it', async () => {
    repo.preview.mockResolvedValue(buildRecordingPreview());
    const { result } = setup();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(repo.preview).toHaveBeenCalledWith(
      7,
      {
        date: '2026-05-14',
        utcOffsetMinutes: -new Date('2026-05-14T12:00:00').getTimezoneOffset(),
        useSourceOffset: true,
      },
      expect.any(AbortSignal)
    );
    expect(result.current.action).toBe('keep');
    expect(result.current.zone).toBe(120);
    expect(result.current.zoneOptions.find((o) => o.value === 120)?.badge).toBe('From Dawarich');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('FE-JRN-RECORDING-DAY-002: another zone reads the day again, cut in that zone', async () => {
    repo.preview.mockResolvedValue(buildRecordingPreview());
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));

    repo.preview.mockResolvedValue(buildRecordingPreview({ utcOffsetMinutes: -300, offsetSource: 'chosen' }));
    act(() => result.current.chooseZone(-300));
    await waitFor(() => expect(result.current.zone).toBe(-300));
    expect(repo.preview).toHaveBeenLastCalledWith(
      7,
      { date: '2026-05-14', utcOffsetMinutes: -300, useSourceOffset: false },
      expect.any(AbortSignal)
    );
  });

  it('FE-JRN-RECORDING-DAY-003: keeps what was previewed, in the zone it was cut in, then closes', async () => {
    repo.preview.mockResolvedValue(buildRecordingPreview());
    const day = buildRecordedDay();
    repo.save.mockResolvedValue({ day, outcome: 'created' });
    const { result, onKept, onClose } = setup();
    await waitFor(() => expect(result.current.action).toBe('keep'));

    await act(() => result.current.save());

    expect(repo.save).toHaveBeenCalledWith(7, '2026-05-14', { utcOffsetMinutes: 120, expectedHash: HASH });
    expect(onKept).toHaveBeenCalledWith(day);
    expect(toast.success).toHaveBeenCalledWith('Route kept in the journey');
    expect(onClose).toHaveBeenCalled();
  });

  it('FE-JRN-RECORDING-DAY-004: replaces a different kept version only through its own action, and keeps nothing twice', async () => {
    const stored = buildRecordedDay({ contentHash: 'b'.repeat(64) });
    repo.preview.mockResolvedValue(buildRecordingPreview({ stored }));
    repo.save.mockResolvedValue({ day: buildRecordedDay(), outcome: 'replaced' });
    const { result } = setup();
    await waitFor(() => expect(result.current.action).toBe('replace'));
    await act(() => result.current.save());
    expect(repo.save).toHaveBeenCalledWith(7, '2026-05-14', {
      utcOffsetMinutes: 120,
      expectedHash: HASH,
      replace: true,
    });

    repo.save.mockClear();
    repo.preview.mockResolvedValue(buildRecordingPreview({ stored: buildRecordedDay(), sameAsStored: true }));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.action).toBe('same'));
    await act(() => result.current.save());
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('FE-JRN-RECORDING-DAY-005: a recording that changed since the preview is read again and said so, not kept', async () => {
    repo.preview.mockResolvedValue(buildRecordingPreview());
    repo.save.mockRejectedValue(httpError('recording_changed'));
    const { result, onKept, onClose } = setup();
    await waitFor(() => expect(result.current.action).toBe('keep'));

    await act(() => result.current.save());

    expect(result.current.changedSincePreview).toBe(true);
    await waitFor(() => expect(repo.preview).toHaveBeenCalledTimes(2));
    expect(onKept).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('FE-JRN-RECORDING-DAY-008: a day someone else kept meanwhile is read again and offers Replace, not a Keep that fails', async () => {
    repo.preview.mockResolvedValue(buildRecordingPreview());
    repo.save.mockRejectedValue(httpError('recording_exists'));
    const { result, onKept, onClose } = setup();
    await waitFor(() => expect(result.current.action).toBe('keep'));

    repo.preview.mockResolvedValue(
      buildRecordingPreview({ stored: buildRecordedDay({ contentHash: 'b'.repeat(64) }) })
    );
    await act(() => result.current.save());

    expect(toast.error).toHaveBeenCalledWith('This journey already keeps another recording of that day.');
    await waitFor(() => expect(result.current.action).toBe('replace'));
    expect(repo.preview).toHaveBeenCalledTimes(2);
    expect(result.current.changedSincePreview).toBe(false);
    expect(onKept).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('FE-JRN-RECORDING-DAY-006: says why the day could not be read, and what was recorded nothing of has nothing to keep', async () => {
    repo.preview.mockRejectedValueOnce(httpError('not_connected'));
    const { result } = setup();
    await waitFor(() => expect(result.current.error).toBe('No Dawarich instance is connected yet.'));
    expect(result.current.action).toBeNull();

    repo.preview.mockResolvedValue(buildRecordingPreview({ contentHash: null, segments: [] }));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.action).toBe('empty'));
    expect(result.current.error).toBeNull();
  });

  it('FE-JRN-RECORDING-DAY-007: drops the kept day, and a failed drop or keep says why and stays open', async () => {
    repo.preview.mockResolvedValue(buildRecordingPreview({ stored: buildRecordedDay(), sameAsStored: true }));
    repo.remove.mockResolvedValueOnce(undefined);
    const { result, onRemoved, onClose } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.remove());
    expect(repo.remove).toHaveBeenCalledWith(7, '2026-05-14');
    expect(onRemoved).toHaveBeenCalledWith('2026-05-14');
    expect(onClose).toHaveBeenCalledTimes(1);

    repo.remove.mockRejectedValueOnce(new OnlineOnlyError());
    await act(() => result.current.remove());
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('connection'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
