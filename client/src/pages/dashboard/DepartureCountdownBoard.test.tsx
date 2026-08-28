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
    act(() => resetAllStores());
    vi.useRealTimers();
  });

  it('uses the theme-aware desktop classes for all four countdown units', () => {
    render(<DepartureCountdownBoard departure={departure(START.getTime() + 93785000)} />);

    const timer = screen.getByRole('timer');
    expect(timer).toHaveClass('departure-countdown-board');
    expect(timer).toHaveAttribute('aria-live', 'off');
    expect(screen.getByText(/HX676/)).toHaveClass('departure-countdown-transport');
    expect(timer.querySelectorAll('.departure-countdown-unit')).toHaveLength(4);
    expect(screen.getByText(/days/i)).toBeInTheDocument();
    expect(screen.getByText(/hours/i)).toBeInTheDocument();
    expect(screen.getByText(/minutes/i)).toBeInTheDocument();
    expect(screen.getByText(/seconds/i)).toBeInTheDocument();
  });

  it('preserves the white-on-dark compact mobile treatment', () => {
    render(<DepartureCountdownBoard departure={departure(START.getTime() + 10000)} compact />);

    const timer = screen.getByRole('timer');
    expect(timer).toHaveClass('bg-black/25', 'text-white');
    expect(timer).not.toHaveClass('departure-countdown-board');
    expect(screen.getByText(/HX676/)).toHaveClass('truncate', 'opacity-80');
  });

  it('updates each second and removes itself at departure', async () => {
    render(<DepartureCountdownBoard departure={departure(START.getTime() + 2000)} />);

    expect(screen.getByText('02')).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(1000));
    expect(screen.getByText('01')).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(1000));
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  });

  it('caps long countdowns and honors the user time format', () => {
    seedStore(useSettingsStore, { settings: { time_format: '12h' } });
    render(<DepartureCountdownBoard departure={departure(START.getTime() + 120 * 86400000)} />);

    expect(screen.getByText('99+')).toBeInTheDocument();
    expect(screen.getByText(/9:05 AM/)).toBeInTheDocument();
  });
});
