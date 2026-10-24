// FE-JRN-DAYIMPORT-001 to FE-JRN-DAYIMPORT-008
//
// JRN-02: taking a recorded day with its stays into the journal, for the
// desktop dialog and the phone sheet alike. Nothing is written before the
// button; a failed take-over reads the day again and keeps what was chosen;
// the route goes along only when asked, and a route that fails after the
// drafts keeps the dialog open to try the route alone.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDayStays, buildRecordedDay, buildRecordingPreview } from '../../../tests/helpers/journeyRecording';
import { act, renderHook, waitFor } from '../../../tests/helpers/render';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { localIsoDate } from '../../utils/localDate';
import { useJourneyDayImport } from './useJourneyDayImport';

const repo = vi.hoisted(() => ({
  reviewDay: vi.fn(),
  takeOverDay: vi.fn(),
  preview: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('../../repo/journeyRecordingsRepo', () => ({ journeyRecordingsRepo: repo }));

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));

const HASH = 'a'.repeat(64);
const httpError = (code: string) => Object.assign(new Error(code), { response: { data: { error: code, code } } });

function setup(over: { storedRoute?: ReturnType<typeof buildRecordedDay>; date?: string } = {}) {
  const onTakenOver = vi.fn();
  const onKept = vi.fn();
  const onClose = vi.fn();
  const view = renderHook(
    () =>
      useJourneyDayImport({
        journeyId: 7,
        date: over.date ?? '2026-05-14',
        dayColor: '#ff0055',
        storedRoute: over.storedRoute,
        onTakenOver,
        onKept,
        onClose,
      }),
    { wrapper: TranslationProvider }
  );
  return { ...view, onTakenOver, onKept, onClose };
}

beforeEach(() => {
  for (const fn of [...Object.values(repo), ...Object.values(toast)]) fn.mockReset();
  repo.reviewDay.mockResolvedValue(buildDayStays());
  repo.preview.mockResolvedValue(buildRecordingPreview());
  repo.takeOverDay.mockResolvedValue({
    entries: [{ id: 5, title: 'Piazza San Marco', stayCount: 2 }],
    alreadyTaken: [],
    skipped: [],
  });
});

describe('useJourneyDayImport', () => {
  it('FE-JRN-DAYIMPORT-001: reads the day, chooses its open stays, joins the same place twice and pins them in the day colour', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(repo.reviewDay).toHaveBeenCalledWith(7, '2026-05-14', expect.any(AbortSignal));
    expect(result.current.groups.map((g) => g.kind)).toEqual(['single', 'merged', 'single']);
    expect(result.current.problem).toBeNull();
    expect(result.current.mapEntries).toHaveLength(4);
    expect(result.current.mapEntries[0]).toMatchObject({ id: 'stay-10', dayColor: '#ff0055', dayLabel: 1 });
    expect(repo.takeOverDay).not.toHaveBeenCalled();
  });

  it('FE-JRN-DAYIMPORT-002: takes the chosen stays over, leaving the unchosen open one out, then reloads the journey and closes', async () => {
    const { result, onTakenOver, onClose } = setup();
    await waitFor(() => expect(result.current.choice).not.toBeNull());

    act(() => result.current.toggle(10));
    await act(async () => result.current.submit());

    expect(repo.takeOverDay).toHaveBeenCalledWith(7, '2026-05-14', {
      groups: [
        {
          kind: 'merged',
          stays: [{ suggestionId: 11 }, { suggestionId: 12 }],
          title: 'Piazza San Marco',
          anchorSuggestionId: 12,
        },
        { kind: 'single', stays: [{ suggestionId: 13 }] },
      ],
      skipSuggestionIds: [10],
    });
    expect(toast.success).toHaveBeenCalledWith('1 draft taken over');
    expect(onTakenOver).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('FE-JRN-DAYIMPORT-003: a failed take-over says nothing was taken over, reads the day again and keeps the names given', async () => {
    const { result, onTakenOver, onClose } = setup();
    await waitFor(() => expect(result.current.choice).not.toBeNull());
    repo.takeOverDay.mockRejectedValue(httpError('stay_not_on_day'));
    const stays = buildDayStays().stays;

    act(() => result.current.rename(stays[3] as (typeof stays)[number], 'Ponte di Rialto'));
    await act(async () => result.current.submit());

    await waitFor(() => expect(repo.reviewDay).toHaveBeenCalledTimes(2));
    expect(result.current.outcome?.kind).toBe('failed');
    expect(result.current.choice?.names).toEqual({ 13: 'Ponte di Rialto' });
    expect(onTakenOver).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('FE-JRN-DAYIMPORT-004: the route goes along only when switched on, kept as previewed', async () => {
    const { result, onKept, onClose } = setup();
    await waitFor(() => expect(result.current.route.offer).toBe('keep'));
    repo.save.mockResolvedValue({ day: buildRecordedDay(), outcome: 'created' });

    act(() => result.current.route.toggle());
    await act(async () => result.current.submit());

    expect(repo.save).toHaveBeenCalledWith(7, '2026-05-14', { utcOffsetMinutes: 120, expectedHash: HASH });
    expect(onKept).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-JRN-DAYIMPORT-005: a route that fails after the drafts keeps the dialog open to keep the route alone', async () => {
    const { result, onTakenOver, onClose } = setup();
    await waitFor(() => expect(result.current.route.offer).toBe('keep'));
    repo.save.mockRejectedValueOnce(httpError('recording_changed'));

    act(() => result.current.route.toggle());
    await act(async () => result.current.submit());

    expect(onTakenOver).toHaveBeenCalledTimes(1);
    expect(result.current.outcome?.kind).toBe('route');
    expect(onClose).not.toHaveBeenCalled();

    repo.save.mockResolvedValue({ day: buildRecordedDay(), outcome: 'created' });
    await act(async () => result.current.retryRoute());
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(repo.takeOverDay).toHaveBeenCalledTimes(1);
  });

  it('FE-JRN-DAYIMPORT-006: a day whose route is kept offers no second copy, and stays held already are announced', async () => {
    repo.takeOverDay.mockResolvedValue({ entries: [], alreadyTaken: [11, 12], skipped: [] });
    const { result } = setup({ storedRoute: buildRecordedDay() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.route.offer).toBe('kept'));

    await act(async () => result.current.submit());

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith('2 stays were taken over already. Nothing was written twice.');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('FE-JRN-DAYIMPORT-007: nothing chosen holds the take-over back, and a review that fails says why', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.choice).not.toBeNull());
    act(() => {
      for (const id of [10, 11, 12, 13]) result.current.toggle(id);
    });
    expect(result.current.problem).toBe('nothing');
    await act(async () => result.current.submit());
    expect(repo.takeOverDay).not.toHaveBeenCalled();

    repo.reviewDay.mockRejectedValue(httpError('unreachable'));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it('FE-JRN-DAYIMPORT-008: today is marked as still running, a past day is not (JRN-03)', async () => {
    const past = setup();
    await waitFor(() => expect(past.result.current.loading).toBe(false));
    expect(past.result.current.running).toBe(false);
    past.unmount();

    const today = setup({ date: localIsoDate() });
    await waitFor(() => expect(today.result.current.loading).toBe(false));
    expect(today.result.current.running).toBe(true);
  });
});
