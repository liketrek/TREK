import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useSettingsStore } from '../../store/settingsStore';
import DepartureCountdownBoard from './DepartureCountdownBoard';
import type { DepartureTransport } from './dashboardModel';

const START = new Date('2026-06-01T00:00:00Z');

function departure(departureAt: number): DepartureTransport {
  return {
    reservationId: 7,
    title: 'HX676 with a very long transport title',
    departureAt,
    localTime: '09:05',
    timeZone: 'Asia/Hong_Kong',
  };
}

describe('DepartureCountdownBoard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    vi.setSystemTime(START);
  });

  afterEach(() => {
    vi.useRealTimers();
    resetAllStores();
  });

  it('renders four localized units without a noisy live region', () => {
    render(<DepartureCountdownBoard departure={departure(START.getTime() + 93785000)} onComplete={vi.fn()} />);
    const timer = screen.getByRole('timer');
    expect(timer).toHaveAttribute('aria-live', 'off');
    expect(screen.getByText('Departure in')).toBeInTheDocument();
    expect(screen.getByTitle('HX676 with a very long transport title · 09:05')).toBeInTheDocument();
    expect(timer.querySelectorAll('[data-countdown-unit]')).toHaveLength(4);
    expect(screen.getByText('days')).toBeInTheDocument();
    expect(screen.getByText('hours')).toBeInTheDocument();
    expect(screen.getByText('minutes')).toBeInTheDocument();
    expect(screen.getByText('seconds')).toBeInTheDocument();
  });

  it('updates once per second and removes itself immediately at zero', async () => {
    const onComplete = vi.fn();
    render(<DepartureCountdownBoard departure={departure(START.getTime() + 2000)} onComplete={onComplete} />);
    expect(screen.getByText('02')).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(1000));
    expect(screen.getByText('01')).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(1000));
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not wait for the next whole-second tick when departure is sooner', async () => {
    const onComplete = vi.fn();
    render(<DepartureCountdownBoard departure={departure(START.getTime() + 250)} onComplete={onComplete} />);
    await act(async () => vi.advanceTimersByTime(249));
    expect(screen.getByRole('timer')).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(1));
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('caps long countdowns at 99+ days', () => {
    render(<DepartureCountdownBoard departure={departure(START.getTime() + 120 * 86400000)} onComplete={vi.fn()} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('formats the departure time using the user 12-hour preference', () => {
    seedStore(useSettingsStore, { settings: { time_format: '12h' } });
    render(<DepartureCountdownBoard departure={departure(START.getTime() + 10000)} onComplete={vi.fn()} />);
    expect(screen.getByTitle('HX676 with a very long transport title · 9:05 AM')).toBeInTheDocument();
  });
});
