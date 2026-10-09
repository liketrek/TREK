import React, { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '../../../tests/helpers/render'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TourListItem } from '@trek/shared'
import { buildPlace } from '../../../tests/helpers/factories'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { useSettingsStore } from '../../store/settingsStore'
import TourDetailDialog from './TourDetailDialog'

vi.mock('../../../../server/src/config', () => { throw new Error('Config initialization is forbidden in client tests') })
vi.mock('../../../../server/src/db/database', () => { throw new Error('Legacy database imports are forbidden in client tests') })
vi.mock('better-sqlite3', () => { throw new Error('SQLite imports are forbidden in client tests') })

const place = buildPlace({
  id: 42,
  name: 'Ridge walk',
  lat: 48,
  lng: 11,
  notes: 'Bring water',
  route_geometry: JSON.stringify([
    [48, 11, 500],
    [48, 11.01, 550],
    [48, 11.03, 520],
  ]),
})

const tour: TourListItem = {
  place_id: 42,
  name: 'Ridge walk',
  tour_type: 'hike',
  distance: 999,
  elevation_gain: 999,
  elevation_loss: 999,
  duration: null,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: null,
  max_hiking_difficulty: 2,
  planned: false,
  caution: false,
}

const defaultProps = {
  canEdit: true,
  canAssign: true,
  tour,
  place,
  onClose: vi.fn(),
  onUpdatePlace: vi.fn().mockResolvedValue(undefined),
  onAssignToDay: vi.fn(),
  onRemoveAssignment: vi.fn(),
  onDelete: vi.fn(),
}

beforeEach(() => {
  resetAllStores()
  vi.clearAllMocks()
  seedStore(useSettingsStore, { settings: { distance_unit: 'metric' } })
})

describe('TourDetailDialog', () => {
  it('keeps desktop detail non-modal and returns focus to its Tour row on Escape', async () => {
    const opener = document.createElement('button')
    opener.textContent = 'Open Tour'
    document.body.appendChild(opener)
    const onClose = vi.fn()
    function DesktopDetail() {
      const [open, setOpen] = useState(true)
      return open ? <TourDetailDialog {...defaultProps} desktopNonModal desktopFocusReturnTarget={opener}
        onClose={() => { onClose(); setOpen(false) }} /> : null
    }

    const view = render(<DesktopDetail />)
    const close = screen.getByRole('button', { name: 'Close' })
    expect(close).toHaveClass('focus-visible:outline')
    expect(document.querySelector('[aria-modal="true"]')).toBeNull()
    expect(document.querySelector('.trek-modal-backdrop')).toBeNull()
    expect(document.body.style.overflow).toBe('')
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    close.dispatchEvent(tab)
    expect(tab.defaultPrevented).toBe(false)

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByText('Ridge walk')).not.toBeInTheDocument())
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(document.activeElement).toBe(opener)
    view.unmount()
    document.body.removeChild(opener)
  })

  it('shows only curated tour content and uses live geometry instead of cached tour metrics', () => {
    render(<TourDetailDialog {...defaultProps} />)

    expect(screen.getByText('Ridge walk')).toBeInTheDocument()
    expect(screen.getByText('Minimum altitude')).toBeInTheDocument()
    expect(screen.getByText('Maximum altitude')).toBeInTheDocument()
    expect(screen.getByText('Ascent')).toBeInTheDocument()
    expect(screen.getByText('Descent')).toBeInTheDocument()
    expect(screen.getByText('50 m')).toBeInTheDocument()
    expect(screen.getByText('30 m')).toBeInTheDocument()
    expect(screen.queryByText('999 m')).not.toBeInTheDocument()
    expect(screen.getByText('Bring water')).toBeInTheDocument()
    expect(screen.queryByText('Opening Hours')).not.toBeInTheDocument()
    expect(screen.queryByText('Participants')).not.toBeInTheDocument()
  })

  it('RS-01: shows Tour description and classified HTTPS information link without fetching it', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    render(
      <TourDetailDialog
        {...defaultProps}
        tour={{ ...tour, description: 'Ridge above the lake', website: 'https://www.komoot.com/tour/42' }}
        place={{ ...place, description: 'Ridge above the lake', website: 'https://www.komoot.com/tour/42' }}
      />
    )

    expect(screen.getByText('Ridge above the lake')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Komoot · komoot.com' })
    expect(link).toHaveAttribute('href', 'https://www.komoot.com/tour/42')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow')
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('RS-02: labels calculated walking time and planned total as separate values', () => {
    render(<TourDetailDialog {...defaultProps} tour={{ ...tour, duration: 60, break_additional_minutes: 35, planned_duration_minutes: 125 }} />)

    expect(screen.getByText('Walking time: 1 h')).toBeInTheDocument()
    expect(screen.getByText('Breaks / additional time: 35 min')).toBeInTheDocument()
    expect(screen.getByText('Planned total duration: 2 h 5 min · Manual override')).toBeInTheDocument()
  })

  it('RS-01: rejects an unsafe legacy Tour website for rendering', () => {
    render(
      <TourDetailDialog
        {...defaultProps}
        tour={{ ...tour, website: 'javascript:alert(1)' }}
        place={{ ...place, website: 'javascript:alert(1)' }}
      />
    )
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('uses existing assignment callbacks for add and remove actions', () => {
    const { rerender } = render(<TourDetailDialog {...defaultProps} days={[{ id: 7 } as never]} selectedDayId={7} />)
    fireEvent.click(screen.getByRole('button', { name: /Add to Day/i }))
    expect(defaultProps.onAssignToDay).toHaveBeenCalledWith(42)

    rerender(<TourDetailDialog {...defaultProps} days={[{ id: 7 } as never]} selectedDayId={7} assignments={{ '7': [{ id: 9, place }] as never }} />)
    fireEvent.click(screen.getByRole('button', { name: /Remove from Day/i }))
    expect(defaultProps.onRemoveAssignment).toHaveBeenCalledWith(7, 9)
  })

  it('requires place-edit permission for deletion while retaining day-edit assignment removal', () => {
    render(<TourDetailDialog
      {...defaultProps}
      canEdit={false}
      canAssign={true}
      days={[{ id: 7 } as never]}
      selectedDayId={7}
      assignments={{ '7': [{ id: 9, place }] as never }}
    />)

    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Remove from Day/i }))
    expect(defaultProps.onRemoveAssignment).toHaveBeenCalledWith(7, 9)
    expect(defaultProps.onDelete).not.toHaveBeenCalled()
  })

  it('renames through the supplied place update path', async () => {
    render(<TourDetailDialog {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    const input = screen.getByDisplayValue('Ridge walk')
    fireEvent.change(input, { target: { value: 'New route name' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(defaultProps.onUpdatePlace).toHaveBeenCalledWith(42, { name: 'New route name' })
  })

  it('labels GPX imports as view-only planner content', () => {
    render(<TourDetailDialog {...defaultProps} tour={{ ...tour, has_waypoints: false }} />)

    expect(screen.getByText('GPX import')).toBeInTheDocument()
    expect(screen.getByText('GPX tours are view-only and cannot be edited in the planner yet.')).toBeInTheDocument()
  })
})
