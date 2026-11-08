import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { translator } from '../../src/lib/i18n';
import { TripList } from '../../src/widgets/trip-list/TripList';

const t = translator('en');
const trip = (id: number, extra: Record<string, unknown> = {}) => ({
  id,
  user_id: 1,
  title: `Trip ${id}`,
  currency: 'EUR',
  is_archived: 0,
  reminder_days: 0,
  start_date: '2027-05-12',
  end_date: '2027-05-19',
  ...extra,
});

afterEach(cleanup);

function renderList(data: unknown, appUrl: string | null = 'https://trek.example') {
  const onOpen = vi.fn();
  const onSelect = vi.fn();
  render(<TripList data={data} appUrl={appUrl} locale="en-GB" t={t} onOpen={onOpen} onSelect={onSelect} />);
  return { onOpen, onSelect };
}

describe('TripList', () => {
  it('APPS-TRIPS-001: draws a card per trip with its dates and the archived badge', () => {
    renderList({ trips: [trip(1), trip(2, { is_archived: 1, start_date: null, end_date: null })] });
    expect(screen.getByRole('heading', { name: 'Your trips' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText(/^12\s?–\s?19 May 2027$/u)).toBeTruthy();
    expect(screen.getByText('No dates yet')).toBeTruthy();
    expect(screen.getByText('Archived')).toBeTruthy();
  });

  it('APPS-TRIPS-002: opens the trip in TREK and points the model at it', () => {
    const { onOpen, onSelect } = renderList({ trips: [trip(7)] });
    fireEvent.click(screen.getByRole('button', { name: 'Open in TREK' }));
    expect(onOpen).toHaveBeenCalledWith('https://trek.example/trips/7');
    fireEvent.click(screen.getByRole('button', { name: 'Ask about this trip' }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 7, title: 'Trip 7' }));
  });

  it('APPS-TRIPS-003: hides the link when the result carried no address', () => {
    renderList({ trips: [trip(1)] }, null);
    expect(screen.queryByRole('button', { name: 'Open in TREK' })).toBeNull();
  });

  it('APPS-TRIPS-004: says so when there are no trips, or the result is not a trip list', () => {
    renderList({ trips: [] });
    expect(screen.getByText('No trips yet')).toBeTruthy();
    cleanup();
    renderList({ nope: true });
    expect(screen.getByText('Something went wrong. Try again.')).toBeTruthy();
  });
});
