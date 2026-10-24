/**
 * FE-AI-VACAY-010 to FE-AI-VACAY-016
 *
 * The vacation card as the chat draws it: an answer as a month calendar with
 * the days left and the way into Vacay, a change card's vacation rows under
 * one calendar whose held days are taken in or left out with a tap, the days
 * left following the choice, each row's facts, a decided card, the phone,
 * where one month fills the row, and held days that wait while the chat runs.
 */
import type { AssistantApplied, AssistantChangeVerbKey, VacayCard, VacayCardProposal } from '@trek/shared';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildUser } from '../../../../../tests/helpers/factories';
import { act, fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { chatOf, useAssistantStore } from '../../../../store/assistantStore';
import { useAuthStore } from '../../../../store/authStore';
import AssistantChangeCard from '../../AssistantChangeCard';
import type { ChangeItem } from '../../assistantParts';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import VacayAnswerBlock from './VacayAnswerBlock';
import VacayRowFacts from './VacayRowFacts';

const TRIP = 4;
const AUTH = useAuthStore.getState();
const INITIAL = useAssistantStore.getState();

const proposal = (over: Partial<VacayCardProposal> = {}): VacayCardProposal => ({
  date: '2026-10-27',
  personId: 7,
  kind: 'vacation',
  fraction: 1,
  outcome: 'add',
  before: null,
  periodYear: 2026,
  notes: [],
  deltas: [{ personId: 7, year: 2026, days: 1 }],
  ...over,
});

const card = (over: Partial<VacayCard> = {}): VacayCard => ({
  kind: 'vacay',
  months: [{ year: 2026, month: 10 }],
  weekStart: 1,
  weekendDays: [0, 6],
  people: [
    { id: 7, name: 'Ana', avatarKey: null, color: '#6366f1' },
    { id: 8, name: 'Ben', avatarKey: null, color: '#ec4899' },
  ],
  days: [
    { date: '2026-10-26', personId: 7, fraction: 1, kind: 'vacation' },
    { date: '2026-10-29', personId: 8, fraction: 1, kind: 'vacation' },
  ],
  company: [],
  holidays: [{ date: '2026-10-03', name: 'Unity Day', color: null }],
  tripDates: ['2026-10-28'],
  proposal: null,
  balances: [
    {
      personId: 7,
      year: 2026,
      total: 30,
      used: 29,
      comp: 0,
      totalAfter: null,
      windowStart: '2026-01-01',
      windowEnd: '2027-01-01',
    },
  ],
  otherDays: 0,
  ...over,
});

function row(
  id: string,
  verbKey: AssistantChangeVerbKey,
  held: VacayCardProposal,
  state: ChangeItem['state'] = 'pending'
): ChangeItem {
  const applied: AssistantApplied | null =
    state === 'applied' ? { toolCallId: id, entity: 'vacay', ids: [], dayId: null, undoUntil: null } : null;
  return {
    toolCallId: id,
    preview: { toolCallId: id, verbKey, subject: held.date, rows: [], dayId: null, placeIds: [], undoable: false },
    applied,
    state,
    card: card({ proposal: held }),
  };
}

function inView(ui: ReactElement, view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: TRIP, variant: 'window', ...view };
  return render(<AssistantViewContext.Provider value={value}>{ui}</AssistantViewContext.Provider>);
}

const decide = vi.fn(async () => {});

beforeEach(() => {
  useAuthStore.setState({ user: buildUser({ id: 7 }) });
  useAssistantStore.setState({
    decide,
    byTrip: { [TRIP]: { ...chatOf(useAssistantStore.getState(), TRIP), threadId: 1 } },
  });
});

afterEach(() => {
  useAuthStore.setState(AUTH, true);
  useAssistantStore.setState(INITIAL, true);
  vi.clearAllMocks();
});

