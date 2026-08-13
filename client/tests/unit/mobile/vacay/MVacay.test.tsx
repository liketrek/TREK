// FE-MOB-MVACSCR-001 to FE-MOB-MVACSCR-021
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '../../../helpers/render';
import MVacay from '../../../../src/mobile/screens/vacay/MVacay';
import type { DayVisualContext } from '../../../../src/mobile/screens/vacay/vacayDayModel';

const mocks = vi.hoisted(() => ({ v: {} as Record<string, unknown> }));

vi.mock('../../../../src/mobile/screens/vacay/useMVacay', () => ({
  useMVacay: () => mocks.v,
}));

interface SheetStubProps { open: boolean; onClose: () => void }

vi.mock('../../../../src/mobile/screens/vacay/MVacayInviteSheet', () => ({
  default: ({ open, onClose }: SheetStubProps) => (
    <div data-testid="invite-sheet" data-open={String(open)}>
      <button type="button" onClick={onClose}>close-invite</button>
    </div>
  ),
}));
vi.mock('../../../../src/mobile/screens/vacay/MVacaySettingsSheet', () => ({
  default: ({ open, onClose }: SheetStubProps) => (
    <div data-testid="settings-sheet" data-open={String(open)}>
      <button type="button" onClick={onClose}>close-settings</button>
    </div>
  ),
}));
vi.mock('../../../../src/mobile/screens/vacay/MVacayShareSheet', () => ({
  default: ({ open, onClose }: SheetStubProps) => (
    <div data-testid="share-sheet" data-open={String(open)}>
      <button type="button" onClick={onClose}>close-share</button>
    </div>
  ),
}));

const dayCtx: DayVisualContext = {
  todayStr: '2099-01-01',
  entryMap: {},
  companyHolidaySet: new Set(),
  companyHolidaysEnabled: true,
  holidays: {},
  weekendDays: [0, 6],
};

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The screen flips the modifier flags with an updater, so the mock has to run it. */
function boolSetter() {
  return vi.fn((update: boolean | ((prev: boolean) => boolean)) => {
    if (typeof update === 'function') update(false);
  });
}

function buildV(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    loading: false,
    plan: { id: 1, holiday_calendars: [] },
    selectedYear: 2026,
    users: [
      { id: 1, username: 'alice', color: '#3b82f6' },
      { id: 2, username: 'bob', color: null },
    ],
    isFused: false,
    currentUser: { id: 1, username: 'alice' },
    incomingInvites: [],
    acceptInvite: vi.fn((_planId: number) => undefined),
    declineInvite: vi.fn((_planId: number) => undefined),
    incomingShares: [],
    toggleShareHidden: vi.fn((_id: number, _hidden: boolean) => undefined),
    view: 'grid',
    months: Array.from({ length: 12 }, (_, m) => ({ year: 2026, month: m })),
    monthSlot: 5,
    activeMonth: { year: 2026, month: 5 },
    isShiftedYear: false,
    mode: 'vacation',
    halfDay: false,
    setHalfDay: boolSetter(),
    compDay: false,
    setCompDay: boolSetter(),
    sheet: null,
    setSheet: vi.fn(() => undefined),
    setMode: vi.fn(() => undefined),
    setMonthSlot: vi.fn((_slot: number) => undefined),
    tripDates: new Set<string>(),
    tripDotColor: '#3b82f6',
    blockWeekends: true,
    companyHolidaysEnabled: true,
    holidaysEnabled: false,
    weekStart: 1,
    weekendDays: [0, 6],
    dayCtx,
    monthNamesShort: MONTHS_SHORT,
    monthNameLong: 'June',
    selectedUser: { id: 1, username: 'alice', color: '#3b82f6' },
    selectedColor: '#3b82f6',
    selectedStat: { user_id: 1, vacation_days: 30, used: 4, total_available: 30, remaining: 26, carried_over: 0 },
    selectedUserId: 1,
    selectPerson: vi.fn((_id: number) => undefined),
    handleDayTap: vi.fn(async (_date: string) => {}),
    openMonthSlot: vi.fn((_slot: number) => undefined),
    allowInc: vi.fn(() => undefined),
    allowDec: vi.fn(() => undefined),
    prevYear: vi.fn(async () => {}),
    nextYear: vi.fn(async () => {}),
    prevMonth: vi.fn(() => undefined),
    nextMonth: vi.fn(() => undefined),
    toggleView: vi.fn(() => undefined),
    goBack: vi.fn(() => undefined),
    ...over,
  };
}

