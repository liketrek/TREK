import { create } from 'zustand'
import type { StoreApi } from 'zustand'
import { tripsApi, tagsApi, categoriesApi } from '../api/client'
import { offlineDb } from '../db/offlineDb'
import { tripRepo } from '../repo/tripRepo'
import { dayRepo } from '../repo/dayRepo'
import { placeRepo } from '../repo/placeRepo'
import { packingRepo } from '../repo/packingRepo'
import { todoRepo } from '../repo/todoRepo'
import { budgetRepo } from '../repo/budgetRepo'
import { reservationRepo } from '../repo/reservationRepo'
import { fileRepo } from '../repo/fileRepo'
import { isEffectivelyOnline } from '../sync/networkMode'
import { createPlacesSlice } from './slices/placesSlice'
import { createAssignmentsSlice } from './slices/assignmentsSlice'
import { createDaysSlice } from './slices/daysSlice'
import { createDayNotesSlice } from './slices/dayNotesSlice'
import { createPackingSlice } from './slices/packingSlice'
import { createTodoSlice } from './slices/todoSlice'
import { createBudgetSlice } from './slices/budgetSlice'
import { createReservationsSlice } from './slices/reservationsSlice'
import { createFilesSlice } from './slices/filesSlice'
import { handleRemoteEvent } from './slices/remoteEventHandler'
import type {
  Trip, Day, Place, Assignment, DayNote, PackingItem, TodoItem,
  Tag, Category, BudgetItem, TripFile, Reservation,
  AssignmentsMap, DayNotesMap, WebSocketEvent,
} from '../types'
import { getApiErrorMessage } from '../types'
import type { PlacesSlice } from './slices/placesSlice'
import type { AssignmentsSlice } from './slices/assignmentsSlice'
import type { DaysSlice } from './slices/daysSlice'
import type { DayNotesSlice } from './slices/dayNotesSlice'
import type { PackingSlice } from './slices/packingSlice'
import type { TodoSlice } from './slices/todoSlice'
import type { BudgetSlice } from './slices/budgetSlice'
import type { ReservationsSlice } from './slices/reservationsSlice'
import type { FilesSlice } from './slices/filesSlice'

export interface TripStoreState
  extends PlacesSlice,
    AssignmentsSlice,
    DaysSlice,
    DayNotesSlice,
    PackingSlice,
    TodoSlice,
    BudgetSlice,
    ReservationsSlice,
    FilesSlice {
  trip: Trip | null
  days: Day[]
  places: Place[]
  assignments: AssignmentsMap
  dayNotes: DayNotesMap
  packingItems: PackingItem[]
  todoItems: TodoItem[]
  tags: Tag[]
  categories: Category[]
  budgetItems: BudgetItem[]
  files: TripFile[]
  reservations: Reservation[]
  selectedDayId: number | null
  // Places filter (list + map markers). Lives here, not in the sidebar, so the
  // applied filter and the filter UI can never drift apart when the Plan tab
  // unmounts and remounts (#1541).
  placesFilter: string
  placesCategoryFilter: Set<string>
  isLoading: boolean
  error: string | null

  setSelectedDay: (dayId: number | null) => void
  setPlacesFilter: (filter: string) => void
  setPlacesCategoryFilter: (categoryIds: Set<string>) => void
  handleRemoteEvent: (event: WebSocketEvent) => void
  resetTrip: () => void
  loadTrip: (tripId: number | string) => Promise<void>
  hydrateActiveTrip: (tripId: number | string) => Promise<void>
  refreshDays: (tripId: number | string) => Promise<void>
  updateTrip: (tripId: number | string, data: Partial<Trip> & { date_shift_mode?: 'keep_bookings' | 'shift_all' }) => Promise<Trip>
  addTag: (data: Partial<Tag> & { name: string }) => Promise<Tag>
  addCategory: (data: Partial<Category> & { name: string }) => Promise<Category>
}

