import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TourListItem } from '@trek/shared'

vi.mock('../../../../server/src/config', () => { throw new Error('Config initialization is forbidden in client tests') })
vi.mock('../../../../server/src/db/database', () => { throw new Error('Legacy database imports are forbidden in client tests') })
vi.mock('better-sqlite3', () => { throw new Error('SQLite imports are forbidden in client tests') })

const state = vi.hoisted(() => ({
  trip: { id: 7, user_id: 1 } as { id: number; user_id: number } | null,
  user: { id: 2, role: 'user' } as { id: number; role: string } | null,
  importGpx: vi.fn(),
  previewGpx: vi.fn(),
  loadTrip: vi.fn(),
  refreshPlaces: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  detail: vi.fn(),
  route: vi.fn(),
  elevation: vi.fn(),
}))

vi.mock('../../store/tripStore', () => ({ useTripStore: (selector: (store: unknown) => unknown) => selector({ trip: state.trip, loadTrip: state.loadTrip, refreshPlaces: state.refreshPlaces, places: [] }) }))
vi.mock('../../store/authStore', () => ({ useAuthStore: (selector: (store: unknown) => unknown) => selector({ user: state.user }) }))
vi.mock('../../store/settingsStore', () => ({ useSettingsStore: (selector: (store: unknown) => unknown) => selector({ settings: { distance_unit: 'metric' } }) }))
vi.mock('../Map/MapViewAuto', () => ({ MapViewAuto: () => null }))
vi.mock('../../repo/tourRepo', () => ({ tourRepo: { importGpx: state.importGpx, previewGpx: state.previewGpx, create: state.create, update: state.update, detail: state.detail } }))
vi.mock('./planner/tourRouting', () => ({ routeWalkingTour: state.route, enrichTourElevations: state.elevation }))
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (key: string) => key, locale: 'en' }), translateApiError: () => 'error' }))
vi.mock('../shared/Toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }))
vi.mock('../shared/ConfirmDialog', () => ({ default: () => null }))
vi.mock('../shared/EmptyState', () => ({ default: ({ action }: { action?: React.ReactNode }) => <div>{action}</div> }))
vi.mock('../shared/CustomSelect', () => ({ default: ({ id, ariaLabel, disabled, value }: { id: string; ariaLabel: string; disabled: boolean; value: number }) => <select id={id} aria-label={ariaLabel} disabled={disabled} value={value} onChange={() => {}}><option value={value}>{value}</option></select> }))
vi.mock('../shared/ElevationProfile', () => ({ default: () => null }))
vi.mock('../shared/DetailShell', () => ({ default: ({ header, footer, children }: { header: React.ReactNode; footer: React.ReactNode; children: React.ReactNode }) => <div>{header}{children}{footer}</div> }))
vi.mock('../shared/TrackColorPicker', () => ({ default: ({ onChange }: { onChange: (color: string) => void }) => <button onClick={() => onChange('#ff0000')}>color</button> }))
vi.mock('../shared/NavigationMenu', () => ({ NavigationMenu: () => null }))
vi.mock('../shared/markdownLink', () => ({ markdownLinkComponents: {} }))
vi.mock('../../utils/fileDownload', () => ({ openFile: vi.fn() }))
vi.mock('../Planner/placeNavigation', () => ({ getNavigationTargets: () => [], openNavigationTarget: vi.fn() }))

import { pickFiles } from '../../../tests/helpers/filePicker'
import { usePermissionsStore } from '../../store/permissionsStore'
import { useTourPermissions } from './useTourPermissions'
import ToursSidebar from './ToursSidebar'
import { useTourPlanner } from './planner/useTourPlanner'
import type { TourPlannerController } from './planner/useTourPlanner'
import { TourPlannerRail, TourPlannerToursRail } from './planner/TourPlannerPanels'
import TourDetailDialog from './TourDetailDialog'
import MToursSelectionList from '../../mobile/screens/trip/places/MToursSelectionList'
import type { ComponentProps } from 'react'
import { useTourListFilters } from './useTourListFilters'
import { hikePlannerDefaults } from '../../../tests/helpers/tourPlannerStub'

/** The list as the places browser mounts it: its filters from the shared hook (PR1-13). */
function List(props: Omit<ComponentProps<typeof MToursSelectionList>, 'filters'>) {
  const filters = useTourListFilters(props.planner.tours)
  return <MToursSelectionList {...props} filters={filters} />
}

const tour = { place_id: 42, name: 'Ridge', tour_type: 'hike', max_hiking_difficulty: 2, planned: false } as TourListItem
const days = [{ id: 3, title: 'Summit' }] as never

beforeEach(() => {
  vi.clearAllMocks()
  state.trip = { id: 7, user_id: 1 }
  state.user = { id: 2, role: 'user' }
  state.importGpx.mockResolvedValue({ tours: [tour] })
  state.previewGpx.mockResolvedValue({ tracks: [{ name: 'Ridge', geometry: [[46, 7], [46.01, 7.01]], point_count: 2, distance_km: 1.4, elevation_gain_m: null, elevation_loss_m: null, duplicate: false }] })
  usePermissionsStore.setState({ permissions: { place_edit: 'admin', day_edit: 'admin' } })
})
afterEach(() => { cleanup(); vi.useRealTimers(); localStorage.clear() })

describe('Tours permissions without database setup', () => {
  it('revoking sidebar rights closes assignment choices and blocks file-input invocation', async () => {
    const assign = vi.fn()
    const props = { tripId: 7, days, tours: [tour], onAssignToDay: assign }
    const { rerender } = render(<ToursSidebar {...props} canEdit canAssign />)
    fireEvent.click(screen.getByRole('button', { name: 'tours.addToDay' }))
    expect(screen.getByRole('button', { name: /Summit/ })).toBeTruthy()
    rerender(<ToursSidebar {...props} canEdit={false} canAssign={false} />)
    expect(screen.queryByRole('button', { name: /Summit/ })).toBeNull()
    // Without the right the import button opens no file picker at all.
    await act(async () => {
      expect(
        pickFiles(screen.getByText('tours.import.button').closest('button')!, [new File(['gpx'], 'ridge.gpx')])
      ).toBeNull() })
    expect(state.importGpx).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
  })

  it.each([[false, false], [true, false], [false, true], [true, true]])('update edit=%s assign=%s writes only with place rights and never assigns', async (canEdit, canAssign) => {
    vi.useFakeTimers()
    state.detail.mockResolvedValue({ tour, waypoints: [{ lat: 48, lng: 11, role: 'start' }, { lat: 48.008, lng: 11.008, role: 'end' }] })
    state.route.mockResolvedValue({ coordinates: [[48, 11], [48.008, 11.008]], distanceMeters: 1000, durationSeconds: 600 })
    state.elevation.mockResolvedValue([[48, 11, 500], [48.008, 11.008, 550]])
    state.update.mockResolvedValue({ tour, waypoints: [] })
    const saved = vi.fn()
    const { result } = renderHook(() => useTourPlanner({ tripId: 7, canEdit, canAssign, onSaved: saved }))
    await act(async () => { await result.current.openTour(tour) })
    expect(state.detail).toHaveBeenCalledWith(7, 42, expect.any(AbortSignal))
    act(() => result.current.setName('Updated ridge'))
    await act(async () => { await vi.advanceTimersByTimeAsync(450) })
    expect(result.current.canSave).toBe(canEdit)
    await act(async () => { await result.current.save() })
    expect(state.update).toHaveBeenCalledTimes(canEdit ? 1 : 0)
    expect(saved).toHaveBeenCalledTimes(canEdit ? 1 : 0)
    expect(state.create).not.toHaveBeenCalled()
  })
  it.each([[false, false], [true, false], [false, true], [true, true]])('detail/mobile edit=%s assign=%s gate independent actions and preserve viewing', async (canEdit, canAssign) => {
    const update = vi.fn()
    const remove = vi.fn()
    const assign = vi.fn()
    const del = vi.fn()
      const upload = vi.fn().mockResolvedValue(undefined)
    const place = { id: 42, trip_id: 7, name: 'Ridge', lat: 48, lng: 11, route_geometry: null } as never
    const props = { tour, place, selectedDayId: 3, canEdit, canAssign, onClose: vi.fn(), onUpdatePlace: update, onAssignToDay: assign, onRemoveAssignment: remove, onDelete: del, onFileUpload: upload }
    const { container, rerender } = render(<TourDetailDialog {...props} />)
    const uploadInput = container.querySelector('input[type=file]')
    expect(Boolean(uploadInput)).toBe(canEdit)
    if (uploadInput) await act(async () => { fireEvent.change(uploadInput, { target: { files: [new File(['file'], 'ridge.txt')] } }) })
    expect(upload).toHaveBeenCalledTimes(canEdit ? 1 : 0)
    expect(Boolean(screen.queryByRole('button', { name: 'common.edit' }))).toBe(canEdit)
    expect(Boolean(screen.queryByRole('button', { name: 'common.delete' }))).toBe(canEdit)
    expect(Boolean(screen.queryByRole('button', { name: 'inspector.addToDay' }))).toBe(canAssign)
    expect((screen.getByRole('button', { name: 'tours.detail.trackColor' }) as HTMLButtonElement).disabled).toBe(
      !canEdit
    )
    if (canEdit) {
      fireEvent.click(screen.getByRole('button', { name: 'tours.detail.trackColor' }))
      fireEvent.click(screen.getByRole('button', { name: 'color' }))
      expect(update).toHaveBeenCalledWith(42, { route_color: '#ff0000' })
      fireEvent.click(screen.getByRole('button', { name: 'common.edit' }))
      fireEvent.change(screen.getByDisplayValue('Ridge'), { target: { value: 'Renamed' } })
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'common.save' })) })
      expect(update).toHaveBeenCalledWith(42, { name: 'Renamed' })
      fireEvent.click(screen.getByRole('button', { name: 'common.delete' }))
      expect(del).toHaveBeenCalledOnce()
    }
    if (canAssign) fireEvent.click(screen.getByRole('button', { name: 'inspector.addToDay' }))
    expect(assign).toHaveBeenCalledTimes(canAssign ? 1 : 0)
    rerender(<TourDetailDialog {...props} assignments={{ '3': [{ id: 9, place }] } as never} />)
    expect(Boolean(screen.queryByRole('button', { name: 'inspector.removeFromDay' }))).toBe(canAssign)
    if (canAssign) fireEvent.click(screen.getByRole('button', { name: 'inspector.removeFromDay' }))
    expect(remove).toHaveBeenCalledTimes(canAssign ? 1 : 0)
    const view = vi.fn()
    const openSheet = vi.fn()
    rerender(<List planner={{ t: (key: string) => key, tours: [tour], handlePlaceClick: view, reloadTourPlaceIds: vi.fn() } as never} shell={{ sheet: 'other', openSheet } as never} canEdit={canEdit} canAssign={canAssign} />)
    fireEvent.click(screen.getByRole('option'))
    expect(view).toHaveBeenCalledWith(42)
    const attach = screen.getByRole('button', { name: 'tours.addToDay' }) as HTMLButtonElement
    expect(attach.disabled).toBe(!canAssign)
    fireEvent.click(attach)
    expect(openSheet).toHaveBeenCalledTimes(canAssign ? 1 : 0)
  })
  it.each([[false, false], [true, false], [false, true], [true, true]])('rails edit=%s assign=%s separate save and existing-tour attach', (canEdit, canAssign) => {
    const planner = {
      ...hikePlannerDefaults(),
      mode: { type: 'new-draft' }, name: 'Ridge', status: 'ready', maxHikingDifficulty: 2,
      waypoints: [], canSave: true, save: vi.fn(), route: null, saveOutcome: tour,
      startNewTour: vi.fn(), openTour: vi.fn().mockResolvedValue(true),
    } as unknown as TourPlannerController
    const assign = vi.fn()
    render(<><TourPlannerRail planner={planner} canEdit={canEdit} canAssign={canAssign} /><TourPlannerToursRail planner={planner} tours={[tour]} days={days} loading={false} onAssignToDay={assign} onViewGpxTour={vi.fn()} canEdit={canEdit} canAssign={canAssign} /></>)
    expect(screen.queryByRole('button', { name: /assignToDay/ })).not.toBeInTheDocument()
    const save = screen.getByRole('button', { name: 'common.save' }) as HTMLButtonElement
    expect(save.disabled).toBe(!canEdit)
    fireEvent.click(save)
    expect(planner.save).toHaveBeenCalledTimes(canEdit ? 1 : 0)
    const picker = screen.queryByRole('button', { name: 'tours.addToDay: Ridge' })
    expect(Boolean(picker)).toBe(canAssign)
    if (picker) {
      expect(picker).toBeEnabled()
      fireEvent.click(picker)
      fireEvent.click(screen.getByRole('button', { name: /Summit/ }))
    }
    expect(assign).toHaveBeenCalledTimes(canAssign ? 1 : 0)
    if (canAssign) expect(assign).toHaveBeenCalledWith(tour.place_id, 3)
    fireEvent.click(screen.getByRole('option', { name: /Ridge/ }))
    expect(planner.openTour).toHaveBeenCalledWith(tour)
  })
  it.each([[false, false], [true, false], [false, true], [true, true]])('planner edit=%s assign=%s gates direct create and retained save after revocation', async (canEdit, canAssign) => {
    vi.useFakeTimers()
    state.route.mockResolvedValue({ coordinates: [[48, 11], [48.008, 11.008]], distanceMeters: 1000, durationSeconds: 600 })
    state.elevation.mockResolvedValue([[48, 11, 500], [48.008, 11.008, 550]])
    state.create.mockResolvedValue({ tour, waypoints: [] })
    const { result, rerender } = renderHook(({ edit }) => useTourPlanner({ tripId: 7, canEdit: edit, canAssign }), { initialProps: { edit: canEdit } })
    act(() => { result.current.setName('Ridge'); result.current.addWaypoint(48, 11); result.current.addWaypoint(48.008, 11.008) })
    await act(async () => { await vi.advanceTimersByTimeAsync(450) })
    expect(result.current.canSave).toBe(canEdit)
    expect(result.current.waypoints.length).toBe(canEdit ? 2 : 0)
    await act(async () => { await result.current.save() })
    expect(state.create).toHaveBeenCalledTimes(canEdit ? 1 : 0)
    expect(state.update).not.toHaveBeenCalled()
    if (canEdit) {
      act(() => result.current.setName('Updated'))
      const retainedSave = result.current.save
      rerender({ edit: false })
      await act(async () => { await retainedSave(); await result.current.save() })
      expect(state.update).not.toHaveBeenCalled()
    }
  })
  it.each([[false, false], [true, false], [false, true], [true, true]])('sidebar edit=%s assign=%s keeps reads available and gates writes', async (canEdit, canAssign) => {
    const assign = vi.fn()
    const select = vi.fn()
    render(<ToursSidebar tripId={7} days={days} tours={[tour]} canEdit={canEdit} canAssign={canAssign} onAssignToDay={assign} onSelectTour={select} />)
    const row = screen.getByRole('option')
    fireEvent.click(row)
    expect(select).toHaveBeenCalledWith(tour, row)
    const importButton = screen.getByText('tours.import.button').closest('button') as HTMLButtonElement
    expect(importButton.disabled).toBe(!canEdit)
    const attach = screen.getByRole('button', { name: 'tours.addToDay' }) as HTMLButtonElement
    expect(attach.disabled).toBe(!canAssign)
    fireEvent.click(attach)
    if (canAssign) fireEvent.click(screen.getByRole('button', { name: /Summit/ }))
    expect(assign).toHaveBeenCalledTimes(canAssign ? 1 : 0)
    await act(async () => {
      pickFiles(importButton, [new File(['gpx'], 'ridge.gpx')]) })
    // Choosing a file only reads it; the write is the preview's confirmation.
    expect(state.previewGpx).toHaveBeenCalledTimes(canEdit ? 1 : 0)
    expect(state.importGpx).not.toHaveBeenCalled()
    if (canEdit) await act(async () => { fireEvent.click(screen.getByTestId('gpx-preview-import')) })
    expect(state.importGpx).toHaveBeenCalledTimes(canEdit ? 1 : 0)
  })

  it('omitted props use actual configured rights and reject missing or mismatched trip context', () => {
    usePermissionsStore.setState({ permissions: { place_edit: 'trip_member', day_edit: 'trip_owner' } })
    const { result, rerender } = renderHook(() => useTourPermissions({ tripId: 7 }))
    expect(result.current).toEqual({ canEdit: true, canAssign: false })
    state.trip = { id: 8, user_id: 1 }
    rerender()
    expect(result.current).toEqual({ canEdit: false, canAssign: false })
    state.trip = null
    rerender()
    expect(result.current).toEqual({ canEdit: false, canAssign: false })
    state.trip = { id: 7, user_id: 1 }
    state.user = null
    rerender()
    expect(result.current).toEqual({ canEdit: false, canAssign: false })
  })
})