beforeEach(() => {
  mocks.v = buildV();
});

describe('MVacay', () => {
  it('FE-MOB-MVACSCR-001: shows only a spinner while the plan is loading', () => {
    mocks.v = buildV({ loading: true });
    const { container } = render(<MVacay />);

    expect(container.querySelector('.animate-spin')).not.toBeNull();
    expect(screen.queryByText('2026')).not.toBeInTheDocument();
  });

  it('FE-MOB-MVACSCR-002: renders the year header and wires its buttons', () => {
    render(<MVacay />);

    expect(screen.getByText('2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Previous year' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next year' }));
    expect(mocks.v.prevYear).toHaveBeenCalledTimes(1);
    expect(mocks.v.nextYear).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-MVACSCR-003: the header icons open the invite, share and settings sheets', () => {
    render(<MVacay />);

    fireEvent.click(screen.getByRole('button', { name: 'Invite User' }));
    fireEvent.click(screen.getByRole('button', { name: 'Shared Calendars' }));
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    expect(mocks.v.setSheet).toHaveBeenNthCalledWith(1, 'invite');
    expect(mocks.v.setSheet).toHaveBeenNthCalledWith(2, 'share');
    expect(mocks.v.setSheet).toHaveBeenNthCalledWith(3, 'settings');
  });

  it('FE-MOB-MVACSCR-004: passes the open sheet down to the matching child only', () => {
    mocks.v = buildV({ sheet: 'settings' });
    render(<MVacay />);

    expect(screen.getByTestId('settings-sheet')).toHaveAttribute('data-open', 'true');
    expect(screen.getByTestId('invite-sheet')).toHaveAttribute('data-open', 'false');
    expect(screen.getByTestId('share-sheet')).toHaveAttribute('data-open', 'false');
  });

  it('FE-MOB-MVACSCR-004b: each sheet closes back to no open sheet', () => {
    mocks.v = buildV({ sheet: 'invite' });
    render(<MVacay />);

    fireEvent.click(screen.getByRole('button', { name: 'close-invite' }));
    fireEvent.click(screen.getByRole('button', { name: 'close-settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'close-share' }));
    expect(mocks.v.setSheet).toHaveBeenCalledTimes(3);
    expect(mocks.v.setSheet).toHaveBeenNthCalledWith(3, null);
  });

  it('FE-MOB-MVACSCR-005: renders the person card with the remaining balance and stepper', () => {
    render(<MVacay />);

    expect(screen.getByText('alice', { selector: 'div' })).toBeInTheDocument();
    const badge = screen.getByText('left');
    expect(badge).toHaveTextContent('26');
    expect(badge.style.color).toBe('rgb(59, 130, 246)');
    expect(screen.getByText('Days').previousElementSibling).toHaveTextContent('30');

    fireEvent.click(screen.getByRole('button', { name: 'Increase allowance' }));
    fireEvent.click(screen.getByRole('button', { name: 'Decrease allowance' }));
    expect(mocks.v.allowInc).toHaveBeenCalledTimes(1);
    expect(mocks.v.allowDec).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-MVACSCR-006: renders a fractional balance with one decimal', () => {
    mocks.v = buildV({
      selectedStat: { user_id: 1, vacation_days: 30, used: 4.5, total_available: 30, remaining: 25.5, carried_over: 0 },
    });
    render(<MVacay />);

    expect(screen.getByText('25.5')).toBeInTheDocument();
  });

  it('FE-MOB-MVACSCR-007: colors an overdrawn balance as a danger badge', () => {
    mocks.v = buildV({
      selectedStat: { user_id: 1, vacation_days: 30, used: 32, total_available: 30, remaining: -2, carried_over: 0 },
    });
    render(<MVacay />);

    const badge = screen.getByText('-2').parentElement as HTMLElement;
    expect(badge.style.color).toBe('var(--m-st-danger)');
  });

  it('FE-MOB-MVACSCR-008: an exhausted balance switches to the pending color', () => {
    mocks.v = buildV({
      selectedStat: { user_id: 1, vacation_days: 30, used: 30, total_available: 30, remaining: 0, carried_over: 0 },
    });
    render(<MVacay />);

    const badge = screen.getByText('0').parentElement as HTMLElement;
    expect(badge.style.color).toBe('var(--m-st-pending)');
  });

  it('FE-MOB-MVACSCR-009: hides the person card when no stat row exists', () => {
    mocks.v = buildV({ selectedStat: undefined });
    render(<MVacay />);

    expect(screen.queryByRole('button', { name: 'Increase allowance' })).not.toBeInTheDocument();
  });

  it('FE-MOB-MVACSCR-010: person chips select their member and fall back on the shared color', () => {
    render(<MVacay />);

    const bobChip = screen.getByRole('button', { name: 'bob' });
    const swatch = bobChip.querySelector('span') as HTMLElement;
    expect(swatch.style.background).toBe('rgb(99, 102, 241)');

    fireEvent.click(bobChip);
    expect(mocks.v.selectPerson).toHaveBeenCalledWith(2);
  });

  it('FE-MOB-MVACSCR-011: shared chips toggle their overlay and report their state', () => {
    mocks.v = buildV({
      incomingShares: [
        { id: 7, owner_id: 3, username: 'carol', color: '#f59e0b', hidden: false },
        { id: 8, owner_id: 4, username: 'dan', color: '#10b981', hidden: true },
      ],
    });
    render(<MVacay />);

    const carol = screen.getByRole('button', { name: 'carol' });
    const dan = screen.getByRole('button', { name: 'dan' });
    expect(carol).toHaveAttribute('aria-pressed', 'true');
    expect(dan).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(carol);
    fireEvent.click(dan);
    expect(mocks.v.toggleShareHidden).toHaveBeenNthCalledWith(1, 7, true);
    expect(mocks.v.toggleShareHidden).toHaveBeenNthCalledWith(2, 8, false);
  });

  it('FE-MOB-MVACSCR-012: shows the company legend and every enabled holiday calendar', () => {
    mocks.v = buildV({
      holidaysEnabled: true,
      plan: {
        id: 1,
        holiday_calendars: [
          { id: 1, region: 'DE', label: 'Germany', color: '#fecaca' },
          { id: 2, region: 'NL', label: null, color: '#bbf7d0' },
        ],
      },
    });
    render(<MVacay />);

    expect(screen.getByText('Company days')).toBeInTheDocument();
    expect(screen.getByText('Germany')).toBeInTheDocument();
    expect(screen.getByText('NL')).toBeInTheDocument();
  });

  it('FE-MOB-MVACSCR-013: the year grid shows twelve month cards and reports day taps', () => {
    render(<MVacay />);

    MONTHS_SHORT.forEach(name => expect(screen.getByText(name)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '2026-06-15' }));
    expect(mocks.v.handleDayTap).toHaveBeenCalledWith('2026-06-15');
  });

  it('FE-MOB-MVACSCR-013b: the month chip in the year grid opens that month (#1811)', () => {
    render(<MVacay />);

    const chip = screen.getByRole('button', { name: 'Mar' });
    fireEvent.click(chip);

    expect(mocks.v.openMonthSlot).toHaveBeenCalledWith(2);
  });

  it('FE-MOB-MVACSCR-014: edit view swaps in the month nav, weekday row and mode switch', () => {
    mocks.v = buildV({ view: 'edit' });
    render(<MVacay />);

    expect(screen.getByText('June')).toBeInTheDocument();
    expect(screen.getAllByText('Mon')[0]).toBeInTheDocument();
    // Monday-first week: Sunday is the last weekday header.
    const headers = screen.getAllByText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/);
    expect(headers[headers.length - 1]).toHaveTextContent('Sun');

    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(mocks.v.prevMonth).toHaveBeenCalledTimes(1);
    expect(mocks.v.nextMonth).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Mar'));
    expect(mocks.v.setMonthSlot).toHaveBeenCalledWith(2);
  });

  it('FE-MOB-MVACSCR-015: a Sunday week start moves Sunday to the front of the weekday row', () => {
    mocks.v = buildV({ view: 'edit', weekStart: 0 });
    render(<MVacay />);

    const headers = screen.getAllByText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/);
    expect(headers[0]).toHaveTextContent('Sun');
  });

  it('FE-MOB-MVACSCR-016: the mode switch drives person, company, comp and half-day logging', () => {
    mocks.v = buildV({ view: 'edit' });
    render(<MVacay />);

    // The person chip row carries the same name; the mode switch comes last.
    const person = screen.getAllByRole('button', { name: 'alice' });
    fireEvent.click(person[person.length - 1]);
    expect(mocks.v.setMode).toHaveBeenLastCalledWith('vacation');

    fireEvent.click(screen.getByRole('button', { name: 'Company' }));
    expect(mocks.v.setMode).toHaveBeenLastCalledWith('company');

    const comp = screen.getByRole('button', { name: 'Comp / Flex' });
    const half = screen.getByRole('button', { name: 'Half day' });
    expect(comp).toHaveAttribute('aria-pressed', 'false');
    expect(half).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(comp);
    fireEvent.click(half);
    expect(mocks.v.setCompDay).toHaveBeenCalledTimes(1);
    expect(mocks.v.setHalfDay).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-MVACSCR-017: the company mode button disappears when company days are off', () => {
    mocks.v = buildV({ view: 'edit', companyHolidaysEnabled: false });
    render(<MVacay />);

    expect(screen.queryByRole('button', { name: 'Company' })).not.toBeInTheDocument();
    expect(screen.queryByText('Company days')).not.toBeInTheDocument();
  });

  it('FE-MOB-MVACSCR-018: the FAB flips between the year overview and the editor', () => {
    render(<MVacay />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit calendar' }));
    expect(mocks.v.toggleView).toHaveBeenCalledTimes(1);

    mocks.v = buildV({ view: 'edit' });
    render(<MVacay />);
    expect(screen.getAllByRole('button', { name: 'View year' })).toHaveLength(1);
  });

  it('FE-MOB-MVACSCR-019: an incoming fusion request lists what fusing grants and both actions', () => {
    const acceptInvite = vi.fn((_planId: number) => undefined);
    const declineInvite = vi.fn((_planId: number) => undefined);
    mocks.v = buildV({
      incomingInvites: [{ plan_id: 42, owner_username: 'carol' }],
      acceptInvite,
      declineInvite,
    });
    render(<MVacay />);

    const dialog = screen.getByRole('dialog', { name: 'Fusion Request' });
    expect(within(dialog).getByText('carol')).toBeInTheDocument();
    expect(within(dialog).getByText('C')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Accept & Fuse' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Decline' }));
    expect(acceptInvite).toHaveBeenCalledWith(42);
    expect(declineInvite).toHaveBeenCalledWith(42);
  });

  it('FE-MOB-MVACSCR-020: no fusion request means no dialog', () => {
    render(<MVacay />);

    expect(screen.queryByRole('dialog', { name: 'Fusion Request' })).not.toBeInTheDocument();
  });

  it('FE-MOB-MVACSCR-021: the screen measures itself, not the shell', () => {
    // #1809: the shell scrolls with the document now and hands down no definite
    // height, so a full-viewport screen has to set its own.
    const { container, rerender } = render(<MVacay />);
    expect(container.firstElementChild).toHaveClass('h-dvh');

    mocks.v = buildV({ loading: true });
    rerender(<MVacay />);
    expect(container.firstElementChild).toHaveClass('h-dvh');
  });
});
