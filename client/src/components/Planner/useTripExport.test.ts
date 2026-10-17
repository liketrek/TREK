// FE-PLANNER-TRIPEXPORT-001 to -010: the trip exports behind the desktop export
// dialog and the phone's export sheet.
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

import { buildAssignment, buildReservation, buildTrip, buildUser } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useAuthStore } from '../../store/authStore';
import type { DayNote } from '../../types';
import { downloadTripPDF } from '../PDF/TripPDF';
import { flatDayNotes, saveBlob, useTripExport, type TripExportOptions } from './useTripExport';

vi.mock('../PDF/TripPDF', () => ({ downloadTripPDF: vi.fn() }));

const t = (key: string) => key;
const trip = buildTrip({ id: 3, title: 'Alps' });
const NOTES = { '7': [{ id: 1, text: 'Pack' }] as unknown as DayNote[] };

function options(overrides: Partial<TripExportOptions> = {}): TripExportOptions {
  return {
    tripId: 3,
    data: { trip, days: [], places: [], assignments: {}, categories: [], reservations: [], dayNotes: NOTES },
    t,
    locale: 'en-US',
    toast: { error: vi.fn(), info: vi.fn() },
    exclusive: true,
    onExported: vi.fn(),
    requireTrip: false,
    closeAfterPdf: true,
    logPdfErrors: true,
    ...overrides,
  };
}

/** How the phone sheet runs the hook. */
const PHONE: Partial<TripExportOptions> = {
  exclusive: false,
  requireTrip: true,
  closeAfterPdf: false,
  logPdfErrors: false,
};

const response = (status: number) =>
  ({ ok: status >= 200 && status < 300, status, blob: async () => new Blob(['x']) }) as unknown as Response;

/** A promise the test settles by hand, to look at the hook while an export runs. */
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

let fetchSpy: MockInstance<typeof fetch>;
let clickSpy: MockInstance<() => void>;

beforeEach(() => {
  resetAllStores();
  vi.mocked(downloadTripPDF).mockReset().mockResolvedValue(undefined);
  fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response(200));
  clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:trek/file');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('flatDayNotes and saveBlob', () => {
  it('FE-PLANNER-TRIPEXPORT-001: the day notes come as one list that names each day', () => {
    expect(flatDayNotes({ '2': [{ id: 1 }, { id: 2 }] as DayNote[], '5': [{ id: 3 }] as DayNote[] })).toEqual([
      { id: 1, day_id: 2 },
      { id: 2, day_id: 2 },
      { id: 3, day_id: 5 },
    ]);
  });

  it('FE-PLANNER-TRIPEXPORT-002: a file is handed over under its name and its URL let go a moment later', () => {
    vi.useFakeTimers();
    saveBlob(new Blob(['x']), 'Alps.ics');
    const anchor = clickSpy.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('Alps.ics');
    expect(anchor.getAttribute('href')).toBe('blob:trek/file');
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:trek/file');
    expect(document.body.contains(anchor)).toBe(false);
  });
});

