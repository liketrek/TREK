import { findByIata } from '../../services/airportService';
import type {
  KiReservation, KiFlight, KiTrainTrip, KiBusTrip, KiBoatTrip,
  KiLodgingBusiness, KiFoodEstablishment, KiRentalCar, KiEvent,
  KiGeo, KiAddress, KiDateTimeish, ParsedBookingItem, ParsedEndpoint, ParsedVenue,
} from './kitinerary.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract a plain ISO string from either a string or a KDE QDateTime object. */
function toIsoString(dt: KiDateTimeish): string | null {
  if (!dt) return null;
  if (typeof dt === 'string') return dt || null;
  if (typeof dt === 'object' && dt['@type'] === 'QDateTime') return dt['@value'] || null;
  return null;
}

function splitIso(dt: KiDateTimeish): { date: string | null; time: string | null } {
  const iso = toIsoString(dt);
  if (!iso) return { date: null, time: null };
  return { date: iso.slice(0, 10) || null, time: iso.length > 10 ? iso.slice(11, 16) || null : null };
}

function formatAddress(address: string | KiAddress | undefined): string | null {
  if (!address) return null;
  if (typeof address === 'string') return address || null;
  const joined = [address.streetAddress, address.addressLocality, address.postalCode, address.addressCountry].filter(Boolean).join(', ');
  return joined || null;
}

function coords(geo: KiGeo | undefined): { lat: number; lng: number } | null {
  if (!geo || geo.latitude == null || geo.longitude == null) return null;
  return { lat: Number(geo.latitude), lng: Number(geo.longitude) };
}

// ---------------------------------------------------------------------------
// Type mappers
// ---------------------------------------------------------------------------

function mapFlight(r: KiReservation, source: ParsedBookingItem['source']): ParsedBookingItem | null {
  const f = r.reservationFor as KiFlight | undefined;
  if (!f) return null;

  const depIata = f.departureAirport?.iataCode?.toUpperCase() ?? null;
  const arrIata = f.arrivalAirport?.iataCode?.toUpperCase() ?? null;
  const depAp = depIata ? findByIata(depIata) : null;
  const arrAp = arrIata ? findByIata(arrIata) : null;

  const depLabel = depAp ? (depAp.city ? `${depAp.city} (${depAp.iata})` : depAp.name) : (f.departureAirport?.name ?? depIata ?? 'Unknown');
  const arrLabel = arrAp ? (arrAp.city ? `${arrAp.city} (${arrAp.iata})` : arrAp.name) : (f.arrivalAirport?.name ?? arrIata ?? 'Unknown');

  const airline = f.airline?.name ?? f.airline?.iataCode ?? '';
  const flightNum = f.flightNumber ?? '';
  const title = [airline, flightNum].filter(Boolean).join(' ') || `Flight ${depLabel} → ${arrLabel}`;

  const { date: depDate, time: depTime } = splitIso(f.departureTime);
  const { date: arrDate, time: arrTime } = splitIso(f.arrivalTime);

  const endpoints: ParsedEndpoint[] = [];
  if (depAp) {
    endpoints.push({ role: 'from', sequence: 0, name: depLabel, code: depAp.iata, lat: depAp.lat, lng: depAp.lng, timezone: depAp.tz, local_time: depTime, local_date: depDate });
  } else {
    const c = coords(f.departureAirport?.geo);
    if (c) endpoints.push({ role: 'from', sequence: 0, name: depLabel, code: depIata, lat: c.lat, lng: c.lng, timezone: null, local_time: depTime, local_date: depDate });
  }
  if (arrAp) {
    endpoints.push({ role: 'to', sequence: 1, name: arrLabel, code: arrAp.iata, lat: arrAp.lat, lng: arrAp.lng, timezone: arrAp.tz, local_time: arrTime, local_date: arrDate });
  } else {
    const c = coords(f.arrivalAirport?.geo);
    if (c) endpoints.push({ role: 'to', sequence: 1, name: arrLabel, code: arrIata, lat: c.lat, lng: c.lng, timezone: null, local_time: arrTime, local_date: arrDate });
  }

  return {
    type: 'flight',
    title,
    reservation_time: toIsoString(f.departureTime),
    reservation_end_time: toIsoString(f.arrivalTime),
    confirmation_number: r.reservationNumber ?? null,
    metadata: {
      ...(airline ? { airline } : {}),
      ...(flightNum ? { flight_number: flightNum } : {}),
      ...(depIata ? { departure_airport: depIata } : {}),
      ...(arrIata ? { arrival_airport: arrIata } : {}),
    },
    endpoints,
    needs_review: endpoints.length < 2,
    source,
  };
}