export const useTripStore = create<TripStoreState>((set, get) => ({
  trip: null,
  days: [],
  places: [],
  assignments: {},
  dayNotes: {},
  packingItems: [],
  todoItems: [],
  tags: [],
  categories: [],
  budgetItems: [],
  files: [],
  reservations: [],
  selectedDayId: null,
  placesFilter: 'all',
  placesCategoryFilter: new Set<string>(),
  isLoading: false,
  error: null,

  setSelectedDay: (dayId: number | null) => set({ selectedDayId: dayId }),
  setPlacesFilter: (filter: string) => set({ placesFilter: filter }),
  setPlacesCategoryFilter: (categoryIds: Set<string>) => set({ placesCategoryFilter: categoryIds }),

  handleRemoteEvent: (event: WebSocketEvent) => handleRemoteEvent(set, get, event),

  // Clear every trip-scoped slice so switching trips (or losing access to one)
  // can never leave a previous trip's data visible. Global tags/categories are
  // left intact. Called at the top of loadTrip.
  resetTrip: () => set({
    trip: null,
    days: [],
    places: [],
    assignments: {},
    dayNotes: {},
    packingItems: [],
    todoItems: [],
    budgetItems: [],
    files: [],
    reservations: [],
    selectedDayId: null,
    placesFilter: 'all',
    placesCategoryFilter: new Set<string>(),
    error: null,
  }),

  loadTrip: async (tripId: number | string) => {
    get().resetTrip()
    set({ isLoading: true, error: null })
    try {
      const [tripData, daysData, placesData, packingData, todoData, budgetData, reservationsData, filesData, tagsData, categoriesData] = await Promise.all([
        tripRepo.get(tripId),
        dayRepo.list(tripId),
        placeRepo.list(tripId),
        packingRepo.list(tripId),
        todoRepo.list(tripId),
        // Budget / reservations / files are hydrated here too so the offline
        // path is uniform (no separate tab-gated effects). Non-fatal: a failure
        // in any of these must not blank the whole trip.
        budgetRepo.list(tripId).catch(() => ({ items: [] as BudgetItem[] })),
        reservationRepo.list(tripId).catch(() => ({ reservations: [] as Reservation[] })),
        fileRepo.list(tripId).catch(() => ({ files: [] as TripFile[] })),
        isEffectivelyOnline()
          ? tagsApi.list().catch(() => offlineDb.tags.toArray().then(tags => ({ tags })))
          : offlineDb.tags.toArray().then(tags => ({ tags })),
        isEffectivelyOnline()
          ? categoriesApi.list().catch(() => offlineDb.categories.toArray().then(categories => ({ categories })))
          : offlineDb.categories.toArray().then(categories => ({ categories })),
      ])

      const assignmentsMap: AssignmentsMap = {}
      const dayNotesMap: DayNotesMap = {}
      for (const day of daysData.days) {
        assignmentsMap[String(day.id)] = day.assignments || []
        dayNotesMap[String(day.id)] = day.notes_items || []
      }

      set({
        trip: tripData.trip,
        days: daysData.days,
        places: placesData.places,
        assignments: assignmentsMap,
        dayNotes: dayNotesMap,
        packingItems: packingData.items,
        todoItems: todoData.items,
        budgetItems: budgetData.items,
        reservations: reservationsData.reservations,
        files: filesData.files,
        tags: tagsData.tags,
        categories: categoriesData.categories,
        isLoading: false,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  // Silently re-fetch the active trip's collaborative state into the store after
  // the network comes back (WS reconnect or `online` event) so edits missed while
  // offline appear in place — no splash, no resetTrip. Each resource is
  // best-effort; a failure on one must not wipe the others.
  hydrateActiveTrip: async (tripId: number | string) => {
    await Promise.all([
      get().refreshDays(tripId),
      placeRepo.list(tripId).then(d => set({ places: d.places })).catch(() => {}),
      packingRepo.list(tripId).then(d => set({ packingItems: d.items })).catch(() => {}),
      todoRepo.list(tripId).then(d => set({ todoItems: d.items })).catch(() => {}),
      get().loadBudgetItems(tripId),
      get().loadReservations(tripId),
      get().loadFiles(tripId),
    ])
    // Accommodations live in planner-local state, not this store — nudge the
    // planner to reload them too (e.g. a trip date change made while offline).
    window.dispatchEvent(new CustomEvent('accommodations:refresh'))
  },

  refreshDays: async (tripId: number | string) => {
    try {
      const daysData = await dayRepo.list(tripId)
      const assignmentsMap: AssignmentsMap = {}
      const dayNotesMap: DayNotesMap = {}
      for (const day of daysData.days) {
        assignmentsMap[String(day.id)] = day.assignments || []
        dayNotesMap[String(day.id)] = day.notes_items || []
      }
      set({ days: daysData.days, assignments: assignmentsMap, dayNotes: dayNotesMap })
    } catch (err: unknown) {
      console.error('Failed to refresh days:', err)
    }
  },

  updateTrip: async (tripId: number | string, data: Partial<Trip> & { date_shift_mode?: 'keep_bookings' | 'shift_all' }) => {
    try {
      const result = await tripsApi.update(tripId, data)
      set({ trip: result.trip })
      const daysData = await dayRepo.list(tripId)
      const assignmentsMap: AssignmentsMap = {}
      const dayNotesMap: DayNotesMap = {}
      for (const day of daysData.days) {
        assignmentsMap[String(day.id)] = day.assignments || []
        dayNotesMap[String(day.id)] = day.notes_items || []
      }
      set({ days: daysData.days, assignments: assignmentsMap, dayNotes: dayNotesMap })
      // A date change re-anchors bookings server-side (#1288); the socket echo is
      // suppressed for this client, so pull the fresh reservations here.
      await get().loadReservations(tripId)
      return result.trip
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error updating trip'))
    }
  },

  addTag: async (data: Partial<Tag> & { name: string }) => {
    try {
      const result = await tagsApi.create(data)
      set((state) => ({ tags: [...state.tags, result.tag] }))
      return result.tag
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error creating tag'))
    }
  },

  addCategory: async (data: Partial<Category> & { name: string }) => {
    try {
      const result = await categoriesApi.create(data)
      set((state) => ({ categories: [...state.categories, result.category] }))
      return result.category
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error creating category'))
    }
  },

  ...createPlacesSlice(set, get),
  ...createAssignmentsSlice(set, get),
  ...createDaysSlice(set, get),
  ...createDayNotesSlice(set, get),
  ...createPackingSlice(set, get),
  ...createTodoSlice(set, get),
  ...createBudgetSlice(set, get),
  ...createReservationsSlice(set, get),
  ...createFilesSlice(set, get),
}))
