import { tourVisitSchema, type TourVisit, type TourVisitStatus } from '@trek/shared';
import { create } from 'zustand';
import { addListener, removeListener } from '../api/websocket';
import { tourVisitRepo } from '../repo/tourVisitRepo';
import type { WebSocketEvent } from '../types';
import { useAddonStore } from './addonStore';

/** A station's status on one day of its walk; a station not listed is planned. */
export type VisitsByStation = Readonly<Record<string, TourVisitStatus>>;

interface TourVisitState {
  /** The trip the visits are read for. */
  tripId: string | null;
  /** Per day assignment, the stations visited or skipped. */
  byAssignment: Readonly<Record<number, VisitsByStation>>;
  load: (tripId: number | string) => Promise<void>;
  /** Nothing known for this trip: its visits could not be read. */
  reset: (tripId: number | string) => void;
  /** Marks a station, at once on screen; a write the server refuses puts it back and throws. */
  mark: (
    tripId: number | string,
    assignmentId: number,
    stationKey: string,
    status: TourVisitStatus | 'planned'
  ) => Promise<void>;
  /** Another traveller marked a station: the day's visits as the server has them now, this device's waiting marks on top. */
  receive: (tripId: number | string, assignmentId: number, visits: readonly TourVisit[]) => Promise<void>;
  /** The day's visits as they are now. */
  applyRemote: (assignmentId: number, visits: readonly TourVisit[]) => void;
}

function byStation(visits: readonly TourVisit[]): VisitsByStation {
  return Object.fromEntries(visits.map((visit) => [visit.station_key, visit.status]));
}

function withStatus(day: VisitsByStation | undefined, key: string, status: TourVisitStatus | 'planned') {
  const next = { ...day };
  if (status === 'planned') delete next[key];
  else next[key] = status;
  return next;
}

/**
 * CW-03: how far each city walk got on its days, for the day plan's rows and
 * the walk's stations. Read once a trip opens and again when the connection
 * comes back, kept current by the trip's socket (watchTourVisits), and written
 * one station at a time, offline through the queue.
 */
export const useTourVisitStore = create<TourVisitState>((set, get) => ({
  tripId: null,
  byAssignment: {},
  load: async (tripId) => {
    const key = String(tripId);
    // Another trip's visits never show under this one, not even while it loads.
    if (get().tripId !== key) set({ tripId: key, byAssignment: {} });
    const { visits } = await tourVisitRepo.list(tripId);
    // A trip left meanwhile answers too late to count.
    if (get().tripId !== key) return;
    const grouped: Record<number, Record<string, TourVisitStatus>> = {};
    for (const visit of visits) (grouped[visit.assignment_id] ??= {})[visit.station_key] = visit.status;
    set({ byAssignment: grouped });
  },
  reset: (tripId) => set({ tripId: String(tripId), byAssignment: {} }),
  mark: async (tripId, assignmentId, stationKey, status) => {
    const before = get().byAssignment[assignmentId];
    set((state) => ({
      byAssignment: { ...state.byAssignment, [assignmentId]: withStatus(before, stationKey, status) },
    }));
    try {
      const { visits } = await tourVisitRepo.update(tripId, assignmentId, stationKey, { status });
      get().applyRemote(assignmentId, visits);
    } catch (failure) {
      set((state) => ({ byAssignment: { ...state.byAssignment, [assignmentId]: before ?? {} } }));
      throw failure;
    }
  },
  receive: async (tripId, assignmentId, visits) => {
    const day = await tourVisitRepo.received(tripId, assignmentId, visits).catch(() => {
      // The waiting marks could not be read: the server's list still beats an old one.
      return { visits };
    });
    if (get().tripId === String(tripId)) get().applyRemote(assignmentId, day.visits);
  },
  applyRemote: (assignmentId, visits) =>
    set((state) => ({ byAssignment: { ...state.byAssignment, [assignmentId]: byStation(visits) } })),
}));

/**
 * CW-03: the open trip's visits read again once the queue has replayed after
 * a reconnect, so a mark made offline that the server dropped or refused does
 * not stay on the day plan. Another trip's visits are left alone, and so is
 * every trip while the Tours addon is off. Visits that cannot be read show no
 * progress rather than an old one.
 */
export function reloadTourVisits(tripId: number | string): void {
  const key = String(tripId);
  if (useTourVisitStore.getState().tripId !== key || !useAddonStore.getState().isEnabled('tours')) return;
  useTourVisitStore
    .getState()
    .load(tripId)
    .catch(() => {
      if (useTourVisitStore.getState().tripId === key) useTourVisitStore.getState().reset(tripId);
    });
}

function isDayId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Keeps the store current with the trip's socket, so a station another
 * traveller checks off shows on every day plan at once. Only the visits that
 * read as visits count; an event that names no day or no list changes nothing.
 * Returns the function that stops listening.
 */
export function watchTourVisits(tripId: number | string): () => void {
  const onEvent = (event: WebSocketEvent) => {
    if (event?.type !== 'tours:visits' || String(event.tripId ?? '') !== String(tripId)) return;
    const { assignmentId, visits } = event;
    if (!isDayId(assignmentId) || !Array.isArray(visits)) return;
    const parsed = visits.flatMap((raw) => {
      const visit = tourVisitSchema.safeParse(raw);
      return visit.success ? [visit.data] : [];
    });
    void useTourVisitStore.getState().receive(tripId, assignmentId, parsed);
  };
  addListener(onEvent);
  return () => removeListener(onEvent);
}