/** True when flight `b` is a short layover connection that continues flight `a`. */
function sameConnection(a: KiReservation, b: KiReservation): boolean {
  const fa = a.reservationFor as KiFlight | undefined;
  const fb = b.reservationFor as KiFlight | undefined;
  if (!fa || !fb) return false;
  const arrIata = fa.arrivalAirport?.iataCode?.toUpperCase();
  const depIata = fb.departureAirport?.iataCode?.toUpperCase();
  if (!arrIata || !depIata || arrIata !== depIata) return false; // must connect at the same airport
  const arrIso = toIsoString(fa.arrivalTime);
  const depIso = toIsoString(fb.departureTime);
  if (arrIso && depIso) {
    const gapMs = new Date(depIso).getTime() - new Date(arrIso).getTime();
    // A real layover is forward in time and short — anything longer (e.g. a
    // round-trip return days later) stays a separate booking.
    if (gapMs < 0 || gapMs > 24 * 3600 * 1000) return false;
  }
  return true;
}

/** Collapse several connecting flight legs (same PNR) into one multi-leg booking. */
function mapFlightGroup(legs: KiReservation[], source: ParsedBookingItem['source']): ParsedBookingItem | null {
  const flights = legs.map(l => l.reservationFor as KiFlight | undefined);
  if (flights.some(f => !f)) return mapFlight(legs[0], source); // malformed → fall back to single
  const fs = flights as KiFlight[];

  const iataOf = (ap: KiFlight['departureAirport']) => ap?.iataCode?.toUpperCase() ?? null;
  const makeEndpoint = (
    ap: KiFlight['departureAirport'], role: 'from' | 'stop' | 'to', time: string | null, date: string | null,
  ): ParsedEndpoint | null => {
    const iata = iataOf(ap);
    const found = iata ? findByIata(iata) : null;
    const label = found ? (found.city ? `${found.city} (${found.iata})` : found.name) : (ap?.name ?? iata ?? 'Unknown');
    if (found) return { role, sequence: 0, name: label, code: found.iata, lat: found.lat, lng: found.lng, timezone: found.tz, local_time: time, local_date: date };
    const c = coords(ap?.geo);
    if (c) return { role, sequence: 0, name: label, code: iata, lat: c.lat, lng: c.lng, timezone: null, local_time: time, local_date: date };
    return null;
  };

  const endpoints: ParsedEndpoint[] = [];
  const metaLegs: Record<string, unknown>[] = [];
  const first = fs[0];
  const firstDep = splitIso(first.departureTime);
  const originEp = makeEndpoint(first.departureAirport, 'from', firstDep.time, firstDep.date);
  if (originEp) endpoints.push(originEp);

  fs.forEach((f, i) => {
    const isLast = i === fs.length - 1;
    const arr = splitIso(f.arrivalTime);
    const arrEp = makeEndpoint(f.arrivalAirport, isLast ? 'to' : 'stop', arr.time, arr.date);
    if (arrEp) endpoints.push(arrEp);
    const airline = f.airline?.name ?? f.airline?.iataCode ?? '';
    metaLegs.push({
      from: iataOf(f.departureAirport),
      to: iataOf(f.arrivalAirport),
      ...(airline ? { airline } : {}),
      ...(f.flightNumber ? { flight_number: f.flightNumber } : {}),
      dep_time: splitIso(f.departureTime).time,
      arr_time: arr.time,
    });
  });
  endpoints.forEach((e, i) => { e.sequence = i; });

  const last = fs[fs.length - 1];
  const airline = first.airline?.name ?? first.airline?.iataCode ?? '';
  const route = [iataOf(first.departureAirport), ...fs.map(f => iataOf(f.arrivalAirport))].filter(Boolean).join(' → ');
  return {
    type: 'flight',
    title: airline ? `${airline} ${route}` : `Flight ${route}`,
    reservation_time: toIsoString(first.departureTime),
    reservation_end_time: toIsoString(last.arrivalTime),
    confirmation_number: legs[0].reservationNumber ?? null,
    metadata: {
      ...(airline ? { airline } : {}),
      ...(first.flightNumber ? { flight_number: first.flightNumber } : {}),
      ...(iataOf(first.departureAirport) ? { departure_airport: iataOf(first.departureAirport) } : {}),
      ...(iataOf(last.arrivalAirport) ? { arrival_airport: iataOf(last.arrivalAirport) } : {}),
      legs: metaLegs,
    },
    endpoints,
    needs_review: endpoints.length < fs.length + 1,
    source,
  };
}

