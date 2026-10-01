// FE-PLANNER-RECLINKS-001 to FE-PLANNER-RECLINKS-017
import type { ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { renderHook, act, waitFor } from '@testing-library/react';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildBudgetItem, buildTrip, buildTripFile, buildUser } from '../../../tests/helpers/factories';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { usePermissionsStore } from '../../store/permissionsStore';
import { useExpenseLinks, useFileLinker, useReservationFiles } from './useRecordLinks';

const wrapper = ({ children }: { children: ReactNode }) => <TranslationProvider>{children}</TranslationProvider>;

let addToast: ReturnType<typeof vi.fn>;

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { user: buildUser({ id: 1 }), isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1, user_id: 1 }) });
  addToast = vi.fn();
  window.__addToast = addToast as unknown as typeof window.__addToast;
});

afterEach(() => {
  delete window.__addToast;
});

/** Captures the body of every expense update the hook sends. */
function captureBudgetPuts() {
  const bodies: { id: string; body: Record<string, unknown> }[] = [];
  server.use(
    http.put('/api/trips/1/budget/:itemId', async ({ params, request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      bodies.push({ id: String(params.itemId), body });
      const current = useTripStore.getState().budgetItems.find(i => i.id === Number(params.itemId));
      return HttpResponse.json({ item: { ...current, ...body } });
    }),
    http.get('/api/trips/1/reservations', () => HttpResponse.json({ reservations: [] })),
  );
  return bodies;
}

describe('useExpenseLinks', () => {
  const onBooking = buildBudgetItem({ id: 11, trip_id: 1, name: 'Flight', reservation_id: 9 });
  const upgrade = buildBudgetItem({ id: 12, trip_id: 1, name: 'Seat upgrade', reservation_id: 9 });
  const onOtherBooking = buildBudgetItem({ id: 13, trip_id: 1, name: 'Train', reservation_id: 10 });
  const onPlace = buildBudgetItem({ id: 14, trip_id: 1, name: 'Museum', place_id: 4 });
  const loose = buildBudgetItem({ id: 15, trip_id: 1, name: 'Souvenirs' });

  beforeEach(() => {
    seedStore(useTripStore, { budgetItems: [onBooking, upgrade, onOtherBooking, onPlace, loose] });
  });

  it('FE-PLANNER-RECLINKS-001: a booking sees every expense linked to it, and only the unlinked ones as candidates', () => {
    const { result } = renderHook(() => useExpenseLinks(9), { wrapper });
    expect(result.current.targetId).toBe(9);
    expect(result.current.linked.map(i => i.id)).toEqual([11, 12]);
    // Linked to another booking or to a place counts as taken.
    expect(result.current.unlinked.map(i => i.id)).toEqual([15]);
  });

  it('FE-PLANNER-RECLINKS-002: a place sees the expenses on its place_id', () => {
    const { result } = renderHook(() => useExpenseLinks(null, 4), { wrapper });
    expect(result.current.targetId).toBe(4);
    expect(result.current.linked.map(i => i.id)).toEqual([14]);
    expect(result.current.unlinked.map(i => i.id)).toEqual([15]);
  });

  it('FE-PLANNER-RECLINKS-003: an unsaved record has no target, nothing linked and a link that does nothing', async () => {
    const bodies = captureBudgetPuts();
    const { result } = renderHook(() => useExpenseLinks(undefined, null), { wrapper });
    expect(result.current.targetId).toBeNull();
    expect(result.current.linked).toEqual([]);
    expect(result.current.unlinked.map(i => i.id)).toEqual([15]);
    await act(async () => { await result.current.link(loose); });
    expect(bodies).toEqual([]);
  });

  it('FE-PLANNER-RECLINKS-004: link sets the reservation_id of the picked expense', async () => {
    const bodies = captureBudgetPuts();
    const { result } = renderHook(() => useExpenseLinks(9), { wrapper });
    await act(async () => { await result.current.link(loose); });
    expect(bodies).toEqual([{ id: '15', body: { reservation_id: 9 } }]);
    await waitFor(() => expect(result.current.linked.map(i => i.id)).toEqual([11, 12, 15]));
    expect(result.current.unlinked).toEqual([]);
  });

  it('FE-PLANNER-RECLINKS-005: on a place, link sets the place_id instead', async () => {
    const bodies = captureBudgetPuts();
    const { result } = renderHook(() => useExpenseLinks(null, 4), { wrapper });
    await act(async () => { await result.current.link(loose); });
    expect(bodies).toEqual([{ id: '15', body: { place_id: 4 } }]);
  });

  it('FE-PLANNER-RECLINKS-006: unlink clears the link and keeps the expense', async () => {
    const bodies = captureBudgetPuts();
    const { result } = renderHook(() => useExpenseLinks(9), { wrapper });
    await act(async () => { await result.current.unlink(upgrade); });
    expect(bodies).toEqual([{ id: '12', body: { reservation_id: null } }]);
    await waitFor(() => expect(result.current.linked.map(i => i.id)).toEqual([11]));
    expect(useTripStore.getState().budgetItems.some(i => i.id === 12)).toBe(true);
  });

  it('FE-PLANNER-RECLINKS-007: unlinking from a place clears the place_id', async () => {
    const bodies = captureBudgetPuts();
    const { result } = renderHook(() => useExpenseLinks(null, 4), { wrapper });
    await act(async () => { await result.current.unlink(onPlace); });
    expect(bodies).toEqual([{ id: '14', body: { place_id: null } }]);
  });

  it('FE-PLANNER-RECLINKS-008: a failing update is reported instead of thrown', async () => {
    server.use(http.put('/api/trips/1/budget/15', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));
    const { result } = renderHook(() => useExpenseLinks(9), { wrapper });
    await act(async () => { await result.current.link(loose); });
    expect(addToast).toHaveBeenCalledWith('Unknown error', 'error', undefined);
    expect(useTripStore.getState().budgetItems.find(i => i.id === 15)?.reservation_id).toBeUndefined();
  });

  it('FE-PLANNER-RECLINKS-009: without a trip loaded nothing is sent', async () => {
    const bodies = captureBudgetPuts();
    seedStore(useTripStore, { trip: null });
    const { result } = renderHook(() => useExpenseLinks(9), { wrapper });
    await act(async () => { await result.current.unlink(onBooking); });
    expect(bodies).toEqual([]);
    expect(addToast).not.toHaveBeenCalled();
  });
});

describe('useFileLinker', () => {
  it('FE-PLANNER-RECLINKS-010: links the file, reloads the trip files and resolves true', async () => {
    let body: unknown = null;
    const linked = buildTripFile({ id: 21, trip_id: 1, linked_reservation_ids: [9] });
    server.use(
      http.post('/api/trips/1/files/21/link', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      }),
      http.get('/api/trips/1/files', () => HttpResponse.json({ files: [linked] })),
    );
    const { result } = renderHook(() => useFileLinker(), { wrapper });
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current(21, { reservation_id: 9 }); });
    expect(ok).toBe(true);
    expect(body).toEqual({ reservation_id: 9 });
    expect(useTripStore.getState().files.map(f => f.id)).toEqual([21]);
  });

  it('FE-PLANNER-RECLINKS-011: a failing link is reported and resolves false', async () => {
    server.use(http.post('/api/trips/1/files/22/link', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));
    const { result } = renderHook(() => useFileLinker(), { wrapper });
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current(22, { place_id: 4 }); });
    expect(ok).toBe(false);
    expect(addToast).toHaveBeenCalledWith('Failed to update', 'error', undefined);
  });

  it('FE-PLANNER-RECLINKS-012: without a trip it resolves false and sends nothing', async () => {
    let called = false;
    server.use(http.post('/api/trips/:id/files/:fileId/link', () => {
      called = true;
      return HttpResponse.json({ success: true });
    }));
    seedStore(useTripStore, { trip: null });
    const { result } = renderHook(() => useFileLinker(), { wrapper });
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current(23, { reservation_id: 9 }); });
    expect(ok).toBe(false);
    expect(called).toBe(false);
  });
});

