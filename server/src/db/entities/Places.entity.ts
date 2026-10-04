import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { PlacesRepository } from '../repositories/Places.repository';
import { DbTimestampType } from '../types';
import { BudgetItems } from './BudgetItems.entity';
import { Categories } from './Categories.entity';
import { DawarichVisitSuggestions } from './DawarichVisitSuggestions.entity';
import { DayAccommodations } from './DayAccommodations.entity';
import { DayAssignments } from './DayAssignments.entity';
import { FileLinks } from './FileLinks.entity';
import { JourneyEntries } from './JourneyEntries.entity';
import { Photos } from './Photos.entity';
import { PlaceRatings } from './PlaceRatings.entity';
import { PlaceRegions } from './PlaceRegions.entity';
import { Reservations } from './Reservations.entity';
import { RoadtripDayTracks } from './RoadtripDayTracks.entity';
import { Tags } from './Tags.entity';
import { TripFiles } from './TripFiles.entity';
import { Trips } from './Trips.entity';

export class Places {
  [EntityRepositoryType]?: PlacesRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  name!: string;
  description?: string | null;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  category?: Ref<Categories> | null;
  category_id?: number | null;
  price?: number | null;
  currency?: string | null;
  reservation_status?: string | null = 'none';
  reservation_notes?: string | null;
  reservation_datetime?: string | null;
  place_time?: string | null;
  end_time?: string | null;
  duration_minutes?: number | null = 60;
  notes?: string | null;
  image_url?: string | null;
  google_place_id?: string | null;
  google_ftid?: string | null;
  website?: string | null;
  phone?: string | null;
  transport_mode?: string | null = 'walking';
  created_at?: string | null;
  updated_at?: string | null;
  osm_id?: string | null;
  route_geometry?: string | null;
  route_color?: string | null;
  stop_type?: string | null;
  fill_percent?: number | null;
  amap_poi_id?: string | null;
  source?: string | null;
  email?: string | null;
  opening_hours?: string | null;
  place_tags = new Collection<Tags>(this);
  budget_items_collection = new Collection<BudgetItems>(this);
  dawarich_visit_suggestions_collection = new Collection<DawarichVisitSuggestions>(this);
  day_accommodations_collection = new Collection<DayAccommodations>(this);
  day_assignments_collection = new Collection<DayAssignments>(this);
  file_links_collection = new Collection<FileLinks>(this);
  journey_entries_collection = new Collection<JourneyEntries>(this);
  photos_collection = new Collection<Photos>(this);
  place_ratings_collection = new Collection<PlaceRatings>(this);
  place_regions: Ref<PlaceRegions> | null = null;
  reservations_collection = new Collection<Reservations>(this);
  roadtrip_day_tracks_collection = new Collection<RoadtripDayTracks>(this);
  trip_files_collection = new Collection<TripFiles>(this);
}

export const PlacesSchema = defineEntity({
  class: Places,
  repository: () => PlacesRepository,
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden().index('idx_places_trip_id'),
    trip_id: p.integer().persist(false).index('idx_places_trip_id'),
    name: p.text(),
    description: p.text().nullable(),
    lat: p.double().nullable(),
    lng: p.double().nullable(),
    address: p.text().nullable(),
    category: () => p.manyToOne(Categories).ref().nullable().hidden().index('idx_places_category_id'),
    category_id: p.integer().nullable().persist(false).index('idx_places_category_id'),
    price: p.double().nullable(),
    currency: p.text().nullable(),
    reservation_status: p.text().nullable(),
    reservation_notes: p.text().nullable(),
    reservation_datetime: p.text().nullable(),
    place_time: p.text().nullable(),
    end_time: p.text().nullable(),
    duration_minutes: p.integer().nullable(),
    notes: p.text().nullable(),
    image_url: p.text().nullable(),
    google_place_id: p.text().nullable(),
    google_ftid: p.text().nullable(),
    website: p.text().nullable(),
    phone: p.text().nullable(),
    transport_mode: p.text().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    osm_id: p.text().nullable(),
    route_geometry: p.text().nullable(),
    route_color: p.text().nullable(),
    stop_type: p.text().nullable(),
    fill_percent: p.integer().nullable(),
    amap_poi_id: p.text().nullable(),
    source: p.text().nullable(),
    email: p.text().nullable(),
    opening_hours: p.text().nullable(),
    place_tags: () => p.manyToMany(Tags).pivotTable('place_tags').joinColumn('place_id').inverseJoinColumn('tag_id').hidden(),
    budget_items_collection: () => p.oneToMany(BudgetItems).mappedBy('place').hidden(),
    dawarich_visit_suggestions_collection: () => p.oneToMany(DawarichVisitSuggestions).mappedBy('acceptedPlace').hidden(),
    day_accommodations_collection: () => p.oneToMany(DayAccommodations).mappedBy('place').hidden(),
    day_assignments_collection: () => p.oneToMany(DayAssignments).mappedBy('place').hidden(),
    file_links_collection: () => p.oneToMany(FileLinks).mappedBy('place').hidden(),
    journey_entries_collection: () => p.oneToMany(JourneyEntries).mappedBy('sourcePlace').hidden(),
    photos_collection: () => p.oneToMany(Photos).mappedBy('place').hidden(),
    place_ratings_collection: () => p.oneToMany(PlaceRatings).mappedBy('place').hidden(),
    place_regions: () => p.oneToOne(PlaceRegions).ref().mappedBy('place').hidden(),
    reservations_collection: () => p.oneToMany(Reservations).mappedBy('place').hidden(),
    roadtrip_day_tracks_collection: () => p.oneToMany(RoadtripDayTracks).mappedBy('place').hidden(),
    trip_files_collection: () => p.oneToMany(TripFiles).mappedBy('place').hidden(),
  },
});
