// FE-COMP-COLIMPORT-001 to FE-COMP-COLIMPORT-007
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { useTranslation } from '../../i18n/TranslationContext';
import ImportFromTripModal from './ImportFromTripModal';

const BASE = '/api/addons/collections';

const TRIPS = [
  { id: 7, user_id: 1, title: 'Rome 2026', currency: 'EUR', is_archived: 0, reminder_days: 3, start_date: '2026-05-01', end_date: '2026-05-08', place_count: 3, cover_image: null },
  { id: 9, user_id: 1, title: 'Lisbon', currency: 'EUR', is_archived: 0, reminder_days: 3, place_count: 0, cover_image: null },
];

const place = (over: Record<string, unknown>) => ({
  place_id: 1, name: 'Somewhere', address: null, lat: null, lng: null, category_id: null,
  image_url: null, already_in_list: false, scheduled: false, day_number: null, date: null, ...over,
});

// Colosseum sits on day 2, the market was never scheduled, the Pantheon is already saved.
const IMPORTABLE = [
  place({ place_id: 11, name: 'Colosseum', scheduled: true, day_number: 2, date: '2026-05-02' }),
  place({ place_id: 12, name: 'Testaccio Market' }),
  place({ place_id: 13, name: 'Pantheon', already_in_list: true, scheduled: true, day_number: 1 }),
];

function Harness(props: { onImported?: () => void; onClose?: () => void }): React.ReactElement {
  const { t } = useTranslation();
  return (
    <ImportFromTripModal
      isOpen
      collectionId={4}
      collectionName="Italy"
      categories={[]}
      onClose={props.onClose ?? (() => {})}
      onImported={props.onImported ?? (() => {})}
      t={t}
    />
  );
}

function useHandlers(importable = IMPORTABLE, onPost?: (body: unknown) => void) {
  server.use(
    http.get('/api/trips', () => HttpResponse.json({ trips: TRIPS })),
    http.get(`${BASE}/4/importable/7`, () => HttpResponse.json({ places: importable })),
    http.post(`${BASE}/places/from-trip-many`, async ({ request }) => {
      onPost?.(await request.json());
      return HttpResponse.json({ copied: 2, skipped: [{ id: 13, name: 'Pantheon' }] });
    }),
  );
}

async function openTrip(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => expect(screen.getByText('Rome 2026')).toBeInTheDocument());
  await user.click(screen.getByText('Rome 2026'));
  await waitFor(() => expect(screen.getByText('Colosseum')).toBeInTheDocument());
}

describe('ImportFromTripModal', () => {
  beforeEach(() => useHandlers());

  it('FE-COMP-COLIMPORT-001: lists the trips with their place count and a localized date range', async () => {
    render(<Harness />);
    await waitFor(() => expect(screen.getByText('Rome 2026')).toBeInTheDocument());
    // The count is a compact badge; the full wording stays as its title.
    expect(screen.getByTitle('3 places')).toHaveTextContent('3');
    // Formatted through the shared formatter, never the raw ISO string.
    const dateBadge = screen.getByTitle(/May/);
    expect(dateBadge.textContent).toMatch(/May 1.*–.*May 8/);
    expect(dateBadge.textContent).not.toMatch(/2026-05-01/);
    expect(screen.getByText('Lisbon')).toBeInTheDocument();
  });

  it('FE-COMP-COLIMPORT-002: pre-selects the unscheduled place, not the scheduled one', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openTrip(user);

    // Only Testaccio Market is both new and dayless.
    expect(screen.getByRole('button', { name: /Import 1/ })).toBeInTheDocument();
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  it('FE-COMP-COLIMPORT-003: marks a place already on the list and refuses to select it', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openTrip(user);

    const row = screen.getByText('Pantheon').closest('button')!;
    expect(within(row).getByText('Already saved')).toBeInTheDocument();
    expect(row).toBeDisabled();

    await user.click(row);
    expect(screen.getByText('1 selected')).toBeInTheDocument(); // unchanged
  });

  it('FE-COMP-COLIMPORT-004: shows the day a scheduled place sits on', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openTrip(user);

    const row = screen.getByText('Colosseum').closest('button')!;
    expect(within(row).getByText('Day 2')).toBeInTheDocument();
    expect(within(screen.getByText('Testaccio Market').closest('button')!).getByText('Unscheduled')).toBeInTheDocument();
  });

  it('FE-COMP-COLIMPORT-005: only the selected ids are sent, and the result is reported', async () => {
    const onPost = vi.fn();
    const onImported = vi.fn();
    useHandlers(IMPORTABLE, onPost);
    const user = userEvent.setup();
    render(<Harness onImported={onImported} />);
    await openTrip(user);

    // Add the scheduled one to the pre-selected leftover.
    await user.click(screen.getByText('Colosseum').closest('button')!);
    await user.click(screen.getByRole('button', { name: /Import 2/ }));

    await waitFor(() => expect(onPost).toHaveBeenCalled());
    const body = onPost.mock.calls[0][0] as { source_place_ids: number[]; source_trip_id: number };
    expect(body.source_trip_id).toBe(7);
    expect([...body.source_place_ids].sort()).toEqual([11, 12]);

    await waitFor(() => expect(screen.getByText('2 places added')).toBeInTheDocument());
    expect(screen.getByText(/1 were already on the list/)).toBeInTheDocument();
    expect(onImported).toHaveBeenCalled();
  });

  it('FE-COMP-COLIMPORT-006: the only-new filter hides what is already saved', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openTrip(user);

    await user.click(screen.getByRole('button', { name: 'Only new' }));
    await waitFor(() => expect(screen.queryByText('Pantheon')).not.toBeInTheDocument());
    expect(screen.getByText('Colosseum')).toBeInTheDocument();
  });

  it('FE-COMP-COLIMPORT-007: a trip whose places are all saved says so instead of offering an empty list', async () => {
    useHandlers([place({ place_id: 13, name: 'Pantheon', already_in_list: true })]);
    const user = userEvent.setup();
    render(<Harness />);
    await waitFor(() => expect(screen.getByText('Rome 2026')).toBeInTheDocument());
    await user.click(screen.getByText('Rome 2026'));

    await waitFor(() => expect(screen.getByText(/already on this list/)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Import 0/ })).toBeDisabled();
  });
});
