// Shared types for the TREK travel planner.
//
// Domain entity/response types are now sourced from @trek/shared — the single
// source of truth shared with the server. The Zod schemas there are built to
// match the REAL server response shapes (see shared/src/<domain>/*.schema.ts,
// each documented against the producing service). Re-exported here so the rest
// of the client keeps importing from '../types' unchanged.
import type {
  Trip,
  TripMember,
  Day,
  DayNote,
  Place,
  AssignmentPlace,
  PlaceCategory,
  Assignment,
  AssignmentParticipant,
  PackingItem,
  PackingBag,
  PackingBagMember,
  BudgetItem,
  BudgetItemMember,
  Reservation,
  ReservationEndpoint,
  Accommodation,
  Tag,
  Category,
} from '@trek/shared'

export type {
  Trip,
  TripMember,
  Day,
  DayNote,
  Place,
  AssignmentPlace,
  PlaceCategory,
  Assignment,
  AssignmentParticipant,
  PackingItem,
  PackingBag,
  PackingBagMember,
  BudgetItem,
  BudgetItemMember,
  Reservation,
  ReservationEndpoint,
  Accommodation,
  Tag,
  Category,
}

export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'user'
  avatar_url: string | null
  maps_api_key: string | null
  created_at: string
  /** Present after load; true when TOTP MFA is enabled for password login */
  mfa_enabled?: boolean
  /** True when a password change is required before the user can continue */
  must_change_password?: boolean
}

export interface TodoItem {
  id: number
  trip_id: number
  name: string
  category: string | null
  checked: number
  sort_order: number
  due_date: string | null
  description: string | null
  assigned_user_id: number | null
  priority: number
}

export interface TripFile {
  id: number
  trip_id: number
  place_id?: number | null
  reservation_id?: number | null
  note_id?: number | null
  uploaded_by?: number | null
  uploaded_by_name?: string | null
  uploaded_by_avatar?: string | null
  filename: string
  original_name: string
  file_size?: number | null
  mime_type: string
  description?: string | null
  starred?: number
  deleted_at?: string | null
  created_at: string
  reservation_title?: string
  linked_reservation_ids?: (number | null)[]
  linked_place_ids?: (number | null)[]
  /** Served download path — always present on list/create/update responses (formatFile). */
  url: string
}

export type DistanceUnit = 'metric' | 'imperial'

export interface Settings {
  map_tile_url: string
  default_lat: number
  default_lng: number
  default_zoom: number
  dark_mode: boolean | string
  default_currency: string
  language: string
  temperature_unit: string
  distance_unit?: DistanceUnit
  time_format: string
  show_place_description: boolean
  blur_booking_codes?: boolean
  map_booking_labels?: boolean
  map_poi_pill_enabled?: boolean
  optimize_from_accommodation?: boolean
  map_provider?: 'leaflet' | 'mapbox-gl' | 'maplibre-gl'
  mapbox_access_token?: string
  mapbox_style?: string
  maplibre_style?: string
  mapbox_3d_enabled?: boolean
  mapbox_quality_mode?: boolean
  // Dashboard widget prefs — persisted server-side so a (docker) upgrade keeps them (#1311).
  dashboard_fx_from?: string
  dashboard_fx_to?: string
  dashboard_timezones?: string[]
}

export interface AssignmentsMap {
  [dayId: string]: Assignment[]
}

export interface DayNotesMap {
  [dayId: string]: DayNote[]
}

export interface RouteSegment {
  mid: [number, number]
  from: [number, number]
  to: [number, number]
  distance: number
  duration: number
  walkingText: string
  drivingText: string
  distanceText: string
  durationText?: string
}

export interface RouteWithLegs {
  coordinates: [number, number][]
  distance: number
  duration: number
  legs: RouteSegment[]
}

export interface RouteResult {
  coordinates: [number, number][]
  distance: number
  duration: number
  distanceText: string
  durationText: string
  walkingText: string
  drivingText: string
}

export interface Waypoint {
  lat: number
  lng: number
}

// Optional fixed start/end points for route optimization (e.g. the day's accommodation).
export interface RouteAnchors {
  start?: Waypoint
  end?: Waypoint
}

// User with optional OIDC fields
export interface UserWithOidc extends User {
  oidc_issuer?: string | null
}

// Atlas place detail
export interface AtlasPlace {
  id: number
  name: string
  lat: number | null
  lng: number | null
}

// GeoJSON types (simplified for atlas map)
export interface GeoJsonFeature {
  type: 'Feature'
  properties: Record<string, string | number | null | undefined>
  geometry: {
    type: string
    coordinates: unknown
  }
  id?: string
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

// App config from /auth/app-config
export interface AppConfig {
  has_users: boolean
  allow_registration: boolean
  demo_mode: boolean
  oidc_configured: boolean
  oidc_display_name?: string
  oidc_only_mode?: boolean
  has_maps_key?: boolean
  allowed_file_types?: string
  timezone?: string
  /** When true, users without MFA cannot use the app until they enable it */
  require_mfa?: boolean
  // Granular auth toggles
  password_login?: boolean
  password_registration?: boolean
  oidc_login?: boolean
  oidc_registration?: boolean
  env_override_oidc_only?: boolean
}

// Translation function type
export type TranslationFn = (key: string, params?: Record<string, string | number | null>) => string

// WebSocket event type
export interface WebSocketEvent {
  type: string
  [key: string]: unknown
}

// Vacay types
export interface VacayHolidayCalendar {
  id: number
  plan_id: number
  region: string
  label: string | null
  color: string
  sort_order: number
}

export interface VacayPlan {
  id: number
  holidays_enabled: boolean
  holidays_region: string | null
  holiday_calendars: VacayHolidayCalendar[]
  block_weekends: boolean
  carry_over_enabled: boolean
  company_holidays_enabled: boolean
  // Comma-separated weekday indices (e.g. '0,6'); stored as TEXT on vacay_plans.
  weekend_days?: string
  week_start?: number
  name?: string
  year?: number
  owner_id?: number
  created_at?: string
  updated_at?: string
}

export interface VacayUser {
  id: number
  username: string
  color: string | null
}

export interface VacayEntry {
  date: string
  user_id: number
  plan_id?: number
  person_color?: string
  person_name?: string
}

// Vacay per-user stats row as returned by getStats
// (server/src/services/vacayService.ts -> getStats).
export interface VacayStat {
  user_id: number
  person_name: string
  person_color: string
  year: number
  vacation_days: number
  carried_over: number
  total_available: number
  used: number
  remaining: number
}

export interface HolidayInfo {
  name: string
  localName: string
  color: string
  label: string | null
}

export interface HolidaysMap {
  [date: string]: HolidayInfo
}

// API error shape from axios
export interface ApiError {
  response?: {
    data?: {
      error?: string
    }
    status?: number
  }
  message: string
}

/** Safely extract an error message from an unknown catch value */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const apiErr = err as ApiError
    if (apiErr.response?.data?.error) return apiErr.response.data.error
  }
  if (err instanceof Error) return err.message
  return fallback
}

// MergedItem used in day notes hook
export interface MergedItem {
  type: 'assignment' | 'note' | 'place' | 'transport'
  sortKey: number
  data: Assignment | DayNote | Reservation
}