describe('useTripExport', () => {
  it('FE-PLANNER-TRIPEXPORT-003: names the files after the trip and offers my plan once somebody has a part', () => {
    expect(renderHook(() => useTripExport(options())).result.current).toMatchObject({
      fileBase: 'Alps',
      offerMine: false,
    });
    const untitled = options({ data: { ...options().data, trip: null } });
    expect(renderHook(() => useTripExport(untitled)).result.current.fileBase).toBe('trip');

    seedStore(useAuthStore, { user: buildUser({ id: 9 }) });
    const shared = options({
      data: { ...options().data, reservations: [buildReservation({ travelers: [{ user_id: 9, username: 'me' }] })] },
    });
    expect(renderHook(() => useTripExport(shared)).result.current.offerMine).toBe(true);
    const assigned = options({
      data: {
        ...options().data,
        assignments: { '1': [buildAssignment({ participants: [{ user_id: 9, username: 'me' }] })] },
      },
    });
    expect(renderHook(() => useTripExport(assigned)).result.current.offerMine).toBe(true);
  });

  it('FE-PLANNER-TRIPEXPORT-004: the PDF gets the whole plan, or only mine, and the desktop closes once it is out', async () => {
    seedStore(useAuthStore, { user: buildUser({ id: 9 }) });
    const opts = options();
    const { result } = renderHook(() => useTripExport(opts));
    await act(() => result.current.exportPdf());
    expect(downloadTripPDF).toHaveBeenCalledWith(
      expect.objectContaining({
        trip,
        dayNotes: [{ id: 1, text: 'Pack', day_id: 7 }],
        locale: 'en-US',
        onlyUserId: undefined,
      })
    );
    expect(opts.onExported).toHaveBeenCalledTimes(1);
    await act(() => result.current.exportPdf(true));
    expect(vi.mocked(downloadTripPDF).mock.calls[1][0]).toMatchObject({ onlyUserId: 9 });
  });

  it('FE-PLANNER-TRIPEXPORT-005: the phone stays open after the PDF and prints nothing without a trip', async () => {
    const opts = options(PHONE);
    const { result } = renderHook(() => useTripExport(opts));
    await act(() => result.current.exportPdf());
    expect(downloadTripPDF).toHaveBeenCalledTimes(1);
    expect(opts.onExported).not.toHaveBeenCalled();

    const noTrip = renderHook(() => useTripExport({ ...opts, data: { ...opts.data, trip: null } })).result;
    await act(() => noTrip.current.exportPdf());
    expect(downloadTripPDF).toHaveBeenCalledTimes(1);
  });

  it('FE-PLANNER-TRIPEXPORT-006: a failed PDF says why; only the desktop also logs it', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(downloadTripPDF).mockRejectedValue(new Error('font missing'));
    const desktop = options();
    const d = renderHook(() => useTripExport(desktop)).result;
    await act(() => d.current.exportPdf());
    expect(desktop.toast.error).toHaveBeenCalledWith('dayplan.pdfError: font missing');
    expect(desktop.onExported).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledTimes(1);

    vi.mocked(downloadTripPDF).mockRejectedValue('renderer gone');
    const phone = options(PHONE);
    const p = renderHook(() => useTripExport(phone)).result;
    await act(() => p.current.exportPdf());
    expect(phone.toast.error).toHaveBeenCalledWith('dayplan.pdfError: renderer gone');
    expect(log).toHaveBeenCalledTimes(1);
  });

  it('FE-PLANNER-TRIPEXPORT-007: on the desktop one running export holds every other', async () => {
    const pdf = deferred();
    vi.mocked(downloadTripPDF).mockReturnValue(pdf.promise);
    const { result } = renderHook(() => useTripExport(options()));
    let running!: Promise<void>;
    act(() => {
      running = result.current.exportPdf();
    });
    await vi.waitFor(() => expect(downloadTripPDF).toHaveBeenCalled());
    expect(result.current.isRunning('pdf')).toBe(true);
    expect(result.current.isRunning('pdf:mine')).toBe(false);
    expect(result.current.anyRunning).toBe(true);
    await act(() => result.current.downloadIcs());
    expect(fetchSpy).not.toHaveBeenCalled();
    await act(async () => {
      pdf.resolve();
      await running;
    });
    expect(result.current.anyRunning).toBe(false);
  });

  it('FE-PLANNER-TRIPEXPORT-008: on the phone a running PDF holds only another PDF', async () => {
    const pdf = deferred();
    vi.mocked(downloadTripPDF).mockReturnValue(pdf.promise);
    const opts = options(PHONE);
    const { result } = renderHook(() => useTripExport(opts));
    let running!: Promise<void>;
    act(() => {
      running = result.current.exportPdf();
    });
    await vi.waitFor(() => expect(downloadTripPDF).toHaveBeenCalledTimes(1));
    await act(() => result.current.exportPdf(true));
    expect(downloadTripPDF).toHaveBeenCalledTimes(1);
    await act(() => result.current.downloadIcs());
    expect(fetchSpy).toHaveBeenCalledWith('/api/trips/3/export.ics', { credentials: 'include' });
    expect(opts.onExported).toHaveBeenCalledTimes(1);
    expect(result.current.isRunning('pdf')).toBe(true);
    await act(async () => {
      pdf.resolve();
      await running;
    });
    expect(result.current.isRunning('pdf')).toBe(false);
  });

  it('FE-PLANNER-TRIPEXPORT-009: the calendar file is saved under the trip title, and a refusal says so', async () => {
    const opts = options();
    const { result } = renderHook(() => useTripExport(opts));
    await act(() => result.current.downloadIcs());
    expect((clickSpy.mock.contexts[0] as HTMLAnchorElement).download).toBe('Alps.ics');
    expect(opts.onExported).toHaveBeenCalledTimes(1);

    fetchSpy.mockResolvedValue(response(500));
    await act(() => result.current.downloadIcs());
    expect(opts.toast.error).toHaveBeenCalledWith('planner.icsExportFailed');
    expect(opts.onExported).toHaveBeenCalledTimes(1);
  });

  it('FE-PLANNER-TRIPEXPORT-010: a GPX scope asks for its own query; an empty one and a broken one say so apart', async () => {
    const opts = options();
    const { result } = renderHook(() => useTripExport(opts));
    await act(() => result.current.downloadGpx('places', '?dayRoutes=false'));
    expect(fetchSpy).toHaveBeenCalledWith('/api/trips/3/places/export.gpx?dayRoutes=false', { credentials: 'include' });
    expect((clickSpy.mock.contexts[0] as HTMLAnchorElement).download).toBe('Alps.gpx');
    expect(opts.onExported).toHaveBeenCalledTimes(1);

    fetchSpy.mockResolvedValue(response(404));
    await act(() => result.current.downloadGpx('all', ''));
    expect(opts.toast.info).toHaveBeenCalledWith('dayplan.gpxEmpty');
    expect(opts.toast.error).not.toHaveBeenCalled();

    fetchSpy.mockRejectedValue(new Error('offline'));
    await act(() => result.current.downloadGpx('all', ''));
    expect(opts.toast.error).toHaveBeenCalledWith('dayplan.gpxFailed');
    expect(opts.onExported).toHaveBeenCalledTimes(1);
    expect(result.current.anyRunning).toBe(false);
  });
});
