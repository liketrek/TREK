import { KI_RESERVATION_JSON_SCHEMA, KI_RESERVATION_TYPES } from '@trek/shared';

export { KI_RESERVATION_JSON_SCHEMA };

/**
 * System instructions telling the model to emit schema.org reservation JSON-LD
 * in exactly the shape the kitinerary binary produces — so the result feeds the
 * same `mapReservations()` mapper. Pure (no I/O) so it's unit-testable.
 */
export function buildSystemPrompt(): string {
  return [
    'You extract travel reservations from a document (a booking confirmation, ticket, or itinerary).',
    'Return ONLY a JSON object of the form { "reservations": [ ... ] } — no prose, no markdown.',
    'Each reservation is a schema.org JSON-LD object whose "@type" is one of:',
    KI_RESERVATION_TYPES.map((t) => `  - ${t}`).join('\n'),
    'Put the booking/confirmation code in "reservationNumber" on each reservation.',
    'All dates/times are plain ISO 8601 local strings, e.g. "2026-06-11T10:00:00" (no timezone wrapper objects).',
    'IMPORTANT: nest the type-specific fields INSIDE a "reservationFor" object — do NOT place them at the top level of the reservation.',
    'Populate "reservationFor" with the type-specific fields:',
    '  FlightReservation: { flightNumber, airline:{name,iataCode}, departureAirport:{iataCode,name,geo:{latitude,longitude}}, arrivalAirport:{...}, departureTime, arrivalTime }',
    '  TrainReservation:  { trainNumber, trainName, departureStation:{name,geo}, arrivalStation:{name,geo}, departureTime, arrivalTime }',
    '  BusReservation:    { busNumber, busName, departureBusStop:{name,geo}, arrivalBusStop:{name,geo}, departureTime, arrivalTime }',
    '  BoatReservation:   { name, departureBoatTerminal:{name,geo}, arrivalBoatTerminal:{name,geo}, departureTime, arrivalTime }',
    '  LodgingReservation: { name, address, geo:{latitude,longitude}, telephone, url } — put check-in/out in root "checkinTime"/"checkoutTime"',
    '  FoodEstablishmentReservation: { name, address, geo, telephone, url } — put booking time in root "startTime"/"endTime"',
    '  RentalCarReservation: { name, model, make, rentalCompany:{name} } — put pickup/dropoff times in root "pickupTime"/"dropoffTime", and the pickup AND return stations in root "pickupLocation" and "dropoffLocation", each {name,address,geo:{latitude,longitude}}',
    '  EventReservation / TouristAttractionVisit: { name, startDate, endDate, location:{name,address,geo,telephone,url} }',
    'When present, also include at the reservation ROOT: "seat", "class" (fare/cabin class), "platform" (trains/buses), and the total "price" (a number) with "priceCurrency" (ISO 4217 code, e.g. EUR).',
    'Extract EVERY flight/segment in the document, including return legs — a round trip has TWO OR MORE flights, and each row of a flight table is a separate reservation. Do NOT stop after the first.',
    "Each flight shares the booking's reservationNumber. Use the date shown for that specific flight as its departureTime; if a flight lists only one date (no separate arrival time), leave arrivalTime null — never reuse another flight's date.",
    'If the document contains no recognizable reservation, return { "reservations": [] }.',
  ].join('\n');
}

/** Short user-turn instruction that accompanies the document content. */
export const USER_INSTRUCTION = 'Extract every travel reservation from the following document as schema.org JSON-LD.';
