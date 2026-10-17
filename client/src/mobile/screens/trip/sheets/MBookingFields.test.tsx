// FE-COMP-MBOOKINGFIELDS-001 to FE-COMP-MBOOKINGFIELDS-008
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import type { TripMember } from '../../../../types';
import { MBookingCodeStatus, MBookingNotes, MBookingTravelers, MRouteStopCard } from './MBookingFields';

const members: TripMember[] = [
  { id: 1, username: 'anna', avatar_url: '/uploads/avatars/anna.png' },
  { id: 2, username: 'ben', is_guest: true },
];

const times = { arrDayId: '', arrTime: '', depDayId: '', depTime: '' };
// The sheets hand in their own translate function; the key itself is enough here.
const t = (key: string) => key;

const days = [{ value: '', label: 'none' }];

describe('MBookingCodeStatus', () => {
  it('FE-COMP-MBOOKINGFIELDS-001: reports the typed code and the picked status', () => {
    const onCodeChange = vi.fn();
    const onStatusChange = vi.fn();
    render(
      <MBookingCodeStatus
        t={t}
        code="ABC"
        onCodeChange={onCodeChange}
        status="pending"
        onStatusChange={onStatusChange}
      />
    );

    const input = screen.getByPlaceholderText('reservations.confirmationPlaceholder');
    expect(input).toHaveValue('ABC');
    fireEvent.change(input, { target: { value: 'XYZ9' } });
    expect(onCodeChange).toHaveBeenCalledWith('XYZ9');

    fireEvent.click(screen.getByRole('button', { name: 'reservations.confirmed' }));
    expect(onStatusChange).toHaveBeenCalledWith('confirmed');
  });

  it('FE-COMP-MBOOKINGFIELDS-002: marks the current status as the active segment', () => {
    render(<MBookingCodeStatus t={t} code="" onCodeChange={vi.fn()} status="confirmed" onStatusChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'reservations.confirmed' }).className).toContain('bg-m-act');
    expect(screen.getByRole('button', { name: 'reservations.pending' }).className).toContain('text-m-muted');
  });
});

describe('MBookingNotes', () => {
  it('FE-COMP-MBOOKINGFIELDS-003: shows the notes and reports an edit', () => {
    const onChange = vi.fn();
    render(<MBookingNotes t={t} value="Late check-in" onChange={onChange} />);

    const area = screen.getByPlaceholderText('reservations.notesPlaceholder');
    expect(area).toHaveValue('Late check-in');
    fireEvent.change(area, { target: { value: 'Early' } });
    expect(onChange).toHaveBeenCalledWith('Early');
  });
});

describe('MBookingTravelers', () => {
  it('FE-COMP-MBOOKINGFIELDS-004: says so when the trip has no members', () => {
    render(<MBookingTravelers t={t} tripMembers={[]} selectedIds={new Set()} onToggle={vi.fn()} />);

    expect(screen.getByText('reservations.travelers.none')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('FE-COMP-MBOOKINGFIELDS-005: dims the members not on the booking and toggles one on click', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <MBookingTravelers t={t} tripMembers={members} selectedIds={new Set([1])} onToggle={onToggle} />
    );

    const anna = screen.getByRole('button', { name: /anna/ });
    const ben = screen.getByRole('button', { name: /ben/ });
    expect(anna.className).not.toContain('opacity-60');
    expect(ben.className).toContain('opacity-60');
    // A photo for the member who has one, the initial for the one who has not.
    expect(container.querySelector('img')).toHaveAttribute('src', '/uploads/avatars/anna.png');
    expect(screen.getByText('B')).toBeInTheDocument();

    fireEvent.click(ben);
    expect(onToggle).toHaveBeenCalledWith(2);
  });
});

describe('MRouteStopCard', () => {
  const card = (isFirst: boolean, isLast: boolean, onRemove = vi.fn()) =>
    render(
      <MRouteStopCard
        t={t}
        roleLabel="Stop"
        picker={<span>picker</span>}
        isFirst={isFirst}
        isLast={isLast}
        onRemove={onRemove}
        times={times}
        onTimesChange={vi.fn()}
        dayOptions={days}
      >
        <span>leg fields</span>
      </MRouteStopCard>
    );

  it('FE-COMP-MBOOKINGFIELDS-006: the origin has a departure and the leg fields, but no arrival and no remove', () => {
    card(true, false);

    expect(screen.getByText('Stop')).toBeInTheDocument();
    expect(screen.getByText('picker')).toBeInTheDocument();
    expect(screen.queryByText('reservations.arrivalDate')).toBeNull();
    expect(screen.getByText('reservations.departureDate')).toBeInTheDocument();
    expect(screen.getByText('leg fields')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'common.delete' })).toBeNull();
  });

  it('FE-COMP-MBOOKINGFIELDS-007: the destination has an arrival only', () => {
    card(false, true);

    expect(screen.getByText('reservations.arrivalDate')).toBeInTheDocument();
    expect(screen.queryByText('reservations.departureDate')).toBeNull();
    expect(screen.queryByText('leg fields')).toBeNull();
    expect(screen.queryByRole('button', { name: 'common.delete' })).toBeNull();
  });

  it('FE-COMP-MBOOKINGFIELDS-008: a stop in between has both and can be removed', () => {
    const onRemove = vi.fn();
    card(false, false, onRemove);

    expect(screen.getByText('reservations.arrivalDate')).toBeInTheDocument();
    expect(screen.getByText('reservations.departureDate')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
