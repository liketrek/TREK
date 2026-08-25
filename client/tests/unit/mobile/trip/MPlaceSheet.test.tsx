import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { assignmentsApi } from '../../../../src/api/client'
import MPlaceSheet from '../../../../src/mobile/screens/trip/sheets/MPlaceSheet'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { useAddonStore } from '../../../../src/store/addonStore'
import { useSaveToCollectionStore } from '../../../../src/store/saveToCollectionStore'
import { useTripStore } from '../../../../src/store/tripStore'
import { openFile } from '../../../../src/utils/fileDownload'
import type { Assignment, Category, Day, Place, TripFile, TripMember } from '../../../../src/types'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { act, fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-PLSH-001 to FE-MOB-PLSH-025

vi.mock('../../../../src/utils/fileDownload', () => ({ openFile: vi.fn() }))

const DAYS = [
  { id: 1, trip_id: 5, day_number: 1, date: '2026-05-01', title: null },
  { id: 2, trip_id: 5, day_number: 2, date: '2026-05-02', title: 'Old Town' },
  { id: 3, trip_id: 5, day_number: 3, date: '2026-05-03', title: null },
] as unknown as Day[]

const CATEGORIES = [{ id: 9, name: 'Museum', icon: 'Landmark', color: '#ff0000' }] as unknown as Category[]

const PLACE = {
  id: 101,
  trip_id: 5,
  name: 'Kunsthistorisches Museum',
  address: 'Maria-Theresien-Platz',
  phone: '+43 1 525240',
  website: 'https://khm.at',
  description: 'Habsburg collections',
  notes: 'Book the skip-the-line ticket',
  category_id: 9,
  lat: 48.2038,
  lng: 16.3616,
  image_url: '/uploads/places/khm.jpg',
  ratings: [],
  rating_avg: null,
} as unknown as Place

const MEMBERS = [
  { id: 1, username: 'ann', avatar: null, avatar_url: null },
  { id: 2, username: 'bob', avatar: null, avatar_url: null },
  { id: 3, username: 'cara', avatar: null, avatar_url: null },
] as unknown as TripMember[]

function dayAssignment(id: number, dayId: number, participants: { user_id: number; username: string }[] = []) {
  return {
    id,
    day_id: dayId,
    place_id: PLACE.id,
    order_index: 0,
    participants,
    place: { id: PLACE.id, name: PLACE.name, lat: PLACE.lat, lng: PLACE.lng },
  } as unknown as Assignment
}

const FILES = [
  { id: 71, trip_id: 5, place_id: 101, original_name: 'ticket.pdf', url: '/uploads/files/ticket.pdf', mime_type: 'application/pdf', filename: 'a', created_at: '' },
  { id: 72, trip_id: 5, place_id: null, linked_place_ids: [101], original_name: 'map.png', url: '/uploads/files/map.png', mime_type: 'image/png', filename: 'b', created_at: '' },
  { id: 73, trip_id: 5, place_id: 101, original_name: 'deleted.pdf', url: '/x', mime_type: 'application/pdf', filename: 'c', created_at: '', deleted_at: '2026-01-01' },
  { id: 74, trip_id: 5, place_id: 999, original_name: 'other.pdf', url: '/y', mime_type: 'application/pdf', filename: 'd', created_at: '' },
] as unknown as TripFile[]

function makeShell(overrides: Record<string, unknown> = {}) {
  return {
    view: 'plan',
    mode: 'go',
    trTab: 'plan',
    sheet: null,
    openSheet: vi.fn(),
    closeSheet: vi.fn(),
    setTrTab: vi.fn(),
    toggleView: vi.fn(),
    setTravelMode: vi.fn(),
    ...overrides,
  } as unknown as MTripShellApi
}

function makePlanner(overrides: Record<string, unknown> = {}) {
  return {
    tripId: 5,
    trip: { id: 5, title: 'Vienna' },
    language: 'en',
    days: DAYS,
    categories: CATEGORIES,
    assignments: { '2': [dayAssignment(11, 2)] },
    files: FILES,
    canUploadFiles: true,
    selectedPlace: PLACE,
    selectedDayId: 2,
    selectedAssignmentId: null,
    setSelectedPlaceId: vi.fn(),
    tripMembers: MEMBERS,
    setFitKey: vi.fn(),
    openPlaceEditor: vi.fn(),
    handleDeletePlace: vi.fn(),
    handleAssignToDay: vi.fn(),
    handleRemoveAssignment: vi.fn(),
    tripActions: {
      uploadPlaceImage: vi.fn().mockResolvedValue(undefined),
      updatePlace: vi.fn().mockResolvedValue(undefined),
      addFile: vi.fn().mockResolvedValue(undefined),
      ratePlace: vi.fn().mockResolvedValue(undefined),
    },
    can: vi.fn(() => true),
    reservations: [] as unknown[],
    TRANSPORT_TYPES: new Set(['flight', 'train', 'bus', 'car', 'taxi', 'bicycle', 'cruise', 'ferry', 'transit', 'transport_other']),
    setEditingTransport: vi.fn(),
    setTransportModalDayId: vi.fn(),
    setTransportModalAutomated: vi.fn(),
    setShowTransportModal: vi.fn(),
    setEditingReservation: vi.fn(),
    setShowReservationModal: vi.fn(),
    toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
    ...overrides,
  } as unknown as TripPlanner
}

function renderSheet(planner: TripPlanner = makePlanner(), shell: MTripShellApi = makeShell()) {
  const view = render(<MPlaceSheet planner={planner} shell={shell} />)
  return { ...view, planner, shell }
}

/** jsdom keeps input.files read-only, so the selection has to be planted. */
function selectFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, 'files', { value: files, configurable: true, writable: true })
  fireEvent.change(input)
}