function mapTrain(r: KiReservation, source: ParsedBookingItem['source']): ParsedBookingItem | null {
  const t = r.reservationFor as KiTrainTrip | undefined;
  if (!t) return null;

  const depName = t.departureStation?.name ?? 'Unknown';
  const arrName = t.arrivalStation?.name ?? 'Unknown';
  const trainId = t.trainNumber ?? t.trainName ?? '';
  const title = trainId ? `${trainId} (${depName} → ${arrName})` : `Train ${depName} → ${arrName}`;

  const { date: depDate, time: depTime } = splitIso(t.departureTime);
  const { date: arrDate, time: arrTime } = splitIso(t.arrivalTime);

  const endpoints: ParsedEndpoint[] = [];
  const dc = coords(t.departureStation?.geo);
  const ac = coords(t.arrivalStation?.geo);
  if (dc) endpoints.push({ role: 'from', sequence: 0, name: depName, code: null, lat: dc.lat, lng: dc.lng, timezone: null, local_time: depTime, local_date: depDate });
  if (ac) endpoints.push({ role: 'to', sequence: 1, name: arrName, code: null, lat: ac.lat, lng: ac.lng, timezone: null, local_time: arrTime, local_date: arrDate });

  return {
    type: 'train',
    title,
    reservation_time: toIsoString(t.departureTime),
    reservation_end_time: toIsoString(t.arrivalTime),
    confirmation_number: r.reservationNumber ?? null,
    metadata: trainId ? { train_number: trainId } : undefined,
    endpoints,
    needs_review: endpoints.length < 2,
    source,
  };
}

function mapBus(r: KiReservation, source: ParsedBookingItem['source']): ParsedBookingItem | null {
  const b = r.reservationFor as KiBusTrip | undefined;
  if (!b) return null;

  const depName = b.departureBusStop?.name ?? 'Unknown';
  const arrName = b.arrivalBusStop?.name ?? 'Unknown';
  const busId = b.busNumber ?? b.busName ?? '';
  const title = busId ? `${busId} (${depName} → ${arrName})` : `Bus ${depName} → ${arrName}`;

  const { date: depDate, time: depTime } = splitIso(b.departureTime);
  const { date: arrDate, time: arrTime } = splitIso(b.arrivalTime);

  const endpoints: ParsedEndpoint[] = [];
  const dc = coords(b.departureBusStop?.geo);
  const ac = coords(b.arrivalBusStop?.geo);
  if (dc) endpoints.push({ role: 'from', sequence: 0, name: depName, code: null, lat: dc.lat, lng: dc.lng, timezone: null, local_time: depTime, local_date: depDate });
  if (ac) endpoints.push({ role: 'to', sequence: 1, name: arrName, code: null, lat: ac.lat, lng: ac.lng, timezone: null, local_time: arrTime, local_date: arrDate });

  return { type: 'train', title, reservation_time: toIsoString(b.departureTime), reservation_end_time: toIsoString(b.arrivalTime), confirmation_number: r.reservationNumber ?? null, endpoints, needs_review: endpoints.length < 2, source };
}

function mapBoat(r: KiReservation, source: ParsedBookingItem['source']): ParsedBookingItem | null {
  const b = r.reservationFor as KiBoatTrip | undefined;
  if (!b) return null;

  const depName = b.departureBoatTerminal?.name ?? 'Unknown';
  const arrName = b.arrivalBoatTerminal?.name ?? 'Unknown';
  const title = (b as any).name ?? `Cruise ${depName} → ${arrName}`;

  const { date: depDate, time: depTime } = splitIso(b.departureTime);
  const { date: arrDate, time: arrTime } = splitIso(b.arrivalTime);

  const endpoints: ParsedEndpoint[] = [];
  const dc = coords(b.departureBoatTerminal?.geo);
  const ac = coords(b.arrivalBoatTerminal?.geo);
  if (dc) endpoints.push({ role: 'from', sequence: 0, name: depName, code: null, lat: dc.lat, lng: dc.lng, timezone: null, local_time: depTime, local_date: depDate });
  if (ac) endpoints.push({ role: 'to', sequence: 1, name: arrName, code: null, lat: ac.lat, lng: ac.lng, timezone: null, local_time: arrTime, local_date: arrDate });

  return { type: 'cruise', title, reservation_time: toIsoString(b.departureTime), reservation_end_time: toIsoString(b.arrivalTime), confirmation_number: r.reservationNumber ?? null, endpoints, source };
}

function mapLodging(r: KiReservation, source: ParsedBookingItem['source']): ParsedBookingItem | null {
  const l = r.reservationFor as KiLodgingBusiness | undefined;
  if (!l?.name) return null;

  const c = coords(l.geo);
  const venue: ParsedVenue = { name: l.name, ...(c ?? {}), address: formatAddress(l.address) ?? undefined, website: l.url ?? undefined, phone: l.telephone ?? undefined };

  const { date: checkInDate, time: checkInTime } = splitIso(r.checkinTime);
  const { date: checkOutDate, time: checkOutTime } = splitIso(r.checkoutTime);
  const checkIn = checkInDate ? `${checkInDate}${checkInTime ? `T${checkInTime}` : ''}` : undefined;
  const checkOut = checkOutDate ? `${checkOutDate}${checkOutTime ? `T${checkOutTime}` : ''}` : undefined;

  return {
    type: 'hotel',
    title: l.name,
    confirmation_number: r.reservationNumber ?? null,
    location: formatAddress(l.address),
    _venue: venue,
    _accommodation: { check_in: checkIn, check_out: checkOut, confirmation: r.reservationNumber ?? undefined },
    metadata: { ...(checkInTime ? { check_in_time: checkInTime } : {}), ...(checkOutTime ? { check_out_time: checkOutTime } : {}) },
    source,
  };
}