describe('the vacation card', () => {
  it('FE-AI-VACAY-010: an answer shows its month, a legend, the days left and the way into Vacay on its year', () => {
    const onOpen = vi.fn();
    inView(<VacayAnswerBlock cards={[{ toolCallId: 'r1', card: card({ otherDays: 2 }) }]} />, { onOpen });
    expect(screen.getByRole('group', { name: 'October 2026' })).toBeInTheDocument();
    expect(screen.getAllByText('You').length).toBeGreaterThan(1);
    for (const label of ['Ben', 'Public Holiday', 'This trip', '2 more days off this year', '29 of 30 used']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('1 day left')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '29 used, 0 planned, 1 left of 30' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Open in Vacay/ }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'page', path: '/vacay?year=2026' });
  });

  it('FE-AI-VACAY-011: held days sit on the calendar; a free one starts left out and a tap takes it in', () => {
    inView(
      <AssistantChangeCard
        items={[
          row('c1', 'addVacationDay', proposal()),
          row('c2', 'removeVacationDay', proposal({ date: '2026-10-26', outcome: 'remove', deltas: [] })),
          row('c3', 'addVacationDay', proposal({ date: '2026-10-03', notes: ['publicHoliday'] })),
        ]}
      />
    );
    const taken = screen.getByRole('button', { name: 'Tue, Oct 27: Take a day off' });
    const free = screen.getByRole('button', { name: 'Sat, Oct 3: Take a day off' });
    expect(taken).toHaveAttribute('aria-pressed', 'true');
    expect(free).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Mon, Oct 26: Cancel a day off' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply 2' })).toBeEnabled();
    expect(screen.getByText('Public holiday, no leave needed')).toBeInTheDocument();

    fireEvent.click(free);
    expect(screen.getByRole('button', { name: 'Sat, Oct 3: Take a day off' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Apply 3' }));
    expect(decide).toHaveBeenCalledWith(TRIP, [
      { toolCallId: 'c1', approved: true },
      { toolCallId: 'c2', approved: true },
      { toolCallId: 'c3', approved: true },
    ]);
  });

  it('FE-AI-VACAY-012: the days left follow the choice, up to a warning past the allowance', () => {
    inView(
      <AssistantChangeCard
        items={[row('c1', 'addVacationDay', proposal()), row('c2', 'addVacationDay', proposal({ date: '2026-10-28' }))]}
      />
    );
    expect(screen.getByText('Uses 2 days')).toBeInTheDocument();
    expect(screen.getByText('Over by 1 day')).toBeInTheDocument();
    expect(screen.getByText('0 days left')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Wed, Oct 28: Take a day off' }));
    expect(screen.queryByText('Over by 1 day')).toBeNull();
    expect(screen.getByText('Uses 1 day')).toBeInTheDocument();
  });

  it("FE-AI-VACAY-013: a row says how much of the day, whose day when it is not the user's, and a new allowance", () => {
    const halfForBen = proposal({
      personId: 8,
      outcome: 'convert',
      fraction: 0.5,
      before: { fraction: 1, kind: 'vacation' },
      notes: ['weekend'],
    });
    const item = row('c1', 'changeVacationDay', halfForBen);
    const view = inView(<VacayRowFacts card={card({ proposal: halfForBen })} item={item} />);
    expect(screen.getByText('Full day')).toHaveClass('line-through');
    expect(screen.getByText('Half day')).toBeInTheDocument();
    expect(screen.getByText('Ben')).toBeInTheDocument();
    expect(screen.getByText('Weekend day, counts as leave')).toBeInTheDocument();
    view.unmount();

    // A company holiday while they are off in the plan: the tool writes it anyway, the row warns.
    const off = proposal({ personId: null, kind: 'company', deltas: [], notes: ['companyOff'] });
    const company = inView(<VacayRowFacts card={card({ proposal: off })} item={item} />);
    expect(screen.getByText('Company holidays are turned off in this plan')).toBeInTheDocument();
    company.unmount();

    // The allowance alone: the totals 30 and 33 both hold the 2 days carried over.
    const balance = { ...card().balances[0], carried: 2, totalAfter: 33 };
    const allowance = card({ months: [], balances: [balance] });
    inView(<VacayRowFacts card={allowance} item={item} />);
    expect(screen.getByText('28')).toHaveClass('line-through');
    expect(screen.getByText('31')).toBeInTheDocument();
  });

  it('FE-AI-VACAY-014: a decided card shows what was applied, without taps, and its receipt opens Vacay', () => {
    const onOpen = vi.fn();
    inView(<AssistantChangeCard items={[row('c1', 'addVacationDay', proposal(), 'applied')]} />, { onOpen });
    expect(screen.queryByRole('button', { name: /Take a day off/ })).toBeNull();
    expect(screen.getByText('0 days left')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open in Vacay' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'page', path: '/vacay?year=2026' });
  });

  it('FE-AI-VACAY-015: on the phone one month fills the row and a cell takes a finger', () => {
    const { container } = inView(<AssistantChangeCard items={[row('c1', 'addVacationDay', proposal())]} />, {
      variant: 'fullscreen',
    });
    expect(container.querySelector('li.w-full')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Tue, Oct 27: Take a day off' })).toHaveClass('size-9');
  });

  it('FE-AI-VACAY-016: while the chat runs a held day waits, and takes a tap again once it ends', () => {
    inView(<AssistantChangeCard items={[row('c1', 'addVacationDay', proposal())]} />);
    const cell = { name: 'Tue, Oct 27: Take a day off' };
    const running = (isRunning: boolean) =>
      act(() => useAssistantStore.setState((s) => ({ byTrip: { [TRIP]: { ...chatOf(s, TRIP), isRunning } } })));
    expect(screen.getByRole('button', cell)).toBeInTheDocument();
    running(true);
    expect(screen.queryByRole('button', cell)).toBeNull();
    // The day stays on the calendar and in the list read aloud.
    expect(screen.getByText('Tue, Oct 27: Take a day off')).toBeInTheDocument();
    running(false);
    expect(screen.getByRole('button', cell)).toBeInTheDocument();
  });
});
