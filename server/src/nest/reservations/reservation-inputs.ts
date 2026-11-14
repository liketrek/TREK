import type { ReservationOrigin } from './reservation-origin.contract';

/*
 * The shapes the reservations service takes in: a booking's endpoints, the
 * stay a booking can create, and the create and update bodies. Kept apart
 * from reservations.service.ts, which is at its size baseline; the service
 * exports them on, so their importers did not change.
 */

export interface ReservationEndpoint {
  id?: number;
  reservation_id?: number;
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

export type EndpointInput = Omit<ReservationEndpoint, 'id' | 'reservation_id' | 'sequence'> & { sequence?: number };

export interface CreateAccommodation {
  place_id?: number;
  start_day_id?: number;
  end_day_id?: number;
  check_in?: string;
  check_out?: string;
  confirmation?: string;
}

export interface CreateReservationData extends ReservationOrigin {
  title: string;
  reservation_time?: string;
  reservation_end_time?: string;
  location?: string;
  confirmation_number?: string;
  notes?: string;
  url?: string;
  day_id?: number;
  end_day_id?: number;
  place_id?: number;
  assignment_id?: number;
  status?: string;
  type?: string;
  accommodation_id?: number;
  metadata?: unknown;
  create_accommodation?: CreateAccommodation;
  endpoints?: EndpointInput[];
  needs_review?: boolean;
}

export interface UpdateReservationData {
  title?: string;
  reservation_time?: string;
  reservation_end_time?: string;
  location?: string;
  confirmation_number?: string;
  notes?: string;
  url?: string;
  day_id?: number | null;
  end_day_id?: number | null;
  place_id?: number;
  assignment_id?: number;
  status?: string;
  type?: string;
  accommodation_id?: number;
  metadata?: unknown;
  create_accommodation?: CreateAccommodation;
  endpoints?: EndpointInput[];
  needs_review?: boolean;
}
