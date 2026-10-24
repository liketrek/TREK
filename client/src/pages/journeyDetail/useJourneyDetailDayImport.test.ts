// FE-JRN-DETAIL-DAYIMPORT-001 to FE-JRN-DETAIL-DAYIMPORT-002
//
// JRN-02: which day of the journey is taken over with its stays, as the journey
// page and the phone screen wire it.
import { describe, expect, it, vi } from 'vitest';
import { buildRecordedDay } from '../../../tests/helpers/journeyRecording';
import { act, renderHook } from '../../../tests/helpers/render';
import { DAWARICH_TRAIL_COLOR } from '../../components/Map/dawarichTrail';
import { useJourneyDetailDayImport } from './useJourneyDetailDayImport';

function setup(journey: { id: number; title: string } | null = { id: 7, title: 'Venice' }) {
  const kept = buildRecordedDay();
  const args = {
    colorOf: (date: string) => (date === '2026-05-14' ? '#ff0055' : null),
    recordedDayOf: (date: string) => (date === '2026-05-14' ? kept : undefined),
    onKept: vi.fn(),
    onTakenOver: vi.fn(),
  };
  const view = renderHook(
    ({ j }) =>
      useJourneyDetailDayImport({
        loaded: true,
        journey: j,
        colorOfDay: args.colorOf,
        recordedDayOf: args.recordedDayOf,
        onKept: args.onKept,
        onTakenOver: args.onTakenOver,
      }),
    { initialProps: { j: journey } }
  );
  return { ...view, kept, args };
}

describe('useJourneyDetailDayImport', () => {
  it('FE-JRN-DETAIL-DAYIMPORT-001: opens a day in the colour of its pins with the route it keeps, and closes again', () => {
    const { result, kept, args } = setup();
    expect(result.current.dialog).toBeNull();

    act(() => result.current.open('2026-05-14'));
    expect(result.current.dialog).toMatchObject({
      journeyId: 7,
      journeyTitle: 'Venice',
      date: '2026-05-14',
      dayColor: '#ff0055',
      storedRoute: kept,
      onTakenOver: args.onTakenOver,
      onKept: args.onKept,
    });

    act(() => result.current.open('2026-05-15'));
    expect(result.current.dialog).toMatchObject({ dayColor: DAWARICH_TRAIL_COLOR, storedRoute: undefined });

    act(() => result.current.dialog?.onClose());
    expect(result.current.openDate).toBeNull();
  });

  it('FE-JRN-DETAIL-DAYIMPORT-002: a day opened on one journey does not open on the next', () => {
    const { result, rerender } = setup();
    act(() => result.current.open('2026-05-14'));
    rerender({ j: { id: 8, title: 'Lisbon' } });
    expect(result.current.dialog).toBeNull();
    rerender({ j: null });
    expect(result.current.dialog).toBeNull();
  });
});