describe('useReservationFiles', () => {
  const own = buildTripFile({ id: 31, trip_id: 1, original_name: 'own.pdf', reservation_id: 9 });
  // The id arrives as text from some paths; it still counts as this booking's.
  const ownAsText = buildTripFile({ id: 32, trip_id: 1, original_name: 'text-id.pdf', reservation_id: '9' as unknown as number });
  const viaLink = buildTripFile({ id: 33, trip_id: 1, original_name: 'linked.pdf', linked_reservation_ids: [9] });
  const other = buildTripFile({ id: 34, trip_id: 1, original_name: 'other.pdf', reservation_id: 10 });
  const loose = buildTripFile({ id: 35, trip_id: 1, original_name: 'loose.pdf' });
  const trashed = buildTripFile({ id: 36, trip_id: 1, original_name: 'trashed.pdf', reservation_id: 9, deleted_at: '2025-02-01T00:00:00.000Z' });

  beforeEach(() => {
    seedStore(useTripStore, { files: [own, ownAsText, viaLink, other, loose, trashed] });
  });

  it('FE-PLANNER-RECLINKS-013: attached are the live files on the booking, directly or through a link row', () => {
    const { result } = renderHook(() => useReservationFiles(9), { wrapper });
    expect(result.current.attached.map(f => f.id)).toEqual([31, 32, 33]);
    // Everything else that is not in the trash can be linked.
    expect(result.current.linkable.map(f => f.id)).toEqual([34, 35]);
  });

  it('FE-PLANNER-RECLINKS-014: nothing is linkable without the file_edit right', () => {
    seedStore(useAuthStore, { user: buildUser({ id: 2 }) });
    seedStore(usePermissionsStore, { permissions: { file_edit: 'trip_owner' } });
    const { result } = renderHook(() => useReservationFiles(9), { wrapper });
    expect(result.current.attached.map(f => f.id)).toEqual([31, 32, 33]);
    expect(result.current.linkable).toEqual([]);
  });

  it('FE-PLANNER-RECLINKS-015: an unsaved booking has no files and links nothing', async () => {
    let called = false;
    server.use(http.post('/api/trips/:id/files/:fileId/link', () => {
      called = true;
      return HttpResponse.json({ success: true });
    }));
    const { result } = renderHook(() => useReservationFiles(null), { wrapper });
    expect(result.current.attached).toEqual([]);
    expect(result.current.linkable).toEqual([]);
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.link(loose); });
    expect(ok).toBe(false);
    expect(called).toBe(false);
  });

  it('FE-PLANNER-RECLINKS-016: link attaches a trip file to this booking', async () => {
    let body: unknown = null;
    server.use(
      http.post('/api/trips/1/files/35/link', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      }),
      http.get('/api/trips/1/files', () => HttpResponse.json({ files: [{ ...loose, linked_reservation_ids: [9] }] })),
    );
    const { result } = renderHook(() => useReservationFiles(9), { wrapper });
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.link(loose); });
    expect(ok).toBe(true);
    expect(body).toEqual({ reservation_id: 9 });
    await waitFor(() => expect(result.current.attached.map(f => f.id)).toEqual([35]));
  });

  it('FE-PLANNER-RECLINKS-017: an empty store is read as no files at all', () => {
    seedStore(useTripStore, { files: undefined as never });
    const { result } = renderHook(() => useReservationFiles(9), { wrapper });
    expect(result.current.attached).toEqual([]);
    expect(result.current.linkable).toEqual([]);
  });
});
