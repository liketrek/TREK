import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { translator } from '../../src/lib/i18n';
import type { TrekAppState } from '../../src/lib/useTrekApp';
import { App } from '../../src/widgets/day-plan/App';
import { DayPlan } from '../../src/widgets/day-plan/DayPlan';
import { moveEntry, timeSpan } from '../../src/widgets/day-plan/dayPlanModel';

const t = translator('en');
const stop = (id: number, extra: Record<string, unknown> = {}) => ({
  assignment_id: id,
  place_id: 100 + id,
  name: `Stop ${id}`,
  time: null,
  end_time: null,
  address: null,
  ...extra,
});
const plan = (stops: unknown[], day: Record<string, unknown> = {}) => ({
  trip_id: 4,
  day: { id: 9, day_number: 2, date: '2027-05-12', title: null, ...day },
  stops,
});
const names = () => screen.getAllByRole('listitem').map((li) => li.querySelector('.day__name')?.textContent);

let state: TrekAppState;
vi.mock('../../src/lib/useTrekApp', () => ({ useTrekApp: () => state }));
afterEach(cleanup);

describe('dayPlanModel', () => {
  it('APPS-DAY-001: moves an entry one place and leaves the ends alone', () => {
    expect(moveEntry([1, 2, 3], 1, -1)).toEqual([2, 1, 3]);
    expect(moveEntry([1, 2, 3], 1, 1)).toEqual([1, 3, 2]);
    expect(moveEntry([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
    expect(moveEntry([1, 2, 3], 5, 1)).toEqual([1, 2, 3]);
  });

  it('APPS-DAY-002: prints a stop’s time span', () => {
    expect(timeSpan('09:00', '10:30')).toBe('09:00–10:30');
    expect(timeSpan('09:00', null)).toBe('09:00');
    expect(timeSpan(null, '10:30')).toBeNull();
  });
});

describe('DayPlan', () => {
  it('APPS-DAY-003: names the day by its title or its number, and lists the stops with time and address', () => {
    const { unmount } = render(
      <DayPlan data={plan([stop(1, { time: '09:00', address: 'Rua 1' })])} locale="en-GB" t={t} onReorder={vi.fn()} />
    );
    expect(screen.getByRole('heading', { name: 'Day 2' })).toBeTruthy();
    expect(screen.getByText(/12.*May.*2027/)).toBeTruthy();
    expect(screen.getByText('09:00 · Rua 1')).toBeTruthy();
    unmount();
    render(<DayPlan data={plan([], { title: 'Sintra' })} locale="en" t={t} onReorder={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Sintra' })).toBeTruthy();
    expect(screen.getByText('Nothing planned for this day')).toBeTruthy();
  });

  it('APPS-DAY-004: moves a stop at once, saves the new order, and puts it back when TREK refuses', async () => {
    const onReorder = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    render(<DayPlan data={plan([stop(1), stop(2), stop(3)])} locale="en" t={t} onReorder={onReorder} />);
    expect(screen.getByRole('button', { name: 'Move up: Stop 1' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Move down: Stop 3' }).hasAttribute('disabled')).toBe(true);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Move down: Stop 1' })));
    expect(onReorder).toHaveBeenLastCalledWith([2, 1, 3]);
    expect(names()).toEqual(['Stop 2', 'Stop 1', 'Stop 3']);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Move up: Stop 3' })));
    expect(onReorder).toHaveBeenLastCalledWith([2, 3, 1]);
    await waitFor(() => expect(names()).toEqual(['Stop 2', 'Stop 1', 'Stop 3']));
    expect(screen.getByRole('alert').textContent).toBe('Could not change the order. Try again.');
  });

  it('APPS-DAY-005: says so when the result is not a day plan', () => {
    render(<DayPlan data={{ stops: 'no' }} locale="en" t={t} onReorder={vi.fn()} />);
    expect(screen.getByText('Something went wrong. Try again.')).toBeTruthy();
  });
});

describe('day-plan App', () => {
  const withResult = (callServerTool: ReturnType<typeof vi.fn>) => {
    state = {
      app: { callServerTool } as unknown as TrekAppState['app'],
      result: { structuredContent: plan([stop(1), stop(2)]), appUrl: null },
      input: null,
      error: null,
      locale: 'en-GB',
      t,
    };
  };

  it('APPS-DAY-006: saves the order through reorder_day_assignments on the host’s session', async () => {
    const callServerTool = vi.fn(async () => ({ content: [] }));
    withResult(callServerTool);
    render(<App />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Move down: Stop 1' })));
    expect(callServerTool).toHaveBeenCalledWith({
      name: 'reorder_day_assignments',
      arguments: { tripId: 4, dayId: 9, assignmentIds: [2, 1] },
    });
    expect(names()).toEqual(['Stop 2', 'Stop 1']);
  });

  it('APPS-DAY-007: counts an error answer or a failed call as refused', async () => {
    const callServerTool = vi
      .fn()
      .mockResolvedValueOnce({ content: [], isError: true })
      .mockRejectedValueOnce(new Error('gone'));
    withResult(callServerTool);
    render(<App />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Move down: Stop 1' })));
    await waitFor(() => expect(names()).toEqual(['Stop 1', 'Stop 2']));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Move down: Stop 1' })));
    await waitFor(() => expect(callServerTool).toHaveBeenCalledTimes(2));
    expect(names()).toEqual(['Stop 1', 'Stop 2']);
  });
});
