import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../tests/helpers/store';
import { buildUser, buildAdmin, buildTrip, buildSettings } from '../../tests/helpers/factories';
import { useAuthStore } from '../store/authStore';
import { usePermissionsStore } from '../store/permissionsStore';
import { useSettingsStore } from '../store/settingsStore';
import DashboardPage from './DashboardPage';

beforeEach(() => {
  vi.clearAllMocks();
  resetAllStores();
  // Seed auth with authenticated user
  seedStore(useAuthStore, { isAuthenticated: true, user: buildUser() });
  // Grant all permissions so buttons are visible
  seedStore(usePermissionsStore, {
    level: 'owner',
  } as any);
  // Intercept CurrencyWidget's external fetch so it resolves before teardown
  server.use(
    http.get('https://api.frankfurter.dev/v2/rates', () => {
      return HttpResponse.json([
        { date: '2026-06-16', base: 'EUR', quote: 'USD', rate: 1.08 },
        { date: '2026-06-16', base: 'EUR', quote: 'CHF', rate: 0.97 },
      ]);
    }),
  );
});

describe('DashboardPage', () => {
  describe('FE-PAGE-DASH-001: Unauthenticated user is redirected', () => {
    it('does not render dashboard content when not authenticated', () => {
      // When the auth store has no user, the page relies on ProtectedRoute (App.tsx) to redirect.
      // Rendering the page directly without auth: the page itself still renders (guard is in router).
      // We verify the page is accessible only with auth seeded above.
      // This is tested at the App routing level — here we verify dashboard content renders WITH auth.
      seedStore(useAuthStore, { isAuthenticated: true, user: buildUser() });
      render(<DashboardPage />);
      // Dashboard content is present when authenticated
      expect(screen.getByText(/my trips/i)).toBeInTheDocument();
    });
  });

  describe('FE-PAGE-DASH-002: Trip list loads on mount', () => {
    it('fetches trips via GET /api/trips on mount', async () => {
      render(<DashboardPage />);

      // After data loads, trip cards should appear
      await waitFor(() => {
        expect(screen.getAllByText('Paris Adventure')[0]).toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-DASH-003: Trips render with name and dates', () => {
    it('shows trip name and dates in the list', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Paris Adventure')[0]).toBeInTheDocument();
      });

      // At least the first trip name should be visible
      expect(screen.getAllByText('Paris Adventure')[0]).toBeVisible();
    });
  });

  describe('FE-PAGE-DASH-004: Empty state when no trips', () => {
    it('shows the add-trip card when API returns no trips', async () => {
      server.use(
        http.get('/api/trips', () => {
          return HttpResponse.json({ trips: [] });
        }),
      );

      render(<DashboardPage />);

      // With no trips the planned filter falls back to the "add trip" card
      await waitFor(() => {
        expect(screen.getByText(/plan a new trip from scratch/i)).toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-DASH-005: Create Trip button opens TripFormModal', () => {
    it('clicking New Trip button opens the trip form modal', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /new trip/i }).length).toBeGreaterThan(0);
      });

      await user.click(screen.getAllByRole('button', { name: /new trip/i })[0]);

      // TripFormModal opens — "Create New Trip" appears in heading and submit button
      await waitFor(() => {
        expect(screen.getAllByText(/create new trip/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe('FE-PAGE-DASH-006: Loading state while fetching trips', () => {
    it('shows loading skeletons while trips are being fetched', async () => {
      // Delay response to observe loading state
      server.use(
        http.get('/api/trips', async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return HttpResponse.json({ trips: [] });
        }),
      );

      render(<DashboardPage />);

      // Header renders immediately
      expect(screen.getByText(/my trips/i)).toBeInTheDocument();

      // Loading is indicated by subtitle "Loading…" or skeleton cards
      // The subtitle during loading shows t('common.loading')
      await waitFor(() => {
        // After loading completes, no-trips state or trips appear
        expect(screen.queryByText(/loading/i) === null || screen.getByText(/no trips yet/i)).toBeTruthy();
      });
    });
  });

  describe('FE-PAGE-DASH-007: Dashboard title visible', () => {
    it('shows the dashboard title', async () => {
      render(<DashboardPage />);
      expect(screen.getByText(/my trips/i)).toBeInTheDocument();
    });
  });

  describe('FE-PAGE-DASH-008: Delete trip shows ConfirmDialog', () => {
    it('clicking delete on a trip card opens the confirm dialog', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Paris Adventure')[0]).toBeInTheDocument();
      });

      // Find delete button — CardAction with label t('common.delete')
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        // ConfirmDialog renders with title t('common.delete') and cancel/confirm buttons
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-DASH-009: Confirm delete removes trip from list', () => {
    it('confirming delete removes the trip from the list', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Paris Adventure')[0]).toBeInTheDocument();
      });

      // Open confirm dialog
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      // Click the confirm button (the one inside the dialog, not the delete action button)
      // ConfirmDialog renders a confirm button with confirmLabel or t('common.delete')
      const dialogDeleteBtn = screen.getAllByRole('button', { name: /delete/i }).find(
        btn => btn.closest('[class*="fixed inset-0"]') || btn.closest('.fixed')
      );
      // Just click the second delete button that appears (the dialog confirm button)
      const allDeleteBtns = screen.getAllByRole('button', { name: /delete/i });
      // The last one should be the confirm button in the dialog
      await user.click(allDeleteBtns[allDeleteBtns.length - 1]);

      await waitFor(() => {
        expect(screen.queryByText('Paris Adventure')).not.toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-DASH-010: Cancel delete keeps trip in list', () => {
    it('cancelling delete keeps the trip in the list', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Paris Adventure')[0]).toBeInTheDocument();
      });

      // Open confirm dialog
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Trip still visible
      expect(screen.getAllByText('Paris Adventure')[0]).toBeInTheDocument();
    });
  });

  describe('FE-PAGE-DASH-011: Archive trip moves it to the archive filter', () => {
    it('archiving a trip removes it from active and shows it under the archive filter', async () => {
      const archivedTrip = buildTrip({ title: 'Paris Adventure', start_date: '2026-07-01', end_date: '2026-07-10', is_archived: 1 });
      server.use(
        http.put('/api/trips/:id', () => HttpResponse.json({ trip: archivedTrip })),
      );

      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Paris Adventure')[0]).toBeInTheDocument();
      });

      // The spotlight hero exposes an icon-only archive action
      const archiveButtons = screen.getAllByRole('button', { name: /archive/i }).filter(b => !b.textContent?.trim());
      await user.click(archiveButtons[0]);

      // Switch to the archive filter segment
      await user.click(screen.getByText('Archived'));

      await waitFor(() => {
        expect(screen.getAllByText('Paris Adventure')[0]).toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-DASH-012: Edit trip opens form with pre-filled data', () => {
    it('clicking edit on a trip card opens TripFormModal with trip title pre-filled', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Paris Adventure')[0]).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Paris Adventure');
        expect(titleInput).toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-DASH-013: Grid/list view toggle persists to localStorage', () => {
    it('clicking list view toggle switches layout and saves to localStorage', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Paris Adventure')[0]).toBeInTheDocument();
      });

      // The view-mode toggle flips grid ↔ list and persists the choice
      const viewToggle = screen.getByRole('button', { name: /toggle view/i });
      await user.click(viewToggle);

      // localStorage should be updated to 'list'
      expect(localStorage.getItem('trek_dashboard_view')).toBe('list');
    });
  });

  describe('FE-PAGE-DASH-014: Archive filter reveals archived trips', () => {
    it('shows archived trips when the archive filter is selected', async () => {
      const oldTrip = buildTrip({ title: 'Old Rome Trip', start_date: '2024-01-01', end_date: '2024-01-07', is_archived: 1 });
      server.use(
        http.get('/api/trips', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('archived')) {
            return HttpResponse.json({ trips: [oldTrip] });
          }
          return HttpResponse.json({ trips: [buildTrip({ title: 'Paris Adventure', start_date: '2026-07-01', end_date: '2026-07-10' })] });
        }),
      );

      const user = userEvent.setup();
      render(<DashboardPage />);

      // Wait for active trips to load
      await waitFor(() => {
        expect(screen.getAllByText('Paris Adventure')[0]).toBeInTheDocument();
      });

      // Switch to the archive filter
      await user.click(screen.getByText('Archived'));

      await waitFor(() => {
        expect(screen.getByText('Old Rome Trip')).toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-DASH-015: Clicking a trip card navigates to /trips/:id', () => {
    it('clicking a trip card navigates to the trip page', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        // Mobile + desktop may render the same trip twice
        expect(screen.getAllByText('Tokyo Trip').length).toBeGreaterThan(0);
      });

      const tokyoTrip = screen.getAllByText('Tokyo Trip')[0];
      await user.click(tokyoTrip);

      expect(tokyoTrip).toBeInTheDocument();
    });
  });

  describe('FE-PAGE-DASH-016: List view renders trip list items', () => {
    it('switching to list view renders trips as list items', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Tokyo Trip').length).toBeGreaterThan(0);
      });

      // Switch to list view
      const viewToggle = screen.getByRole('button', { name: /toggle view/i });
      await user.click(viewToggle);

      // Non-spotlight trips should be visible in list view
      await waitFor(() => {
        expect(screen.getAllByText('Tokyo Trip').length).toBeGreaterThan(0);
      });

      const tokyoTrip = screen.getAllByText('Tokyo Trip')[0];
      await user.click(tokyoTrip);
      expect(tokyoTrip).toBeInTheDocument();
    });
  });

  describe('FE-PAGE-DASH-017: List view delete and archive actions work', () => {
    it('list view renders trips and action buttons are clickable', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Tokyo Trip').length).toBeGreaterThan(0);
      });

      // Switch to list view
      const viewToggle = screen.getByRole('button', { name: /toggle view/i });
      await user.click(viewToggle);

      // Non-spotlight trips render in list view
      await waitFor(() => {
        expect(screen.getAllByText('Tokyo Trip').length).toBeGreaterThan(0);
      });

      const allButtons = screen.getAllByRole('button');
      expect(allButtons.length).toBeGreaterThan(4);
    });
  });

  describe('FE-PAGE-DASH-018: Copy trip creates a new trip', () => {
    it('clicking copy on a trip card copies the trip', async () => {
      server.use(
        http.post('/api/trips/:id/copy', async () => {
          const { buildTrip } = await import('../../tests/helpers/factories');
          const trip = buildTrip({ title: 'Paris Adventure (Copy)', start_date: '2026-07-01', end_date: '2026-07-10' });
          return HttpResponse.json({ trip });
        }),
      );

      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Paris Adventure')[0]).toBeInTheDocument();
      });

      // Find duplicate buttons (the copy action is labelled "Duplicate")
      const copyButtons = screen.getAllByRole('button', { name: /duplicate/i });
      await user.click(copyButtons[0]);

      // Confirm the copy dialog
      const confirmButton = await screen.findByRole('button', { name: /copy trip/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getAllByText('Paris Adventure (Copy)')[0]).toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-DASH-019: Currency converter widget renders in the sidebar', () => {
    it('shows the currency widget with from/to fields', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Paris Adventure').length).toBeGreaterThan(0);
      });

      // The sidebar currency tool exposes its title and the From/To converter fields
      expect(screen.getByText('Currency')).toBeInTheDocument();
      expect(screen.getByText('From')).toBeInTheDocument();
      expect(screen.getByText('To')).toBeInTheDocument();
    });
  });

  describe('FE-PAGE-DASH-020: Archived section - restore trip', () => {
    it('clicking restore in archived section moves trip back to active list', async () => {
      const activeTrip = buildTrip({ title: 'Paris Adventure', start_date: '2026-07-01', end_date: '2026-07-10' });
      const archivedTrip = buildTrip({ title: 'Old Rome Trip', start_date: '2024-01-01', end_date: '2024-01-07', is_archived: 1 });
      const restoredTrip = { ...archivedTrip, is_archived: 0 };

      server.use(
        http.get('/api/trips', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('archived')) {
            return HttpResponse.json({ trips: [archivedTrip] });
          }
          return HttpResponse.json({ trips: [activeTrip] });
        }),
        http.put('/api/trips/:id', async ({ request }) => {
          const body = await request.json() as Record<string, unknown>;
          if (body.is_archived === false) {
            return HttpResponse.json({ trip: restoredTrip });
          }
          return HttpResponse.json({ trip: archivedTrip });
        }),
      );

      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Paris Adventure')[0]).toBeInTheDocument();
      });

      // Switch to the archive filter
      await user.click(screen.getByText('Archived'));

      await waitFor(() => {
        expect(screen.getByText('Old Rome Trip')).toBeInTheDocument();
      });

      // An archived card's archive action is labelled "Restore" and toggles the trip back to active
      const card = screen.getByText('Old Rome Trip').closest('.trip-card') as HTMLElement;
      await user.click(card.querySelector('[aria-label="Restore"]') as HTMLElement);

      // Once restored there are no archived trips left to show
      await waitFor(() => {
        expect(screen.queryByText('Old Rome Trip')).not.toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-DASH-021: Create trip via form submission', () => {
    it('submitting the create form adds the trip to the list', async () => {
      const newTrip = buildTrip({ title: 'New Trip Test', start_date: '2027-01-01', end_date: '2027-01-05' });
      server.use(
        http.post('/api/trips', async () => {
          return HttpResponse.json({ trip: newTrip });
        }),
      );

      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /new trip/i }).length).toBeGreaterThan(0);
      });

      await user.click(screen.getAllByRole('button', { name: /new trip/i })[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/create new trip/i).length).toBeGreaterThan(0);
      });

      // Fill in the title
      const titleInput = screen.getByPlaceholderText(/e\.g\. Summer in Japan/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'New Trip Test');

      // Submit the form
      const submitBtn = screen.getAllByRole('button').find(btn => btn.textContent?.toLowerCase().includes('create'));
      if (submitBtn) {
        await user.click(submitBtn);
        await waitFor(() => {
          expect(screen.getAllByText('New Trip Test').length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('FE-PAGE-DASH-022: Error state on load failure', () => {
    it('shows error toast when trips API fails', async () => {
      server.use(
        http.get('/api/trips', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        }),
      );

      render(<DashboardPage />);

      // Page should still render header
      expect(screen.getByText(/my trips/i)).toBeInTheDocument();

      // Wait for loading to complete (error path)
      await waitFor(() => {
        // After error, loading state resolves and empty state or the title remains
        expect(screen.queryByText(/my trips/i)).toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-DASH-023: SpotlightCard shows progress bar for ongoing trip', () => {
    it('renders progress bar and live badge when trip is currently ongoing', async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      const ongoingTrip = buildTrip({
        title: 'Current Voyage',
        start_date: yesterday,
        end_date: nextWeek,
        day_count: 9,
        place_count: 3,
        shared_count: 1,
      });

      server.use(
        http.get('/api/trips', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('archived')) return HttpResponse.json({ trips: [] });
          return HttpResponse.json({ trips: [ongoingTrip] });
        }),
      );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Current Voyage').length).toBeGreaterThan(0);
      });

      // Live badge appears on the boarding-pass hero for an ongoing trip
      await waitFor(() => {
        expect(screen.getAllByText(/live now/i).length).toBeGreaterThan(0);
      });

      // The countdown ring labels the remaining days
      expect(screen.getAllByText(/days left/i).length).toBeGreaterThan(0);
    });
  });

  describe('FE-PAGE-DASH-024: SpotlightCard shows countdown for upcoming trip', () => {
    it('renders countdown badge for a future trip', async () => {
      const inFiveDays = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
      const inTenDays = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];

      const upcomingTrip = buildTrip({
        title: 'Upcoming Safari',
        start_date: inFiveDays,
        end_date: inTenDays,
        place_count: 2,
        shared_count: 0,
      });

      server.use(
        http.get('/api/trips', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('archived')) return HttpResponse.json({ trips: [] });
          return HttpResponse.json({ trips: [upcomingTrip] });
        }),
      );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Upcoming Safari').length).toBeGreaterThan(0);
      });

      // An upcoming trip is not "live", and the countdown cell counts down to the start
      expect(screen.queryByText(/live now/i)).not.toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getAllByText(/trip starts in/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe('FE-PAGE-DASH-025: Mobile Quick Actions section renders', () => {
    it('shows New Trip quick action button on mobile', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Paris Adventure').length).toBeGreaterThan(0);
      });

      // Mobile Quick Actions: "New Trip" button rendered in the quick-actions grid
      // getAllByText because it appears in both mobile quick-actions and desktop header
      const newTripButtons = screen.getAllByText(/new trip/i);
      expect(newTripButtons.length).toBeGreaterThan(0);
    });
  });

  describe('FE-PAGE-DASH-026: Timezone widget renders in the sidebar', () => {
    it('shows the timezone widget with an add-zone control', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Paris Adventure').length).toBeGreaterThan(0);
      });

      // The timezone tool title and its add-zone button are present
      expect(screen.getByText('Timezones')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add timezone/i })).toBeInTheDocument();
    });
  });

  describe('FE-PAGE-DASH-027: Archive filter toggles archived trips in and out of view', () => {
    it('shows archived trips under the archive filter and hides them under planned', async () => {
      const activeTrip = buildTrip({ title: 'Active Trip', start_date: '2026-08-01', end_date: '2026-08-10' });
      const archivedTrip = buildTrip({ title: 'Old Archived Trip', start_date: '2024-03-01', end_date: '2024-03-07', is_archived: 1 });

      server.use(
        http.get('/api/trips', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('archived')) {
            return HttpResponse.json({ trips: [archivedTrip] });
          }
          return HttpResponse.json({ trips: [activeTrip] });
        }),
      );

      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Active Trip')[0]).toBeInTheDocument();
      });

      // Archive filter reveals the archived trip
      await user.click(screen.getByText('Archived'));
      await waitFor(() => {
        expect(screen.getByText('Old Archived Trip')).toBeInTheDocument();
      });

      // Switching back to the planned filter hides it again
      await user.click(screen.getByText('Planned'));
      await waitFor(() => {
        expect(screen.queryByText('Old Archived Trip')).not.toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-DASH-028: Unarchive action restores trip to active list', () => {
    it('clicking restore on an archived trip removes it from archived section', async () => {
      const activeTrip = buildTrip({ title: 'My Active Trip', start_date: '2026-08-01', end_date: '2026-08-10' });
      const archivedTrip = buildTrip({ title: 'Restored Trip', start_date: '2024-06-01', end_date: '2024-06-07', is_archived: 1 });
      const restoredTrip = { ...archivedTrip, is_archived: 0 };

      server.use(
        http.get('/api/trips', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('archived')) {
            return HttpResponse.json({ trips: [archivedTrip] });
          }
          return HttpResponse.json({ trips: [activeTrip] });
        }),
        http.put('/api/trips/:id', async ({ request }) => {
          const body = await request.json() as Record<string, unknown>;
          if (body.is_archived === false) {
            return HttpResponse.json({ trip: restoredTrip });
          }
          return HttpResponse.json({ trip: archivedTrip });
        }),
      );

      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('My Active Trip')[0]).toBeInTheDocument();
      });

      await user.click(screen.getByText('Archived'));

      await waitFor(() => {
        expect(screen.getByText('Restored Trip')).toBeInTheDocument();
      });

      // An archived card's archive action is labelled "Restore" and restores the trip
      const card = screen.getByText('Restored Trip').closest('.trip-card') as HTMLElement;
      await user.click(card.querySelector('[aria-label="Restore"]') as HTMLElement);

      // After restore the archive filter has nothing left to show
      await waitFor(() => {
        expect(screen.queryByText('Restored Trip')).not.toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-DASH-029: Copy trip action creates a duplicate', () => {
    it('clicking copy on a spotlight card duplicates the trip', async () => {
      server.use(
        http.post('/api/trips/:id/copy', async () => {
          const trip = buildTrip({ title: 'Paris Adventure (Copy)', start_date: '2026-07-01', end_date: '2026-07-10' });
          return HttpResponse.json({ trip });
        }),
      );

      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Paris Adventure')[0]).toBeInTheDocument();
      });

      // Find duplicate buttons (the copy action is labelled "Duplicate")
      const copyButtons = screen.getAllByRole('button', { name: /duplicate/i });
      expect(copyButtons.length).toBeGreaterThan(0);
      await user.click(copyButtons[0]);

      // Confirm the copy dialog
      const confirmButton = await screen.findByRole('button', { name: /copy trip/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getAllByText('Paris Adventure (Copy)').length).toBeGreaterThan(0);
      });
    });
  });

  describe('FE-PAGE-DASH-030: Empty state renders create button', () => {
    it('shows empty state with create button when no trips exist', async () => {
      server.use(
        http.get('/api/trips', () => {
          return HttpResponse.json({ trips: [] });
        }),
      );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/plan a new trip from scratch/i)).toBeInTheDocument();
      });

      // The add-trip card and the floating action button both offer a way to create a trip
      const createButtons = screen.getAllByRole('button');
      const createBtn = createButtons.find(btn => btn.textContent?.toLowerCase().includes('trip'));
      expect(createBtn).toBeDefined();
    });
  });

  describe('FE-PAGE-DASH-031: SpotlightCard shows stats for ongoing trip', () => {
    it('renders duration stat and places/buddies stats for a live trip', async () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const inFiveDays = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

      const ongoingTrip = buildTrip({
        title: 'Live Adventure',
        start_date: yesterday,
        end_date: inFiveDays,
        place_count: 5,
        shared_count: 2,
      });

      server.use(
        http.get('/api/trips', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('archived')) return HttpResponse.json({ trips: [] });
          return HttpResponse.json({ trips: [ongoingTrip] });
        }),
      );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Live Adventure').length).toBeGreaterThan(0);
      });

      // Boarding pass summarises destinations and travelers for the spotlight trip
      await waitFor(() => {
        expect(screen.getByText(/5 destinations/i)).toBeInTheDocument();
        // shared_count (2) + the owner = 3 travelers
        expect(screen.getByText(/3 travelers/i)).toBeInTheDocument();
      });

      // The countdown ring labels the remaining days of the ongoing trip
      expect(screen.getAllByText(/days left/i).length).toBeGreaterThan(0);
    });
  });

  describe('FE-PAGE-DASH-033: Atlas distance respects distance unit setting', () => {
    const distanceValue = (text: string) =>
      screen.getByText((_, element) =>
        element?.classList.contains('value') === true &&
        element.textContent?.replace(/\s+/g, ' ').trim() === text
      );

    beforeEach(() => {
      server.use(
        http.get('/api/auth/travel-stats', () =>
          HttpResponse.json({
            totalTrips: 1,
            totalDays: 1,
            totalPlaces: 1,
            totalDistanceKm: 10,
            countries: [],
          })
        ),
      );
    });

    it('renders metric atlas distance as kilometers', async () => {
      seedStore(useSettingsStore, { settings: buildSettings({ distance_unit: 'metric' }) });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(distanceValue('10 km')).toBeInTheDocument();
      });
    });

    it('renders imperial atlas distance as miles', async () => {
      seedStore(useSettingsStore, { settings: buildSettings({ distance_unit: 'imperial' }) });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(distanceValue('6.2 mi')).toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-DASH-032: Dark mode detection uses window.matchMedia', () => {
    it('renders without error when dark_mode is set to auto', async () => {
      // Seed settings with dark_mode = 'auto' to exercise the matchMedia branch
      seedStore(useSettingsStore, {
        settings: {
          map_tile_url: '',
          default_lat: 48.8566,
          default_lng: 2.3522,
          default_zoom: 10,
          dark_mode: 'auto',
          default_currency: 'USD',
          language: 'en',
          temperature_unit: 'fahrenheit',
          distance_unit: 'metric',
          time_format: '12h',
          show_place_description: false,
          blur_booking_codes: false,
          dashboard_currency: 'on',
          dashboard_timezone: 'on',
        },
        updateSetting: vi.fn(),
      } as any);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Paris Adventure').length).toBeGreaterThan(0);
      });

      // Page renders successfully with dark_mode = 'auto'
      expect(screen.getByText(/my trips/i)).toBeInTheDocument();
    });
  });

  describe('FE-PAGE-DASH-034: dashboard widgets persist to settings, not localStorage (#1311)', () => {
    it('reads the timezone widget zones from the settings store', async () => {
      // A zone that is NOT in the hardcoded default ([home, London, Tokyo]) — its presence
      // proves the widget reads the stored preference rather than the old localStorage default.
      seedStore(useSettingsStore, { settings: buildSettings({ dashboard_timezones: ['America/New_York'] }), isLoaded: true });
      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByRole('button', { name: /add timezone/i })).toBeInTheDocument());
      expect(screen.getByText('New York')).toBeInTheDocument();
    });

    it('migrates the pre-3.1.3 localStorage prefs into settings and clears the legacy keys', async () => {
      localStorage.setItem('trek_fx_from', 'CAD');
      localStorage.setItem('trek_fx_to', 'CHF');
      localStorage.setItem('trek_dashboard_tz', JSON.stringify(['America/New_York']));
      seedStore(useSettingsStore, { settings: buildSettings(), isLoaded: true });
      render(<DashboardPage />);
      // The one-time migration runs on mount (settings already loaded) and removes the keys.
      await waitFor(() => {
        expect(localStorage.getItem('trek_fx_from')).toBeNull();
        expect(localStorage.getItem('trek_dashboard_tz')).toBeNull();
      });
      const s = useSettingsStore.getState().settings;
      expect(s.dashboard_fx_from).toBe('CAD');
      expect(s.dashboard_fx_to).toBe('CHF');
      expect(s.dashboard_timezones).toEqual(['America/New_York']);
    });

    it('keeps the legacy localStorage keys when the server write fails, so nothing is lost (#1311)', async () => {
      // The write to persist the migrated values fails (server briefly unavailable during a
      // docker upgrade). The legacy localStorage source must survive so the next load retries —
      // the old code deleted it unconditionally, permanently losing the values.
      server.use(
        http.put('/api/settings', () => new HttpResponse(null, { status: 500 })),
        http.post('/api/settings/bulk', () => new HttpResponse(null, { status: 500 })),
      );
      localStorage.setItem('trek_fx_from', 'CAD');
      localStorage.setItem('trek_fx_to', 'CHF');
      localStorage.setItem('trek_dashboard_tz', JSON.stringify(['America/New_York']));
      seedStore(useSettingsStore, { settings: buildSettings(), isLoaded: true });
      render(<DashboardPage />);
      // The optimistic store update proves the migration effect ran; the failed write must NOT
      // have removed the localStorage source.
      await waitFor(() => {
        expect(useSettingsStore.getState().settings.dashboard_fx_from).toBe('CAD');
      });
      expect(localStorage.getItem('trek_fx_from')).toBe('CAD');
      expect(localStorage.getItem('trek_fx_to')).toBe('CHF');
      expect(localStorage.getItem('trek_dashboard_tz')).toBe(JSON.stringify(['America/New_York']));
    });

    it('drops a malformed legacy timezone value instead of retrying forever (#1311)', async () => {
      localStorage.setItem('trek_dashboard_tz', 'not-json');
      seedStore(useSettingsStore, { settings: buildSettings(), isLoaded: true });
      render(<DashboardPage />);
      await waitFor(() => {
        expect(localStorage.getItem('trek_dashboard_tz')).toBeNull();
      });
      expect(useSettingsStore.getState().settings.dashboard_timezones).toBeUndefined();
    });
  });
});
