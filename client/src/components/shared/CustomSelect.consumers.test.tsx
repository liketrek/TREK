import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { TourListItem } from '@trek/shared'
import { TranslationProvider } from '../../i18n/TranslationContext'
import { TourPlannerRail, TourPlannerToursRail } from '../Tours/planner/TourPlannerPanels'
import type { TourPlannerController } from '../Tours/planner/useTourPlanner'
import ToursSidebar from '../Tours/ToursSidebar'
import type { Day } from '../../types'
import CustomSelect from './CustomSelect'

vi.mock('../../repo/tourRepo', () => ({ tourRepo: {} }))
vi.mock('../../store/settingsStore', () => ({
  useSettingsStore: (selector: (state: { settings: { language: string; distance_unit: string } }) => unknown) =>
    selector({ settings: { language: 'en', distance_unit: 'metric' } }),
}))
vi.mock('../../store/tripStore', () => ({
  useTripStore: (selector: (state: { loadTrip: () => Promise<void> }) => unknown) =>
    selector({ loadTrip: vi.fn() }),
}))

const tour: TourListItem = {
  place_id: 42, name: 'Ridge walk', tour_type: 'hike', distance: 4,
  elevation_gain: 100, elevation_loss: 80, duration: 60, difficulty: null,
  wanderer_ref: null, match_confidence: 1,
  max_hiking_difficulty: 2, planned: false, caution: false,
}
const days = [{ id: 7, trip_id: 1, day_number: 1, title: 'Summit day', date: '2026-05-15' } as Day]

function planner(overrides: Partial<TourPlannerController> = {}): TourPlannerController {
  return {
    mode: { type: 'new-draft' }, maxHikingDifficulty: 2,
    setMaxHikingDifficulty: vi.fn(), name: '', setName: vi.fn(),
    status: 'empty', waypoints: [], route: [], routeAnalysis: null,
    distanceMeters: 0, durationSeconds: 0, hasUnsavedChanges: false,
    elevationProfileExpanded: false, readOnlyGpxTour: null,
    saveOutcome: null, returnToNeutral: vi.fn(), startNewTour: vi.fn(),
    ...overrides,
  } as TourPlannerController
}

describe('CustomSelect consumer contracts', () => {
  it('renders the real labelled T1-T6 selector and updates difficulty through the merged select', async () => {
    const user = userEvent.setup()
    const setDifficulty = vi.fn()
    function DifficultyRail() {
      const [difficulty, setDifficultyState] = useState<number>(2)
      return <TourPlannerRail planner={planner({
        maxHikingDifficulty: difficulty,
        setMaxHikingDifficulty: next => { setDifficulty(next); setDifficultyState(next) },
      })} canEdit />
    }
    render(<TranslationProvider><DifficultyRail /></TranslationProvider>)
    const trigger = screen.getByRole('button', { name: 'Maximum trail difficulty' })
    expect(screen.getByLabelText('Maximum trail difficulty')).toBe(trigger)
    expect(trigger).toHaveAttribute('id', 'tour-planner-difficulty')
    expect(document.querySelectorAll('[id="tour-planner-difficulty"]')).toHaveLength(1)
    await user.click(trigger)
    const menu = within(document.getElementById(trigger.getAttribute('aria-controls')!)!)
    for (const difficulty of [1, 2, 3, 4, 5, 6]) {
      expect(menu.getByRole('button', { name: new RegExp(`^T${difficulty}`) })).toBeInTheDocument()
    }
    await user.click(menu.getByRole('button', { name: /^T3/ }))
    expect(setDifficulty).toHaveBeenCalledWith(3)
    expect(trigger).toHaveTextContent('T3')
    expect(trigger).toHaveFocus()
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: /^T4/ }))
    expect(screen.getByRole('heading', { name: 'Enable alpine routing?' })).toBeInTheDocument()
    expect(setDifficulty).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Enable alpine routing' }))
    expect(setDifficulty).toHaveBeenLastCalledWith(4)
  })

  it('routes post-save assignment through the Tour-row menu and resolves numeric day ids', async () => {
    const user = userEvent.setup()
    const onAssignToDay = vi.fn().mockResolvedValue(undefined)
    render(<TranslationProvider><TourPlannerToursRail
      canAssign
      planner={planner({ saveOutcome: tour, editingPlaceId: 42 })}
      tours={[tour]} days={days} loading={false} onAssignToDay={onAssignToDay} onViewGpxTour={vi.fn()}
    /></TranslationProvider>)
    const saveBanner = screen.getByText('Tour saved').closest('[role="status"]') as HTMLElement
    expect(within(saveBanner).getByRole('button', { name: 'Plan another' })).toBeInTheDocument()
    expect(within(saveBanner).queryByRole('button', { name: 'Assign to a day' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add to day: Ridge walk' }))
    const dayOption = screen.getByRole('button', { name: /Summit day/ })
    expect(dayOption).toHaveTextContent(/Day 1/)
    await user.click(dayOption)
    expect(onAssignToDay).toHaveBeenCalledWith(42, 7)
  })

  it('keeps the real ADD Tours All/Unplanned/Planned filters working', async () => {
    const user = userEvent.setup()
    render(<TranslationProvider><ToursSidebar tripId={1} days={days}
      tours={[tour, { ...tour, place_id: 43, name: 'Planned walk', planned: true }]}
      onAssignToDay={vi.fn()} onSelectTour={vi.fn()}
    /></TranslationProvider>)
    expect(screen.getAllByRole('option')).toHaveLength(2)
    const filter = screen.getByRole('button', { name: 'Show' })
    await user.click(filter)
    await user.click(screen.getByRole('button', { name: /Unplanned\s*1/ }))
    expect(screen.getByRole('option', { name: /Ridge walk/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Planned walk/ })).toBeNull()
    await user.click(filter)
    await user.click(screen.getByRole('button', { name: /Planned\s*1/ }))
    expect(screen.getByRole('option', { name: /Planned walk/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Ridge walk/ })).toBeNull()
    await user.click(filter)
    await user.click(screen.getByRole('button', { name: /All\s*2/ }))
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('preserves the Places filter select contract with labels, badges and compact sizing', async () => {
    const user = userEvent.setup()
    const setFilter = vi.fn()
    function PlacesFilter() {
      const [filter, updateFilter] = useState<string | number>('all')
      return <CustomSelect size="sm" value={filter}
        onChange={next => { setFilter(next); updateFilter(next) }}
        options={[
          { value: 'all', label: 'All', badge: '3' },
          { value: 'unplanned', label: 'Unplanned', badge: '2' },
          { value: 'planned', label: 'Planned', badge: '1' },
        ]}
      />
    }
    render(<PlacesFilter />)
    await user.click(screen.getByRole('button', { name: /^All\s*3$/ }))
    await user.click(screen.getByRole('button', { name: /^Unplanned\s*2$/ }))
    expect(setFilter).toHaveBeenCalledWith('unplanned')
    expect(screen.getByRole('button', { name: /^Unplanned\s*2$/ })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: /^Unplanned\s*2$/ }))
    await user.click(screen.getByRole('button', { name: /^Planned\s*1$/ }))
    expect(setFilter).toHaveBeenLastCalledWith('planned')
  })
})