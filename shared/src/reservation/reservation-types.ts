/**
 * The reservation types TREK knows, with what each one is. One table instead of
 * the type lists the server and the client used to keep side by side (the MCP
 * transport gate, the share view's "travel only" filter, the day plan's
 * carriers), so a new type is added once and every named subset follows.
 *
 * The order is the transport form's picker, then the booking form's; every
 * subset below keeps it, so an enum built from one lists its values in the
 * order the UI offers them.
 *
 * The `type` column itself stays free text: rows written by older versions or
 * by an import may hold a value outside this table, and the API returns them
 * as they are (`reservationTypeSchema` accepts any string).
 */
export interface ReservationTypeInfo {
  readonly type: string;
  /** Getting from A to B; rendered with a transport icon and edited through the transport tools. */
  readonly isTransport: boolean;
  /**
   * A ride the traveller takes and leaves behind (the day plan's carrier, the
   * road trip's seam). A hire car, a taxi or a transit hop is not one.
   */
  readonly isCarrier: boolean;
  /** A hire car: driven by the traveller, its desks are stops on the drive. */
  readonly isRental: boolean;
  /** Where the trip sleeps. */
  readonly isStay: boolean;
  /** Carries per-segment detail (metadata.legs). */
  readonly hasLegs: boolean;
  /**
   * An assistant may create one through the MCP tools. `transit` is not: its
   * provider itinerary is written by create_transit_journey alone.
   */
  readonly creatableViaMcp: boolean;
}

const transport = {
  isTransport: true,
  isCarrier: false,
  isRental: false,
  isStay: false,
  hasLegs: false,
  creatableViaMcp: true,
} as const;
const booking = {
  isTransport: false,
  isCarrier: false,
  isRental: false,
  isStay: false,
  hasLegs: false,
  creatableViaMcp: true,
} as const;

export const RESERVATION_TYPES = [
  { type: 'flight', ...transport, isCarrier: true, hasLegs: true },
  { type: 'train', ...transport, isCarrier: true, hasLegs: true },
  { type: 'bus', ...transport, isCarrier: true },
  { type: 'car', ...transport, isRental: true },
  { type: 'taxi', ...transport },
  { type: 'bicycle', ...transport },
  { type: 'cruise', ...transport, isCarrier: true },
  { type: 'ferry', ...transport, isCarrier: true },
  { type: 'cable_car', ...transport },
  { type: 'transit', ...transport, creatableViaMcp: false },
  { type: 'transport_other', ...transport },
  { type: 'hotel', ...booking, isStay: true },
  { type: 'restaurant', ...booking },
  { type: 'event', ...booking },
  { type: 'tour', ...booking },
  { type: 'activity', ...booking },
  { type: 'parking', ...booking },
  { type: 'other', ...booking },
] as const satisfies readonly ReservationTypeInfo[];

type Entry = (typeof RESERVATION_TYPES)[number];

/** A reservation type from the catalog. */
export type ReservationType = Entry['type'];

type Flag = Exclude<keyof ReservationTypeInfo, 'type'>;

/** The catalog's types whose flags match all of `match`, in catalog order. */
function typesWhere<const M extends Partial<Record<Flag, boolean>>>(match: M): readonly Extract<Entry, M>['type'][] {
  const flags = Object.entries(match) as [Flag, boolean][];
  return RESERVATION_TYPES.filter((e) => flags.every(([flag, value]) => e[flag] === value)).map(
    (e) => e.type,
  ) as Extract<Entry, M>['type'][];
}

/** Every type in the catalog, in picker order. */
export const RESERVATION_TYPE_KEYS: readonly ReservationType[] = RESERVATION_TYPES.map((e) => e.type);

/** Every transport type, `transit` included. */
export const TRANSPORT_RESERVATION_TYPES = typesWhere({ isTransport: true });

/** The transport types an assistant may ask for: the transport picker, without `transit`. */
export const MCP_CREATABLE_TRANSPORT_TYPES = typesWhere({ isTransport: true, creatableViaMcp: true });

/** The non-transport types an assistant may ask for: what create_reservation offers. */
export const BOOKING_RESERVATION_TYPES = typesWhere({ isTransport: false, creatableViaMcp: true });

/** The transport types that carry per-segment legs. */
export const LEG_RESERVATION_TYPES = typesWhere({ hasLegs: true });

/** The rides the traveller leaves behind (the day plan's carriers, the road trip's seams). */
export const CARRIER_RESERVATION_TYPES = typesWhere({ isCarrier: true });

/** The rental types (a hire car). */
export const RENTAL_RESERVATION_TYPES = typesWhere({ isRental: true });

/** What a road trip places on its route: the carriers it breaks at, and the hire cars whose desks are stops. */
export const ROADTRIP_RESERVATION_TYPES: readonly ReservationType[] = [
  ...CARRIER_RESERVATION_TYPES,
  ...RENTAL_RESERVATION_TYPES,
];

/** Getting there and sleeping there: every transport type, then the stays. */
export const TRAVEL_RESERVATION_TYPES: readonly ReservationType[] = [
  ...TRANSPORT_RESERVATION_TYPES,
  ...typesWhere({ isStay: true }),
];

const BY_TYPE: ReadonlyMap<string, ReservationTypeInfo> = new Map(RESERVATION_TYPES.map((e) => [e.type, e]));

/** The catalog entry for a stored type, or undefined for a value outside the catalog. */
export function reservationTypeInfo(type: string | null | undefined): ReservationTypeInfo | undefined {
  return type == null ? undefined : BY_TYPE.get(type);
}

/** Whether a stored type is a transport booking. False for anything outside the catalog. */
export function isTransportReservationType(type: string | null | undefined): boolean {
  return reservationTypeInfo(type)?.isTransport === true;
}

/** The statuses a reservation can be in. A row without one reads as `pending`. */
export const RESERVATION_STATUSES = ['pending', 'confirmed', 'cancelled'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];