describe('MPlaceSheet', () => {
  beforeEach(() => {
    resetAllStores()
    seedStore(useAddonStore, { addons: [{ id: 'collections', name: 'Collections', type: 'feature', icon: '', enabled: true }] })
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FE-MOB-PLSH-001: stays closed without a selected place', () => {
    renderSheet(makePlanner({ selectedPlace: null }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-PLSH-002: renders name, address, phone link, category and image', () => {
    renderSheet()
    expect(screen.getByRole('dialog', { name: PLACE.name })).toBeInTheDocument()
    expect(screen.getByText(PLACE.name)).toBeInTheDocument()
    expect(screen.getByText('Maria-Theresien-Platz')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '+43 1 525240' })).toHaveAttribute('href', 'tel:+43 1 525240')
    expect(screen.getByText('Museum')).toBeInTheDocument()
    expect(screen.getByText('Habsburg collections')).toBeInTheDocument()
    expect(screen.getByText('Book the skip-the-line ticket')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change image' })).toBeInTheDocument()
  })

  it('FE-MOB-PLSH-003: clears the place selection when closed', () => {
    const { planner } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(planner.setSelectedPlaceId).toHaveBeenCalledWith(null)
  })

  it('FE-MOB-PLSH-004: casts a star rating through the trip actions', async () => {
    const { planner } = renderSheet()
    expect(screen.getByText('Not rated yet')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: '4' }))
    await waitFor(() => expect(planner.tripActions.ratePlace).toHaveBeenCalledWith(5, 101, 4))
  })

  it('FE-MOB-PLSH-005: reports a failing rating as a toast', async () => {
    const planner = makePlanner()
    vi.mocked(planner.tripActions.ratePlace).mockRejectedValue(new Error('rate limited'))
    renderSheet(planner)
    fireEvent.click(screen.getByRole('radio', { name: '2' }))
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('rate limited'))
  })

  it('FE-MOB-PLSH-006: hides the track colour section without a route geometry', () => {
    renderSheet()
    expect(screen.queryByText('Track color')).not.toBeInTheDocument()
  })

  it('FE-MOB-PLSH-007: picks a track colour for a place that carries a track', async () => {
    const place = { ...PLACE, route_geometry: '{"type":"LineString"}', route_color: null } as unknown as Place
    const planner = makePlanner({ selectedPlace: place })
    renderSheet(planner)
    expect(screen.getByText('Track color')).toBeInTheDocument()

    const toggle = screen.getByRole('button', { name: /Automatic color/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(screen.getByRole('button', { name: '#ea580c' }))
    await waitFor(() => expect(planner.tripActions.updatePlace).toHaveBeenCalledWith(5, 101, { route_color: '#ea580c' }))
  })

  it('FE-MOB-PLSH-008: reports a failing track colour update', async () => {
    const place = { ...PLACE, route_geometry: 'x', route_color: '#1d4ed8' } as unknown as Place
    const planner = makePlanner({ selectedPlace: place })
    vi.mocked(planner.tripActions.updatePlace).mockRejectedValue(new Error('conflict'))
    renderSheet(planner)
    fireEvent.click(screen.getByRole('button', { name: /#1d4ed8/ }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Automatic color' })[0])
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('Unknown error'))
  })

  it('FE-MOB-PLSH-009: lists the assigned days and removes an assignment', () => {
    const { planner } = renderSheet()
    expect(screen.getByText('Old Town')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remove from Day' }))
    expect(planner.handleRemoveAssignment).toHaveBeenCalledWith(2, 11)
  })

  it('FE-MOB-PLSH-010: assigns the place to a day from the picker', () => {
    const { planner } = renderSheet()
    const add = screen.getByRole('button', { name: 'Add to Day' })
    expect(add).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(add)
    expect(screen.getByText('May 1')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Day 3'))
    expect(planner.handleAssignToDay).toHaveBeenCalledWith(101, 3)
    expect(screen.queryByText('May 1')).not.toBeInTheDocument()
  })

  it('FE-MOB-PLSH-011: treats an assignment without participants as everyone joined', async () => {
    vi.spyOn(assignmentsApi, 'setParticipants').mockResolvedValue({ participants: [{ user_id: 2, username: 'bob' }] })
    renderSheet()
    expect(screen.getByText('Participants')).toBeInTheDocument()
    expect(screen.getByText('ann')).toBeInTheDocument()
    expect(screen.getByText('cara')).toBeInTheDocument()

    fireEvent.click(screen.getByText('ann'))
    await waitFor(() => expect(assignmentsApi.setParticipants).toHaveBeenCalledWith(5, 11, [2, 3]))
  })

  it('FE-MOB-PLSH-012: writes the new participant list back into the trip store', async () => {
    vi.spyOn(assignmentsApi, 'setParticipants').mockResolvedValue({ participants: [{ user_id: 1, username: 'ann' }, { user_id: 2, username: 'bob' }] })
    seedStore(useTripStore, { assignments: { '2': [dayAssignment(11, 2, [{ user_id: 1, username: 'ann' }])] } })
    const planner = makePlanner({ assignments: { '2': [dayAssignment(11, 2, [{ user_id: 1, username: 'ann' }])] } })
    renderSheet(planner)

    expect(screen.getByText('ann')).toBeInTheDocument()
    expect(screen.queryByText('bob')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.click(screen.getByText('bob'))
    await waitFor(() => expect(assignmentsApi.setParticipants).toHaveBeenCalledWith(5, 11, [1, 2]))
    await waitFor(() =>
      expect(useTripStore.getState().assignments['2'][0].participants).toEqual([
        { user_id: 1, username: 'ann' },
        { user_id: 2, username: 'bob' },
      ]),
    )
  })

  it('FE-MOB-PLSH-013: reports a failing participant update', async () => {
    vi.spyOn(assignmentsApi, 'setParticipants').mockRejectedValue(new Error('forbidden'))
    const { planner } = renderSheet()
    fireEvent.click(screen.getByText('bob'))
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('forbidden'))
  })

  it('FE-MOB-PLSH-014: prefers the explicitly selected assignment for the participant row', async () => {
    vi.spyOn(assignmentsApi, 'setParticipants').mockResolvedValue({ participants: [] })
    const planner = makePlanner({
      selectedAssignmentId: 12,
      assignments: { '2': [dayAssignment(11, 2), dayAssignment(12, 2)] },
    })
    renderSheet(planner)
    fireEvent.click(screen.getByText('ann'))
    await waitFor(() => expect(assignmentsApi.setParticipants).toHaveBeenCalledWith(5, 12, [2, 3]))
  })

  it('FE-MOB-PLSH-015: hides participants when the trip has a single member', () => {
    renderSheet(makePlanner({ tripMembers: [MEMBERS[0]] }))
    expect(screen.queryByText('Participants')).not.toBeInTheDocument()
  })

  it('FE-MOB-PLSH-016: counts only this place\'s live files and opens one', () => {
    renderSheet()
    expect(screen.getByText('2 files')).toBeInTheDocument()
    fireEvent.click(screen.getByText('2 files'))
    expect(screen.getByText('ticket.pdf')).toBeInTheDocument()
    expect(screen.getByText('map.png')).toBeInTheDocument()
    expect(screen.queryByText('deleted.pdf')).not.toBeInTheDocument()
    expect(screen.queryByText('other.pdf')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('ticket.pdf'))
    expect(openFile).toHaveBeenCalledWith('/uploads/files/ticket.pdf', 'ticket.pdf')
  })

  it('FE-MOB-PLSH-017: uploads every picked file against the place and expands the list', async () => {
    const planner = makePlanner({ files: [] })
    renderSheet(planner)
    expect(screen.getByText('Files')).toBeInTheDocument()
    // The files row itself is a button now (it expands the list), so match the
    // upload control by its exact name rather than a substring.
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }))

    const input = document.querySelector('input[type="file"][multiple]') as HTMLInputElement
    selectFiles(input, [new File(['a'], 'a.pdf'), new File(['b'], 'b.pdf')])

    await waitFor(() => expect(planner.tripActions.addFile).toHaveBeenCalledTimes(2))
    const fd = vi.mocked(planner.tripActions.addFile).mock.calls[0][1] as FormData
    expect(fd.get('place_id')).toBe('101')
    expect((fd.get('file') as File).name).toBe('a.pdf')
  })

  it('FE-MOB-PLSH-018: reports a failing file upload', async () => {
    const planner = makePlanner()
    vi.mocked(planner.tripActions.addFile).mockRejectedValue(new Error('too large'))
    renderSheet(planner)
    const input = document.querySelector('input[type="file"][multiple]') as HTMLInputElement
    selectFiles(input, [new File(['a'], 'a.pdf')])
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('Upload failed'))
  })

  it('FE-MOB-PLSH-019: uploads and removes the custom place image', async () => {
    const { planner } = renderSheet()
    const input = document.querySelector('input[type="file"][accept*="image"]') as HTMLInputElement
    const openPicker = vi.spyOn(input, 'click')
    fireEvent.click(screen.getByRole('button', { name: 'Change image' }))
    expect(openPicker).toHaveBeenCalledTimes(1)

    const picture = new File(['x'], 'front.png', { type: 'image/png' })
    selectFiles(input, [picture])
    await waitFor(() => expect(planner.tripActions.uploadPlaceImage).toHaveBeenCalledWith(5, 101, picture))

    fireEvent.click(screen.getByRole('button', { name: 'Remove image' }))
    await waitFor(() => expect(planner.tripActions.updatePlace).toHaveBeenCalledWith(5, 101, { image_url: null }))
  })

  it('FE-MOB-PLSH-020: reports a failing image upload and offers upload on a place without one', async () => {
    const planner = makePlanner({ selectedPlace: { ...PLACE, image_url: null } })
    vi.mocked(planner.tripActions.uploadPlaceImage).mockRejectedValue(new Error('unsupported'))
    renderSheet(planner)
    expect(screen.getByRole('button', { name: 'Upload image' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove image' })).not.toBeInTheDocument()

    const input = document.querySelector('input[type="file"][accept*="image"]') as HTMLInputElement
    selectFiles(input, [new File(['x'], 'front.png', { type: 'image/png' })])
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('Could not upload image'))
  })

  it('FE-MOB-PLSH-021: blocks the picker while an image request runs and reports its failure', async () => {
    const planner = makePlanner()
    let rejectUpdate: (err: Error) => void = () => {}
    vi.mocked(planner.tripActions.updatePlace).mockReturnValue(new Promise((_res, rej) => { rejectUpdate = rej }))
    renderSheet(planner)

    fireEvent.click(screen.getByRole('button', { name: 'Remove image' }))
    const input = document.querySelector('input[type="file"][accept*="image"]') as HTMLInputElement
    const openPicker = vi.spyOn(input, 'click')
    fireEvent.click(screen.getByRole('button', { name: 'Change image' }))
    expect(openPicker).not.toHaveBeenCalled()

    await act(async () => { rejectUpdate(new Error('nope')) })
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('Could not remove image'))
  })

  it('FE-MOB-PLSH-022: hands the place to the save-to-collection picker', () => {
    renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Save to Collection' }))
    expect(useSaveToCollectionStore.getState().target).toMatchObject({
      name: PLACE.name,
      source_trip_id: 5,
      source_place_id: 101,
      lat: 48.2038,
      lng: 16.3616,
    })
  })

  it('FE-MOB-PLSH-023: opens directions, the website and the map view', async () => {
    const shell = makeShell({ trTab: 'dateien', view: 'plan' })
    const { planner } = renderSheet(makePlanner(), shell)

    // A place with coordinates reaches more than one map app, so the circle
    // opens the picker instead of guessing which one was meant.
    fireEvent.click(screen.getByRole('button', { name: 'Navigation' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Google Maps' }))
    // Name and address rather than bare coordinates (#1278): the place has both,
    // so Google opens the entry instead of an unlabelled pin.
    expect(window.open).toHaveBeenCalledWith(
      'https://www.google.com/maps/search/?api=1&query=Kunsthistorisches%20Museum%2C%20Maria-Theresien-Platz', '_blank', 'noopener,noreferrer',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open Website' }))
    expect(window.open).toHaveBeenCalledWith('https://khm.at', '_blank', 'noopener,noreferrer')

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Show on map' })) })
    expect(planner.setSelectedPlaceId).toHaveBeenCalledWith(null)
    expect(shell.setTrTab).toHaveBeenCalledWith('plan')
    expect(shell.toggleView).toHaveBeenCalledTimes(1)
    expect(planner.setFitKey).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-PLSH-024: edits and deletes the place, both closing the sheet', () => {
    const { planner } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(planner.openPlaceEditor).toHaveBeenCalledWith(PLACE, 11)
    expect(planner.setSelectedPlaceId).toHaveBeenCalledWith(null)

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(planner.handleDeletePlace).toHaveBeenCalledWith(101)
    expect(planner.setSelectedPlaceId).toHaveBeenCalledTimes(2)
  })

  it('FE-MOB-PLSH-025: strips every editing affordance for a read-only member', () => {
    seedStore(useAddonStore, { addons: [] })
    renderSheet(makePlanner({ can: () => false, canUploadFiles: false }))
    expect(screen.queryByRole('button', { name: 'Change image' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove from Day' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add to Day' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Upload/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save to Collection' })).not.toBeInTheDocument()
    // Read-only members still get the navigation actions.
    expect(screen.getByRole('button', { name: 'Navigation' })).toBeInTheDocument()
  })

  it('FE-MOB-PLSH-026: collapses the track colour picker again when the sheet closes', () => {
    const place = { ...PLACE, route_geometry: 'x', route_color: null } as unknown as Place
    const planner = makePlanner({ selectedPlace: place })
    const shell = makeShell()
    const { rerender } = render(<MPlaceSheet planner={planner} shell={shell} />)

    fireEvent.click(screen.getByRole('button', { name: /Automatic color/ }))
    expect(screen.getAllByRole('button', { name: /Automatic color/ })[0]).toHaveAttribute('aria-expanded', 'true')

    // The component stays mounted across selections — only MSheet's children unmount.
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    rerender(<MPlaceSheet planner={makePlanner({ selectedPlace: null })} shell={shell} />)
    rerender(<MPlaceSheet planner={planner} shell={shell} />)

    expect(screen.getAllByRole('button', { name: /Automatic color/ })[0]).toHaveAttribute('aria-expanded', 'false')
  })

  // ── The booking attached to this stop (#2012) ──

  const bookingPlanner = (res: Record<string, unknown>) => makePlanner({
    selectedAssignmentId: 11,
    reservations: [res],
  })

  it('FE-MOB-PLSH-027: shows the booking attached to the day assignment (#2012)', () => {
    renderSheet(bookingPlanner({ id: 7, assignment_id: 11, title: 'Ferry to Corfu', status: 'pending', type: 'ferry' }))

    expect(screen.getByText('Ferry to Corfu')).toBeInTheDocument()
  })

  it('FE-MOB-PLSH-028: a transport booking opens the transport editor, not the reservation modal', () => {
    const planner = bookingPlanner({ id: 7, assignment_id: 11, title: 'Ferry to Corfu', status: 'pending', type: 'ferry', day_id: 2 })
    renderSheet(planner)

    fireEvent.click(screen.getByRole('button', { name: 'Edit Reservation' }))

    expect(planner.setEditingTransport).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }))
    expect(planner.setTransportModalDayId).toHaveBeenCalledWith(2)
    expect(planner.setShowTransportModal).toHaveBeenCalledWith(true)
    expect(planner.setShowReservationModal).not.toHaveBeenCalled()
    // and the place sheet gets out of the way
    expect(planner.setSelectedPlaceId).toHaveBeenCalledWith(null)
  })

  it('FE-MOB-PLSH-029: a non-transport booking opens the reservation modal', () => {
    const planner = bookingPlanner({ id: 8, assignment_id: 11, title: 'Museum tour', status: 'confirmed', type: 'activity' })
    renderSheet(planner)

    fireEvent.click(screen.getByRole('button', { name: 'Edit Reservation' }))

    expect(planner.setEditingReservation).toHaveBeenCalledWith(expect.objectContaining({ id: 8 }))
    expect(planner.setShowReservationModal).toHaveBeenCalledWith(true)
    expect(planner.setShowTransportModal).not.toHaveBeenCalled()
  })

  it('FE-MOB-PLSH-030: a viewer without edit rights sees the booking but gets no live button', () => {
    const planner = makePlanner({
      selectedAssignmentId: 11,
      reservations: [{ id: 7, assignment_id: 11, title: 'Ferry to Corfu', status: 'pending', type: 'ferry' }],
      can: vi.fn(() => false),
    })
    renderSheet(planner)

    // Still readable — just not a control that would do nothing when pressed.
    expect(screen.getByText('Ferry to Corfu')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit Reservation' })).not.toBeInTheDocument()
    const row = screen.getByText('Ferry to Corfu').closest('button') as HTMLButtonElement
    expect(row.disabled).toBe(true)
  })

  it('FE-MOB-PLSH-030b: day_edit alone is not enough for a plain booking, and vice versa', () => {
    // A ferry needs day_edit; a member who only has reservation_edit gets no button.
    const planner = makePlanner({
      selectedAssignmentId: 11,
      reservations: [{ id: 7, assignment_id: 11, title: 'Ferry to Corfu', status: 'pending', type: 'ferry' }],
      can: vi.fn((perm: string) => perm === 'reservation_edit'),
    })
    renderSheet(planner)

    const row = screen.getByText('Ferry to Corfu').closest('button') as HTMLButtonElement
    expect(row.disabled).toBe(true)
  })

  it('FE-MOB-PLSH-031: a booking on another assignment is not shown here', () => {
    renderSheet(bookingPlanner({ id: 9, assignment_id: 999, title: 'Someone elses ferry', status: 'pending', type: 'ferry' }))

    expect(screen.queryByText('Someone elses ferry')).not.toBeInTheDocument()
  })
})
