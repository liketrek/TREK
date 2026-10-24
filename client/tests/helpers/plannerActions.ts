import { vi } from 'vitest';

/**
 * The trip store actions the planner hook snapshots on mount, each replaced by a
 * spy. A suite seeds them into the store so it can assert which write the hook
 * reached for without running the real slices.
 */
export interface PlannerActions {
  loadTrip: ReturnType<typeof vi.fn>;
  loadReservations: ReturnType<typeof vi.fn>;
  loadBudgetItems: ReturnType<typeof vi.fn>;
  loadFiles: ReturnType<typeof vi.fn>;
  refreshDays: ReturnType<typeof vi.fn>;
  setAssignmentTimes: ReturnType<typeof vi.fn>;
  setAssignmentNotes: ReturnType<typeof vi.fn>;
  addPlace: ReturnType<typeof vi.fn>;
  updatePlace: ReturnType<typeof vi.fn>;
  deletePlace: ReturnType<typeof vi.fn>;
  deletePlacesMany: ReturnType<typeof vi.fn>;
  updatePlacesMany: ReturnType<typeof vi.fn>;
  addFile: ReturnType<typeof vi.fn>;
  assignPlaceToDay: ReturnType<typeof vi.fn>;
  removeAssignment: ReturnType<typeof vi.fn>;
  reorderAssignments: ReturnType<typeof vi.fn>;
  reorderDays: ReturnType<typeof vi.fn>;
  insertDay: ReturnType<typeof vi.fn>;
  appendDatedDay: ReturnType<typeof vi.fn>;
  deleteDay: ReturnType<typeof vi.fn>;
  updateDayTitle: ReturnType<typeof vi.fn>;
  addReservation: ReturnType<typeof vi.fn>;
  updateReservation: ReturnType<typeof vi.fn>;
  deleteReservation: ReturnType<typeof vi.fn>;
  setSelectedDay: ReturnType<typeof vi.fn>;
}

export function makeActions(): PlannerActions {
  return {
    loadTrip: vi.fn(async () => undefined),
    loadReservations: vi.fn(async () => undefined),
    loadBudgetItems: vi.fn(async () => undefined),
    loadFiles: vi.fn(async () => undefined),
    refreshDays: vi.fn(async () => undefined),
    setAssignmentTimes: vi.fn(async () => undefined),
    setAssignmentNotes: vi.fn(async () => undefined),
    addPlace: vi.fn(async () => ({ id: 900, name: 'New' })),
    updatePlace: vi.fn(async () => undefined),
    deletePlace: vi.fn(async () => undefined),
    deletePlacesMany: vi.fn(async () => undefined),
    updatePlacesMany: vi.fn(async () => undefined),
    addFile: vi.fn(async () => undefined),
    assignPlaceToDay: vi.fn(async () => ({ id: 555 })),
    removeAssignment: vi.fn(async () => undefined),
    reorderAssignments: vi.fn(async () => undefined),
    reorderDays: vi.fn(async () => undefined),
    insertDay: vi.fn(async () => undefined),
    appendDatedDay: vi.fn(async () => ({ id: 99, date: '2026-06-04' })),
    deleteDay: vi.fn(async () => undefined),
    updateDayTitle: vi.fn(async () => undefined),
    addReservation: vi.fn(async () => ({ id: 77 })),
    updateReservation: vi.fn(async () => ({ id: 77 })),
    deleteReservation: vi.fn(async () => undefined),
    setSelectedDay: vi.fn(() => undefined),
  };
}
