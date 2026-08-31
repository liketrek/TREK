import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FolderOpen, Users } from 'lucide-react'
import MMehrSheet from '../../../../src/mobile/screens/trip/sheets/MMehrSheet'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import type { TripFile, TripMember } from '../../../../src/types'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { resetAllStores } from '../../../helpers/store'
import { fireEvent, render, screen } from '../../../helpers/render'

// FE-MOB-MEHR-001 to FE-MOB-MEHR-012
//
// The sheet takes its copy from the real TranslationProvider, so the visible
// strings are asserted in English.

const TABS = [
  { id: 'plan', label: 'Plan', icon: FolderOpen },
  { id: 'transports', label: 'Transport', icon: FolderOpen },
  { id: 'buchungen', label: 'Bookings', icon: FolderOpen },
  { id: 'finanzplan', label: 'Budget', icon: FolderOpen },
  { id: 'listen', label: 'Lists', icon: FolderOpen },
  { id: 'dateien', label: 'Files', icon: FolderOpen },
  { id: 'collab', label: 'Collaboration', icon: Users },
]

const FILES = [
  { id: 1, trip_id: 1, filename: 'a.pdf', deleted_at: null },
  { id: 2, trip_id: 1, filename: 'b.pdf', deleted_at: null },
  { id: 3, trip_id: 1, filename: 'gone.pdf', deleted_at: '2026-05-01T10:00:00Z' },
] as unknown as TripFile[]

const MEMBERS = [
  { user_id: 1, username: 'maurice', role: 'owner' },
  { user_id: 2, username: 'julien', role: 'editor' },
  { user_id: 3, username: 'guest', role: 'viewer' },
] as unknown as TripMember[]

function renderSheet(plannerOverrides: Partial<TripPlanner> = {}, shellOverrides: Partial<MTripShellApi> = {}) {
  const planner = buildPlanner({
    TRIP_TABS: TABS as TripPlanner['TRIP_TABS'],
    files: FILES,
    tripMembers: MEMBERS,
    ...plannerOverrides,
  })
  const shell = buildShell({ sheet: { id: 'mehr' }, ...shellOverrides })
  render(<MMehrSheet planner={planner} shell={shell} />)
  return { planner, shell }
}

describe('MMehrSheet', () => {
  beforeEach(() => {
    resetAllStores()
  })

  it('FE-MOB-MEHR-001: stays closed while another sheet id is active', () => {
    renderSheet({}, { sheet: { id: 'days' } })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-MEHR-002: opens as the "More" panel', () => {
    renderSheet()
    expect(screen.getByRole('dialog', { name: 'More' })).toBeInTheDocument()
  })

  it('FE-MOB-MEHR-003: only tiles the sections that are not in the dock', () => {
    renderSheet()
    expect(screen.getByRole('button', { name: /Files/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Collaboration/ })).toBeInTheDocument()
    for (const dockLabel of ['Plan', 'Transport', 'Bookings', 'Budget', 'Lists']) {
      expect(screen.queryByRole('button', { name: new RegExp(`^${dockLabel}`) })).not.toBeInTheDocument()
    }
  })

  it('FE-MOB-MEHR-004: counts only the files that are not in the trash', () => {
    renderSheet()
    expect(screen.getByText('2 files')).toBeInTheDocument()
  })

  it('FE-MOB-MEHR-005: counts the trip members on the collab tile', () => {
    renderSheet()
    expect(screen.getByText('3 people')).toBeInTheDocument()
  })

  it('FE-MOB-MEHR-006: a plugin tile gets the neutral tint and no stat line', () => {
    renderSheet({
      TRIP_TABS: [...TABS, { id: 'plugin:todos', label: 'Trip To-Dos', icon: FolderOpen }] as TripPlanner['TRIP_TABS'],
    })
    const tile = screen.getByRole('button', { name: /Trip To-Dos/ })
    expect(tile.textContent).toBe('Trip To-Dos')
    expect(tile.querySelector('[style]')).toHaveStyle({ color: '#68686F' })
  })

  it('FE-MOB-MEHR-007: survives a tab entry without an icon component', () => {
    renderSheet({ TRIP_TABS: [{ id: 'plugin:bare', label: 'Bare Plugin', icon: undefined }] as unknown as TripPlanner['TRIP_TABS'] })
    const tile = screen.getByRole('button', { name: 'Bare Plugin' })
    expect(tile.querySelector('svg')).toBeNull()
  })

  it('FE-MOB-MEHR-008: opening a section closes the sheet and switches the trip tab', () => {
    const { shell } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: /Files/ }))
    expect(shell.closeSheet).toHaveBeenCalledTimes(1)
    expect(shell.setTrTab).toHaveBeenCalledWith('dateien')
  })

  it('FE-MOB-MEHR-009: the action rows open rates, share, export and edit sheets', () => {
    const { shell } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Trip exchange rates' }))
    fireEvent.click(screen.getByRole('button', { name: 'Share Trip' }))
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit Trip' }))
    expect(shell.openSheet).toHaveBeenNthCalledWith(1, 'rates')
    expect(shell.openSheet).toHaveBeenNthCalledWith(2, 'members')
    expect(shell.openSheet).toHaveBeenNthCalledWith(3, 'export')
    expect(shell.openSheet).toHaveBeenNthCalledWith(4, 'tripedit')
  })

  it('shows the rate row only when the Costs addon tab is available', () => {
    renderSheet({
      TRIP_TABS: TABS.filter(tab => tab.id !== 'finanzplan') as TripPlanner['TRIP_TABS'],
    })
    expect(screen.queryByRole('button', { name: 'Trip exchange rates' })).not.toBeInTheDocument()
  })

  it('FE-MOB-MEHR-010: drops the edit row without the trip_edit permission', () => {
    const { planner } = renderSheet({ can: vi.fn(() => false) })
    expect(planner.can).toHaveBeenCalledWith('trip_edit', planner.trip)
    expect(screen.queryByRole('button', { name: 'Edit Trip' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Share Trip' })).toBeInTheDocument()
  })

  it('FE-MOB-MEHR-011: renders only the action rows when every section sits in the dock', () => {
    renderSheet({
      TRIP_TABS: TABS.filter(tab => tab.id !== 'dateien' && tab.id !== 'collab') as TripPlanner['TRIP_TABS'],
    })
    expect(screen.queryByText(/files$/)).not.toBeInTheDocument()
    const rows = screen.getByRole('button', { name: 'Share Trip' }).parentElement
    expect(rows).not.toHaveClass('mt-2')
  })

  it('FE-MOB-MEHR-012: separates the action rows from the tile grid when both are present', () => {
    renderSheet()
    const rows = screen.getByRole('button', { name: 'Share Trip' }).parentElement
    expect(rows).toHaveClass('mt-2')
  })
})
