import { Collection, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
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
  id?: number | null;
  trip!: Ref<Trips>;
  name!: string;
  description?: string | null;
  lat?: unknown | null;
  lng?: unknown | null;
  address?: string | null;
  category?: Ref<Categories> | null;
  price?: unknown | null;
  currency?: string | null;
  reservationStatus?: string | null = 'none';
  reservationNotes?: string | null;
  reservationDatetime?: string | null;
  placeTime?: string | null;
  endTime?: string | null;
  durationMinutes?: number | null = 60;
  notes?: string | null;
  imageUrl?: string | null;
  googlePlaceId?: string | null;
  googleFtid?: string | null;
  website?: string | null;
  phone?: string | null;
  transportMode?: string | null = 'walking';
  createdAt?: Date | null;
  updatedAt?: Date | null;
  osmId?: string | null;
  routeGeometry?: string | null;
  routeColor?: string | null;
  stopType?: string | null;
  fillPercent?: number | null;
  amapPoiId?: string | null;
  source?: string | null;
  placeTags = new Collection<Tags>(this);
  budgetItemsCollection = new Collection<BudgetItems>(this);
  dawarichVisitSuggestionsCollection = new Collection<DawarichVisitSuggestions>(this);
  dayAccommodationsCollection = new Collection<DayAccommodations>(this);
  dayAssignmentsCollection = new Collection<DayAssignments>(this);
  fileLinksCollection = new Collection<FileLinks>(this);
  journeyEntriesCollection = new Collection<JourneyEntries>(this);
  photosCollection = new Collection<Photos>(this);
  placeRatingsCollection = new Collection<PlaceRatings>(this);
  placeRegions: Ref<PlaceRegions> | null = null;
  reservationsCollection = new Collection<Reservations>(this);
  roadtripDayTracksCollection = new Collection<RoadtripDayTracks>(this);
  tripFilesCollection = new Collection<TripFiles>(this);
}

export class PlacesRepository extends EntityRepository<Places> {}

export const PlacesSchema = defineEntity({
  class: Places,
  repository: () => PlacesRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').index('idx_places_trip_id'),
    name: p.text(),
    description: p.text().nullable(),
    lat: p.double().nullable(),
    lng: p.double().nullable(),
    address: p.text().nullable(),
    category: () => p.manyToOne(Categories).ref().nullable().index('idx_places_category_id'),
    price: p.double().nullable(),
    currency: p.text().nullable(),
    reservationStatus: p.text().nullable(),
    reservationNotes: p.text().nullable(),
    reservationDatetime: p.text().nullable(),
    placeTime: p.text().nullable(),
    endTime: p.text().nullable(),
    durationMinutes: p.integer().nullable(),
    notes: p.text().nullable(),
    imageUrl: p.text().nullable(),
    googlePlaceId: p.text().nullable(),
    googleFtid: p.text().nullable(),
    website: p.text().nullable(),
    phone: p.text().nullable(),
    transportMode: p.text().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    updatedAt: p.datetime().nullable().onCreate(() => new Date()),
    osmId: p.text().nullable(),
    routeGeometry: p.text().nullable(),
    routeColor: p.text().nullable(),
    stopType: p.text().nullable(),
    fillPercent: p.integer().nullable(),
    amapPoiId: p.text().nullable(),
    source: p.text().nullable(),
    placeTags: () => p.manyToMany(Tags).pivotTable('place_tags').joinColumn('place_id').inverseJoinColumn('tag_id'),
    budgetItemsCollection: () => p.oneToMany(BudgetItems).mappedBy('place'),
    dawarichVisitSuggestionsCollection: () => p.oneToMany(DawarichVisitSuggestions).mappedBy('acceptedPlace'),
    dayAccommodationsCollection: () => p.oneToMany(DayAccommodations).mappedBy('place'),
    dayAssignmentsCollection: () => p.oneToMany(DayAssignments).mappedBy('place'),
    fileLinksCollection: () => p.oneToMany(FileLinks).mappedBy('place'),
    journeyEntriesCollection: () => p.oneToMany(JourneyEntries).mappedBy('sourcePlace'),
    photosCollection: () => p.oneToMany(Photos).mappedBy('place'),
    placeRatingsCollection: () => p.oneToMany(PlaceRatings).mappedBy('place'),
    placeRegions: () => p.oneToOne(PlaceRegions).ref().mappedBy('place'),
    reservationsCollection: () => p.oneToMany(Reservations).mappedBy('place'),
    roadtripDayTracksCollection: () => p.oneToMany(RoadtripDayTracks).mappedBy('place'),
    tripFilesCollection: () => p.oneToMany(TripFiles).mappedBy('place'),
  },
});
