import { useState } from 'react';

import type { Day, Reservation } from '../../types';
import { usesStationRoute } from '../../utils/flightLegs';
import { toggledTraveler } from './bookingFormModel';
import {
  blankTransportRoute,
  buildTransportPayload,
  type CarStopForm,
  emptyStationWaypoint,
  emptyWaypoint,
  type EndpointPick,
  readTransportMeta,
  type RouteSeedOptions,
  seedTransportRoute,
  type StationWaypointForm,
  type TransportFields,
  transportFieldsFrom,
  type TransportMetaFields,
  type TransportPayloadOptions,
  type TransportRoute,
  type TransportType,
  transportTypeOf,
  type WaypointForm,
} from './transportEndpoints';

export interface TransportSeedOptions<F extends TransportFields> extends RouteSeedOptions {
  /** The type a saved booking of an unknown type opens as. */
  fallbackType: TransportType;
  /** The day a new booking starts on. */
  dayId: string | number;
  /** The fields a shell keeps beyond the shared ones, read from the saved booking. */
  extraFields?: (src: Reservation, meta: TransportMetaFields) => Omit<F, keyof TransportFields>;
}

/**
 * The transport booking form behind the desktop TransportModal and the phone's
 * transport sheet: the fields, the route rows (flight airports, train or cruise
 * stations, a car's stops), the travellers and the files picked before saving.
 * Each shell decides when to seed it and what to do around a save.
 */
export function useTransportForm<F extends TransportFields>(emptyForm: F) {
  const [form, setForm] = useState<F>({ ...emptyForm });
  // Trains and cruises share the station form: a row of stops, each with its own
  // arrival and departure (#1807).
  const stationRoute = usesStationRoute(form.type);
  // Manual vs Automated (public transit search) creation mode (#1065).
  const [automated, setAutomated] = useState(false);
  const [fromPick, setFromPick] = useState<EndpointPick>({});
  const [toPick, setToPick] = useState<EndpointPick>({});
  const [waypoints, setWaypoints] = useState<WaypointForm[]>([emptyWaypoint(), emptyWaypoint()]);
  const [trainWaypoints, setTrainWaypoints] = useState<StationWaypointForm[]>([
    emptyStationWaypoint(),
    emptyStationWaypoint(),
  ]);
  // A car keeps its pick-up and return as the frame of the rental and gains the stops
  // in between (#1797): one booking, one continuous drive, several places along it.
  const [carStops, setCarStops] = useState<CarStopForm[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  // Travelers assigned to this booking (#1517), seeded on open and persisted after the save.
  const [travelerIds, setTravelerIds] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const set = (field: keyof F, value: string | number) => setForm((prev) => ({ ...prev, [field]: value }));

  /** Swaps a stop with its neighbour. Purely local: `sequence` is derived on save. */
  const moveCarStop = (index: number, delta: number): void => {
    setCarStops((prev) => {
      const to = index + delta;
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  };

  const toggleTraveler = (id: number) => setTravelerIds((prev) => toggledTraveler(prev, id));

  const applyRoute = (route: TransportRoute) => {
    if (route.waypoints) setWaypoints(route.waypoints);
    if (route.trainWaypoints) setTrainWaypoints(route.trainWaypoints);
    if (route.fromPick) setFromPick(route.fromPick);
    if (route.toPick) setToPick(route.toPick);
    if (route.carStops) setCarStops(route.carStops);
  };

  /**
   * Fills the form from a saved booking or an import prefill, or empties it for a
   * new booking on `opts.dayId`. The fields, the type and the route rows; the shell
   * seeds the travellers, the files and the mode itself.
   */
  const seed = (src: Reservation | null, days: Day[], opts: TransportSeedOptions<F>) => {
    if (src) {
      const meta = readTransportMeta(src);
      const type = transportTypeOf(src.type, opts.fallbackType);
      setForm({ ...transportFieldsFrom(src, days, type), ...opts.extraFields?.(src, meta) } as F);
      applyRoute(seedTransportRoute(src, meta, type, days, opts));
    } else {
      setForm({ ...emptyForm, start_day_id: opts.dayId, end_day_id: opts.dayId });
      applyRoute(blankTransportRoute(opts.dayId));
    }
  };

  /** The request body for what the form holds now. */
  const payload = (days: Day[], opts: TransportPayloadOptions) =>
    buildTransportPayload({ form, waypoints, trainWaypoints, fromPick, toPick, carStops }, days, opts);

  // The per-leg booking code is only offered where the save actually writes
  // metadata.legs: the same condition, over the waypoints that become endpoints,
  // not over the raw rows. Anywhere else the value would vanish on save (#1943).
  const writesFlightLegs = waypoints.filter((w) => w.airport).length > 2;
  const writesTrainLegs = trainWaypoints.filter((w) => w.location).length > 2;

  return {
    form,
    setForm,
    set,
    stationRoute,
    automated,
    setAutomated,
    fromPick,
    setFromPick,
    toPick,
    setToPick,
    waypoints,
    setWaypoints,
    trainWaypoints,
    setTrainWaypoints,
    carStops,
    setCarStops,
    moveCarStop,
    pendingFiles,
    setPendingFiles,
    travelerIds,
    setTravelerIds,
    toggleTraveler,
    isSaving,
    setIsSaving,
    seed,
    payload,
    writesFlightLegs,
    writesTrainLegs,
  };
}
