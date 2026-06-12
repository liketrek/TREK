/** KItinerary JSON-LD output types (schema.org subset) */

/** KDE's custom date/time wrapper — used when timezone info is present */
export interface KiDateTime {
  '@type': 'QDateTime';
  '@value': string;    // ISO 8601 local time (KDE serializes as @value)
  timezone?: string;   // IANA timezone id
}

export type KiDateTimeish = string | KiDateTime | null | undefined;

export interface KiGeo {
  '@type'?: string;
  latitude?: number;
  longitude?: number;
}

export interface KiAddress {
  '@type'?: string;
  streetAddress?: string;
  addressLocality?: string;
  postalCode?: string;
  addressCountry?: string;
}

export interface KiAirport {
  '@type'?: string;
  name?: string;
  iataCode?: string;
  geo?: KiGeo;
}

export interface KiStation {
  '@type'?: string;
  name?: string;
  geo?: KiGeo;
}

export interface KiBusStop {
  '@type'?: string;
  name?: string;
  geo?: KiGeo;
}

export interface KiFlight {
  '@type'?: string;
  flightNumber?: string;
  airline?: { name?: string; iataCode?: string };
  departureAirport?: KiAirport;
  arrivalAirport?: KiAirport;
  departureTime?: KiDateTimeish;
  arrivalTime?: KiDateTimeish;
}

export interface KiTrainTrip {
  '@type'?: string;
  trainNumber?: string;
  trainName?: string;
  departureStation?: KiStation;
  arrivalStation?: KiStation;
  departureTime?: KiDateTimeish;
  arrivalTime?: KiDateTimeish;
}

export interface KiBusTrip {
  '@type'?: string;
  busNumber?: string;
  busName?: string;
  departureBusStop?: KiBusStop;
  arrivalBusStop?: KiBusStop;
  departureTime?: KiDateTimeish;
  arrivalTime?: KiDateTimeish;
}

export interface KiBoatTrip {
  '@type'?: string;
  name?: string;
  departureBoatTerminal?: KiStation;
  arrivalBoatTerminal?: KiStation;
  departureTime?: KiDateTimeish;
  arrivalTime?: KiDateTimeish;
}

export interface KiLodgingBusiness {
  '@type'?: string;
  name?: string;
  address?: string | KiAddress;
  geo?: KiGeo;
  telephone?: string;
  url?: string;
}

export interface KiFoodEstablishment {
  '@type'?: string;
  name?: string;
  address?: string | KiAddress;
  geo?: KiGeo;
  telephone?: string;
  url?: string;
}

export interface KiRentalCar {
  '@type'?: string;
  name?: string;
  model?: string;
  make?: string;
  rentalCompany?: { name?: string };
}

export interface KiEventVenue {
  '@type'?: string;
  name?: string;
  address?: string | KiAddress;
  geo?: KiGeo;
}

export interface KiEvent {
  '@type'?: string;
  name?: string;
  startDate?: KiDateTimeish;
  endDate?: KiDateTimeish;
  location?: KiEventVenue;
}

/** A single output node from kitinerary-extractor's JSON array */
export interface KiReservation {
  '@type': string;
  reservationNumber?: string;
  checkinTime?: KiDateTimeish;
  checkoutTime?: KiDateTimeish;
  pickupTime?: KiDateTimeish;
  dropoffTime?: KiDateTimeish;
  startTime?: KiDateTimeish;
  endTime?: KiDateTimeish;
  reservationFor?: Record<string, unknown>;
  pickupLocation?: KiEventVenue;
  [key: string]: unknown;
}

/** Endpoint row shape (matches reservation_endpoints table) */
export interface ParsedEndpoint {
  role: 'from' | 'to' | 'stop';
  sequence: number;
  name: string;
  code: string | null;
  lat: number;
  lng: number;
  timezone: string | null;
  local_time: string | null;
  local_date: string | null;
}

/** Venue used to auto-create a places row on confirm */
export interface ParsedVenue {
  name: string;
  lat?: number;
  lng?: number;
  address?: string;
  website?: string;
  phone?: string;
}

/** Hotel accommodation side-effect data */
export interface ParsedAccommodation {
  check_in?: string;
  check_out?: string;
  confirmation?: string;
}

/**
 * Parsed reservation preview item — sent to the frontend and passed back on confirm.
 * Carries everything createReservation() needs plus _venue / _accommodation for
 * server-side side effects, and source for the preview UI.
 */
export interface ParsedBookingItem {
  type: string;
  title: string;
  reservation_time?: string | null;
  reservation_end_time?: string | null;
  confirmation_number?: string | null;
  location?: string | null;
  metadata?: Record<string, unknown>;
  endpoints?: ParsedEndpoint[];
  needs_review?: boolean;
  _venue?: ParsedVenue;
  _accommodation?: ParsedAccommodation;
  source: { fileName: string; index: number };
}
