// FE-PAGE-PLANNER-LAZY-001 to FE-PAGE-PLANNER-LAZY-002
//
// Every planner panel loads as a chunk of its own. The targets are stubbed so
// each loader, and each hop to a named export, is checked by what it renders.
import { createElement, Suspense, type ComponentType } from 'react'
import { render, screen } from '@testing-library/react'
import * as lazy from './plannerLazy'

// Hoisted with the mocks: each stub renders a line of text naming its module.
const label = vi.hoisted(() => (text: string) => () => text)

vi.mock('../../components/Planner/ReservationsPanel', () => ({ default: label('reservations panel') }))
vi.mock('../../components/Packing/PackingListPanel', () => ({ default: label('packing list panel') }))
vi.mock('../../components/Todo/TodoListPanel', () => ({ default: label('todo list panel') }))
vi.mock('../../components/Files/FileManager', () => ({ default: label('file manager') }))
vi.mock('../../components/Budget/CostsPanel', () => ({ default: label('costs panel'), ExpenseModal: label('expense modal') }))
vi.mock('../../components/Collab/CollabPanel', () => ({ default: label('collab panel') }))
vi.mock('../../components/Roadtrip/RoadtripSidebar', () => ({ default: label('roadtrip sidebar') }))
vi.mock('../../components/Roadtrip/RoadtripCorridorPanel', () => ({ default: label('roadtrip corridor panel') }))
vi.mock('../../components/Roadtrip/RoadtripLimitsCard', () => ({ default: label('roadtrip limits card') }))
vi.mock('../../components/Roadtrip/RoadtripStopPopup', () => ({ default: label('roadtrip stop popup') }))
vi.mock('../../components/Roadtrip/RoadtripStayModal', () => ({ default: label('roadtrip stay modal') }))
vi.mock('../../components/Roadtrip/RoadtripTrackModal', () => ({ default: label('roadtrip track modal') }))
vi.mock('../../components/Roadtrip/RoadtripAlternativesBar', () => ({ default: label('roadtrip alternatives bar') }))
vi.mock('../../components/Tours/planner/TourPlannerPanels', () => ({
  TourPlannerRail: label('tour planner rail'),
  TourPlannerToursRail: label('tour planner tours rail'),
}))
vi.mock('../../components/Planner/TransportModal', () => ({ TransportModal: label('transport modal') }))

const cases: Array<[keyof typeof lazy, string]> = [
  ['ReservationsPanel', 'reservations panel'],
  ['PackingListPanel', 'packing list panel'],
  ['TodoListPanel', 'todo list panel'],
  ['FileManager', 'file manager'],
  ['CostsPanel', 'costs panel'],
  ['ExpenseModal', 'expense modal'],
  ['CollabPanel', 'collab panel'],
  ['RoadtripSidebar', 'roadtrip sidebar'],
  ['RoadtripCorridorPanel', 'roadtrip corridor panel'],
  ['RoadtripLimitsCard', 'roadtrip limits card'],
  ['RoadtripStopPopup', 'roadtrip stop popup'],
  ['RoadtripStayModal', 'roadtrip stay modal'],
  ['RoadtripTrackModal', 'roadtrip track modal'],
  ['RoadtripAlternativesBar', 'roadtrip alternatives bar'],
  ['TourPlannerRail', 'tour planner rail'],
  ['TourPlannerToursRail', 'tour planner tours rail'],
  ['TransportModal', 'transport modal'],
]

function renderLazy(name: keyof typeof lazy) {
  const Panel = lazy[name] as ComponentType
  return render(createElement(Suspense, { fallback: 'loading' }, createElement(Panel)))
}

describe('plannerLazy', () => {
  it('FE-PAGE-PLANNER-LAZY-001: every panel the planner loads on demand is listed here', () => {
    expect(Object.keys(lazy).sort()).toEqual(cases.map(([name]) => name).sort())
  })

  it.each(cases)('FE-PAGE-PLANNER-LAZY-002: %s loads its own component', async (name, text) => {
    renderLazy(name)
    expect(await screen.findByText(text)).toBeInTheDocument()
  })
})
