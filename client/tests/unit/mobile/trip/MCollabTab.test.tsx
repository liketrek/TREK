import { describe, expect, it, vi } from 'vitest'
import MCollabTab from '../../../../src/mobile/screens/trip/tabs/MCollabTab'
import type { MTripCollabTab, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { render, screen } from '../../../helpers/render'
import { setSizeClass } from '../../../helpers/sizeClass'

// FE-MOB-CTAB-001 to FE-MOB-CTAB-012

// The three sub-panels are self-contained (own API calls + WebSocket listener)
// and covered by their own suites — here only the routing is under test.
vi.mock('../../../../src/mobile/screens/trip/tabs/MCollabChat', () => ({
  default: ({ planner }: { planner: TripPlanner }) => <div data-testid="chat">{planner.tripId}</div>,
}))
vi.mock('../../../../src/mobile/screens/trip/tabs/MCollabNotes', () => ({
  default: ({ planner }: { planner: TripPlanner }) => <div data-testid="notes">{planner.tripId}</div>,
}))
vi.mock('../../../../src/mobile/screens/trip/tabs/MCollabPolls', () => ({
  default: ({ planner }: { planner: TripPlanner }) => <div data-testid="polls">{planner.tripId}</div>,
}))

function renderTab(collabTab: MTripCollabTab, features: Partial<Record<'chat' | 'notes' | 'polls', boolean>> = {}) {
  const planner = buildPlanner({
    collabFeatures: { chat: true, notes: true, polls: true, ...features } as TripPlanner['collabFeatures'],
  })
  return render(<MCollabTab planner={planner} shell={buildShell({ collabTab })} />)
}

describe('MCollabTab', () => {
  it('FE-MOB-CTAB-001: routes the chat sub-tab to MCollabChat', () => {
    renderTab('chat')

    expect(screen.getByTestId('chat')).toHaveTextContent('1')
    expect(screen.queryByTestId('notes')).not.toBeInTheDocument()
    expect(screen.queryByTestId('polls')).not.toBeInTheDocument()
  })

  it('FE-MOB-CTAB-002: routes the notes sub-tab to MCollabNotes', () => {
    renderTab('notes')

    expect(screen.getByTestId('notes')).toBeInTheDocument()
    expect(screen.queryByTestId('chat')).not.toBeInTheDocument()
  })

  it('FE-MOB-CTAB-003: routes the polls sub-tab to MCollabPolls', () => {
    renderTab('polls')

    expect(screen.getByTestId('polls')).toBeInTheDocument()
    expect(screen.queryByTestId('chat')).not.toBeInTheDocument()
  })

  it('FE-MOB-CTAB-004: shows the disabled notice instead of the chat panel', () => {
    renderTab('chat', { chat: false })

    expect(screen.getByText('mobileTrip.collabFeatureDisabled')).toBeInTheDocument()
    expect(screen.queryByTestId('chat')).not.toBeInTheDocument()
  })

  it('FE-MOB-CTAB-005: shows the disabled notice instead of the notes panel', () => {
    renderTab('notes', { notes: false })

    expect(screen.getByText('mobileTrip.collabFeatureDisabled')).toBeInTheDocument()
    expect(screen.queryByTestId('notes')).not.toBeInTheDocument()
  })

  it('FE-MOB-CTAB-006: shows the disabled notice instead of the polls panel', () => {
    renderTab('polls', { polls: false })

    expect(screen.getByText('mobileTrip.collabFeatureDisabled')).toBeInTheDocument()
    expect(screen.queryByTestId('polls')).not.toBeInTheDocument()
  })

  it('FE-MOB-CTAB-007: gates each sub-tab independently', () => {
    renderTab('polls', { chat: false, notes: false })

    expect(screen.getByTestId('polls')).toBeInTheDocument()
    expect(screen.queryByText('mobileTrip.collabFeatureDisabled')).not.toBeInTheDocument()
  })

  it('FE-MOB-CTAB-008: renders nothing for a sub-tab it does not handle', () => {
    const { container } = renderTab('whatsnext' as MTripCollabTab)

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText('mobileTrip.collabFeatureDisabled')).not.toBeInTheDocument()
  })

  it('FE-MOB-CTAB-010: with room for two panes the chat stays beside the board, and the chat tab shows the first board', () => {
    setSizeClass('split')
    const { rerender } = renderTab('chat')
    expect(screen.getByTestId('chat')).toBeInTheDocument()
    expect(screen.getByTestId('notes')).toBeInTheDocument()

    rerender(
      <MCollabTab
        planner={buildPlanner({ collabFeatures: { chat: true, notes: true, polls: true } as TripPlanner['collabFeatures'] })}
        shell={buildShell({ collabTab: 'polls' })}
      />,
    )
    expect(screen.getByTestId('chat')).toBeInTheDocument()
    expect(screen.getByTestId('polls')).toBeInTheDocument()
    expect(screen.queryByTestId('notes')).not.toBeInTheDocument()
  })

  it('FE-MOB-CTAB-011: without the chat there is nothing to stand beside, so the board takes the page', () => {
    setSizeClass('split')
    renderTab('polls', { chat: false })
    expect(screen.getByTestId('polls')).toBeInTheDocument()
    expect(screen.queryByTestId('chat')).not.toBeInTheDocument()
  })

  it('FE-MOB-CTAB-012: turning into two panes and back keeps the same chat, draft and scroll included', () => {
    renderTab('chat')
    const before = screen.getByTestId('chat')
    setSizeClass('split')
    expect(screen.getByTestId('notes')).toBeInTheDocument()
    expect(screen.getByTestId('chat')).toBe(before)
    setSizeClass('compact')
    expect(screen.queryByTestId('notes')).not.toBeInTheDocument()
    expect(screen.getByTestId('chat')).toBe(before)
  })
})