function mapFood(r: KiReservation, source: ParsedBookingItem['source']): ParsedBookingItem | null {
  const f = r.reservationFor as KiFoodEstablishment | undefined;
  if (!f?.name) return null;

  const c = coords(f.geo);
  const venue: ParsedVenue = { name: f.name, ...(c ?? {}), address: formatAddress(f.address) ?? undefined, website: f.url ?? undefined, phone: f.telephone ?? undefined };

  return { type: 'restaurant', title: f.name, reservation_time: toIsoString(r.startTime), reservation_end_time: toIsoString(r.endTime), confirmation_number: r.reservationNumber ?? null, location: formatAddress(f.address), _venue: venue, source };
}

function mapRentalCar(r: KiReservation, source: ParsedBookingItem['source']): ParsedBookingItem | null {
  const car = r.reservationFor as KiRentalCar | undefined;
  const company = car?.rentalCompany?.name ?? '';
  const carName = car?.name ?? [car?.make, car?.model].filter(Boolean).join(' ') ?? '';
  const title = [company, carName].filter(Boolean).join(' — ') || 'Rental Car';

  const pickup = r.pickupLocation as KiReservation['pickupLocation'];
  const pc = coords(pickup?.geo);
  const venue: ParsedVenue | undefined = pickup?.name ? { name: pickup.name, ...(pc ?? {}), address: formatAddress(pickup.address) ?? undefined } : undefined;

  return { type: 'car', title, reservation_time: toIsoString(r.pickupTime), reservation_end_time: toIsoString(r.dropoffTime), confirmation_number: r.reservationNumber ?? null, ...(venue ? { _venue: venue } : {}), source };
}

function mapEvent(r: KiReservation, source: ParsedBookingItem['source']): ParsedBookingItem | null {
  const e = r.reservationFor as KiEvent | undefined;
  if (!e?.name) return null;

  const loc = e.location;
  const c = coords(loc?.geo);
  const venue: ParsedVenue | undefined = loc?.name ? { name: loc.name, ...(c ?? {}), address: formatAddress(loc.address) ?? undefined } : undefined;

  return { type: 'event', title: e.name, reservation_time: toIsoString(e.startDate), reservation_end_time: toIsoString(e.endDate), confirmation_number: r.reservationNumber ?? null, location: loc ? (formatAddress(loc.address) ?? loc.name ?? null) : null, ...(venue ? { _venue: venue } : {}), source };
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

export function mapReservations(kiItems: KiReservation[], fileName: string): { items: ParsedBookingItem[]; warnings: string[] } {
  const items: ParsedBookingItem[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < kiItems.length; i++) {
    const r = kiItems[i];
    const source = { fileName, index: i };
    let item: ParsedBookingItem | null = null;

    // Group consecutive connecting flight legs that share a PNR into one booking.
    if (r['@type'] === 'FlightReservation') {
      const pnr = r.reservationNumber ?? null;
      const group = [r];
      while (
        i + 1 < kiItems.length &&
        kiItems[i + 1]['@type'] === 'FlightReservation' &&
        pnr != null &&
        (kiItems[i + 1].reservationNumber ?? null) === pnr &&
        sameConnection(group[group.length - 1], kiItems[i + 1])
      ) {
        group.push(kiItems[++i]);
      }
      item = group.length > 1 ? mapFlightGroup(group, source) : mapFlight(r, source);
      if (item) items.push(item);
      continue;
    }

    switch (r['@type']) {
      case 'TrainReservation':             item = mapTrain(r, source);   break;
      case 'BusReservation':              item = mapBus(r, source);     break;
      case 'BoatReservation':             item = mapBoat(r, source);    break;
      case 'LodgingReservation':          item = mapLodging(r, source); break;
      case 'FoodEstablishmentReservation': item = mapFood(r, source);   break;
      case 'RentalCarReservation':        item = mapRentalCar(r, source); break;
      case 'EventReservation':
      case 'TouristAttractionVisit':      item = mapEvent(r, source);   break;
      default:
        warnings.push(`Unknown type "${r['@type']}" in ${fileName}[${i}] — skipped`);
    }

    if (item) items.push(item);
  }

  return { items, warnings };
}
