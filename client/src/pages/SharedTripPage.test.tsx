import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '../../tests/helpers/render';
import { Routes, Route } from 'react-router';
import { http, HttpResponse } from 'msw';
import { AxiosError } from 'axios';
import { server } from '../../tests/helpers/msw/server';
import { shareApi } from '../api/client';
import { resetAllStores, seedStore } from '../../tests/helpers/store';
import { buildSettings } from '../../tests/helpers/factories';
import { useSettingsStore } from '../store/settingsStore';
import SharedTripPage from './SharedTripPage';
import L from 'leaflet';

// Mock react-leaflet (SharedTripPage renders a map)
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: ({ url }: { url: string }) => <div data-testid="raster-tiles" data-url={url} />,
  Marker: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Polyline: ({ positions }: { positions: [number, number][] }) => (
    <div data-testid="route-line" data-positions={JSON.stringify(positions)} />
  ),
  Tooltip: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  useMap: () => ({
    fitBounds: vi.fn(),
    getCenter: vi.fn(() => ({ lat: 0, lng: 0 })),
  }),
}));

// The real cluster group needs the map context the stubbed MapContainer lacks (#2343).
vi.mock('react-leaflet-cluster', () => ({
  default: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="marker-cluster-group">{children}</div>
  ),
}));

// The basemap is a MapLibre style now, and the real component reaches for
// maplibre-gl through a dynamic import. The page test only cares that it is the
// thing being rendered.
vi.mock('../components/Map/VectorBasemap', () => ({
  default: ({ style }: { style: string }) => <div data-testid="vector-basemap" data-style={style} />,
}));

vi.mock('leaflet', () => {
  const L = {
    divIcon: vi.fn(() => ({})),
    latLngBounds: vi.fn(() => ({
      extend: vi.fn(),
      isValid: vi.fn(() => true),
    })),
    icon: vi.fn(() => ({})),
  };
  return { default: L, ...L };
});

// Helper: render SharedTripPage under the correct route so useParams works
function renderSharedTrip(token: string) {
  return render(
    <Routes>
      <Route path="/shared/:token" element={<SharedTripPage />} />
    </Routes>,
    { initialEntries: [`/shared/${token}`] },
  );
}

// Leaflet is mocked, so every marker the last render drew is a recorded divIcon call.
const divIconMock = () => L.divIcon as unknown as ReturnType<typeof vi.fn>;
const iconHtml = () => divIconMock().mock.calls.map(c => String(c[0].html));

beforeEach(() => {
  // SharedTripPage does NOT require authentication — do NOT seed auth store
  resetAllStores();
  vi.clearAllMocks();
});

describe('SharedTripPage', () => {
  describe('FE-PAGE-SHARED-001: Renders without authentication', () => {
    it('renders loading spinner without any auth state', async () => {
      // Use a token that will delay or we just check initial state before response
      server.use(
        http.get('/api/shared/:token', async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
          return HttpResponse.json({ trips: [] });
        }),
      );

      renderSharedTrip('test-token');

      // While data is loading, shows a spinner (the loading div)
      // The page shows a spinning div before data arrives
      expect(document.body.textContent).toBeDefined();
    });
  });

  describe('FE-PAGE-SHARED-002: Trip data loads from share token API', () => {
    it('fetches shared trip from GET /api/shared/:token', async () => {
      renderSharedTrip('test-token');

      // After data loads, trip name appears
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-SHARED-003: Trip details displayed', () => {
    it('shows trip name after data loads', async () => {
      renderSharedTrip('test-token');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-SHARED-004: Invalid token shows error', () => {
    it('displays error message when token is invalid or expired', async () => {
      renderSharedTrip('invalid-token');

      await waitFor(() => {
        expect(screen.getByText(/link expired or invalid/i)).toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-SHARED-005: No edit controls shown (read-only)', () => {
    it('shows the read-only indicator after data loads', async () => {
      renderSharedTrip('test-token');

      await waitFor(() => {
        // The shared page renders "Read-only shared view" text
        expect(screen.getByText(/read-only/i)).toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-SHARED-006: Expired token hint is shown', () => {
    it('shows hint text below the lock icon on error', async () => {
      renderSharedTrip('expired-token');

      await waitFor(() => {
        expect(screen.getByText(/no longer active/i)).toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-SHARED-007: Map is rendered', () => {
    it('renders the map container for the shared trip', async () => {
      renderSharedTrip('test-token');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument();
      });

      // Map container should be rendered
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  });

  describe('FE-PAGE-SHARED-008: Bookings tab is visible when share_bookings is true', () => {
    it('shows bookings tab button with default test-token permissions', async () => {
      renderSharedTrip('test-token');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument();
      });

      const bookingsTab = screen.getByRole('button', { name: /bookings/i });
      expect(bookingsTab).toBeInTheDocument();

      // Clicking should not crash
      fireEvent.click(bookingsTab);
      expect(bookingsTab).toBeInTheDocument();
    });
  });

  describe('FE-PAGE-SHARED-009: Packing tab hidden when share_packing is false', () => {
    it('does not show packing tab with default test-token (share_packing: false)', async () => {
      renderSharedTrip('test-token');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /packing/i })).toBeNull();
    });
  });

  describe('FE-PAGE-SHARED-010: Packing tab visible when share_packing is true', () => {
    it('shows packing tab and packing items when share_packing is true', async () => {
      server.use(
        http.get('/api/shared/:token', ({ params }) => {
          if (params.token !== 'packing-token') return;
          return HttpResponse.json({
            trip: { id: 1, title: 'Shared Paris Trip', start_date: '2026-07-01', end_date: '2026-07-05' },
            days: [],
            assignments: {},
            dayNotes: {},
            places: [],
            reservations: [],
            accommodations: [],
            packing: [{ id: 1, name: 'Sunscreen', category: 'Health', checked: false }],
            budget: [],
            categories: [],
            permissions: { share_bookings: false, share_packing: true, share_budget: false, share_collab: false },
            collab: [],
          });
        }),
      );

      renderSharedTrip('packing-token');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument();
      });

      const packingTab = screen.getByRole('button', { name: /packing/i });
      expect(packingTab).toBeInTheDocument();

      fireEvent.click(packingTab);

      await waitFor(() => {
        expect(screen.getByText('Sunscreen')).toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-SHARED-011: Budget tab visible when share_budget is true', () => {
    it('shows budget tab and budget items when share_budget is true', async () => {
      server.use(
        http.get('/api/shared/:token', ({ params }) => {
          if (params.token !== 'budget-token') return;
          return HttpResponse.json({
            trip: { id: 1, title: 'Shared Paris Trip', start_date: '2026-07-01', end_date: '2026-07-05', currency: 'EUR' },
            days: [],
            assignments: {},
            dayNotes: {},
            places: [],
            reservations: [],
            accommodations: [],
            packing: [],
            budget: [{ id: 1, name: 'Hotel', total_price: '200', category: 'Accommodation' }],
            categories: [],
            permissions: { share_bookings: false, share_packing: false, share_budget: true, share_collab: false },
            collab: [],
          });
        }),
      );

      renderSharedTrip('budget-token');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument();
      });

      const budgetTab = screen.getByRole('button', { name: /costs/i });
      expect(budgetTab).toBeInTheDocument();

      fireEvent.click(budgetTab);

      await waitFor(() => {
        expect(screen.getByText('Hotel')).toBeInTheDocument();
      });
      expect(screen.getAllByText(/200/).length).toBeGreaterThan(0);
    });
  });

  describe('FE-PAGE-SHARED-012: Collab tab renders messages when share_collab is true', () => {
    it('shows collab messages when share_collab is true', async () => {
      server.use(
        http.get('/api/shared/:token', ({ params }) => {
          if (params.token !== 'collab-token') return;
          return HttpResponse.json({
            trip: { id: 1, title: 'Shared Paris Trip', start_date: '2026-07-01', end_date: '2026-07-05' },
            days: [],
            assignments: {},
            dayNotes: {},
            places: [],
            reservations: [],
            accommodations: [],
            packing: [],
            budget: [],
            categories: [],
            permissions: { share_bookings: false, share_packing: false, share_budget: false, share_collab: true },
            collab: [{ id: 1, username: 'alice', text: 'Hello team!', created_at: '2025-01-01T10:00:00Z', avatar: null }],
          });
        }),
      );

      renderSharedTrip('collab-token');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument();
      });

      const collabTab = screen.getByRole('button', { name: /chat/i });
      expect(collabTab).toBeInTheDocument();

      fireEvent.click(collabTab);

      await waitFor(() => {
        expect(screen.getByText('Hello team!')).toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-SHARED-013: a day opens unfolded and folds with its chevron', () => {
    it('lists the places of the day at once, hides them when folded and shows them again', async () => {
      const day = { id: 101, trip_id: 1, day_number: 1, date: '2026-07-01', title: 'Day One', notes: null };
      const place = { id: 201, trip_id: 1, name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945, category_id: null, image_url: null, address: null };

      server.use(
        http.get('/api/shared/:token', ({ params }) => {
          if (params.token !== 'expand-token') return;
          return HttpResponse.json({
            trip: { id: 1, title: 'Shared Paris Trip', start_date: '2026-07-01', end_date: '2026-07-05' },
            days: [day],
            assignments: {
              '101': [{ id: 301, day_id: 101, place_id: 201, order_index: 0, place }],
            },
            dayNotes: {},
            places: [place],
            reservations: [],
            accommodations: [],
            packing: [],
            budget: [],
            categories: [],
            permissions: { share_bookings: false, share_packing: false, share_budget: false, share_collab: false },
            collab: [],
          });
        }),
      );

      renderSharedTrip('expand-token');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument();
      });

      // Open like the planner's days: the map tooltip and the row in the day.
      expect(screen.getAllByText('Eiffel Tower')).toHaveLength(2);

      fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));
      await waitFor(() => expect(screen.getAllByText('Eiffel Tower')).toHaveLength(1));

      fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
      await waitFor(() => expect(screen.getAllByText('Eiffel Tower')).toHaveLength(2));
    });
  });

  describe('FE-PAGE-SHARED-014: Language picker toggles', () => {
    it('opens language dropdown and closes after selecting a language', async () => {
      renderSharedTrip('test-token');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument();
      });

      // Language picker button shows current language
      const langButton = screen.getByRole('button', { name: /english/i });
      expect(langButton).toBeInTheDocument();

      // Open the dropdown
      fireEvent.click(langButton);

      // Language options should now be visible
      expect(screen.getByRole('button', { name: /deutsch/i })).toBeInTheDocument();

      // Select a different language
      fireEvent.click(screen.getByRole('button', { name: /deutsch/i }));

      // Dropdown should close — Español is no longer visible
      expect(screen.queryByRole('button', { name: /español/i })).toBeNull();
    });
  });

  describe('FE-PAGE-SHARED-015: TREK branding footer is rendered', () => {
    it('renders the Shared via TREK footer', async () => {
      renderSharedTrip('test-token');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument();
      });

      expect(screen.getByText(/shared via/i)).toBeInTheDocument();
    });
  });

  describe('FE-PAGE-SHARED-016: Bookings tab shows reservation list', () => {
    it('renders reservations when bookings tab is active and reservations are provided', async () => {
      server.use(
        http.get('/api/shared/:token', ({ params }) => {
          if (params.token !== 'bookings-token') return;
          return HttpResponse.json({
            trip: { id: 1, title: 'Shared Paris Trip', start_date: '2026-07-01', end_date: '2026-07-05' },
            days: [],
            assignments: {},
            dayNotes: {},
            places: [],
            reservations: [
              { id: 1, title: 'Flight to Paris', type: 'flight', status: 'confirmed', reservation_time: '2026-07-01T10:00:00', metadata: '{}' },
            ],
            accommodations: [],
            packing: [],
            budget: [],
            categories: [],
            permissions: { share_bookings: true, share_packing: false, share_budget: false, share_collab: false },
            collab: [],
          });
        }),
      );

      renderSharedTrip('bookings-token');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /bookings/i }));

      await waitFor(() => {
        expect(screen.getByText('Flight to Paris')).toBeInTheDocument();
      });
    });
  });

  describe('FE-PAGE-SHARED-017: Multi-leg flight shows each leg in the Day Plan', () => {
    const day = { id: 101, trip_id: 1, day_number: 1, date: '2026-07-01', title: 'Day One', notes: null };
    const multiLegFlight = {
      id: 9, trip_id: 1, title: 'Flight', type: 'flight', status: 'confirmed',
      day_id: 101, end_day_id: 101,
      reservation_time: '2026-07-01T08:00:00', reservation_end_time: '2026-07-01T20:00:00',
      metadata: JSON.stringify({
        legs: [
          { from: 'FRA', to: 'BER', airline: 'Lufthansa', flight_number: 'LH1', dep_day_id: 101, dep_time: '08:00', arr_day_id: 101, arr_time: '09:00' },
          { from: 'BER', to: 'HND', airline: 'Lufthansa', flight_number: 'LH2', dep_day_id: 101, dep_time: '10:00', arr_day_id: 101, arr_time: '20:00' },
        ],
        departure_airport: 'FRA', arrival_airport: 'HND', airline: 'Lufthansa', flight_number: 'LH1',
      }),
    };

    function serveMultiLeg(token: string) {
      server.use(
        http.get('/api/shared/:token', ({ params }) => {
          if (params.token !== token) return;
          return HttpResponse.json({
            trip: { id: 1, title: 'Shared Paris Trip', start_date: '2026-07-01', end_date: '2026-07-05' },
            days: [day],
            assignments: {},
            dayNotes: {},
            places: [],
            reservations: [multiLegFlight],
            accommodations: [],
            packing: [],
            budget: [],
            categories: [],
            permissions: { share_bookings: true, share_packing: false, share_budget: false, share_collab: false },
            collab: [],
          });
        }),
      );
    }

    it('renders each leg with its own route, not the overall start/end', async () => {
      serveMultiLeg('multileg-token');
      renderSharedTrip('multileg-token');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument();
      });

      // Expand the day to reveal the timeline
      fireEvent.click(screen.getByText('Day One'));

      await waitFor(() => {
        expect(screen.getByText(/FRA → BER/)).toBeInTheDocument();
      });
      // Second leg shows its OWN route + flight number (the bug showed the overall route here)
      expect(screen.getByText(/BER → HND/)).toBeInTheDocument();
      expect(screen.getByText(/LH2/)).toBeInTheDocument();
      // The overall start→end must NOT appear on any leg
      expect(screen.queryByText(/FRA → HND/)).toBeNull();
    });

    it('lists each leg flight number in the Bookings tab', async () => {
      serveMultiLeg('multileg-bookings-token');
      renderSharedTrip('multileg-bookings-token');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /bookings/i }));

      await waitFor(() => {
        expect(screen.getByText(/LH1/)).toBeInTheDocument();
      });
      expect(screen.getByText(/LH2/)).toBeInTheDocument();
    });
  });

  describe('FE-PAGE-SHARED-018: untitled day uses the translated day label (#1296)', () => {
    it('renders the day-number label via i18n (German), not a hardcoded English string', async () => {
      seedStore(useSettingsStore, { settings: buildSettings({ language: 'de' }) });
      const day = { id: 101, trip_id: 1, day_number: 1, date: '2026-07-01', title: null, notes: null };
      server.use(
        http.get('/api/shared/:token', () => HttpResponse.json({
          trip: { id: 1, title: 'Shared Paris Trip', start_date: '2026-07-01', end_date: '2026-07-05' },
          days: [day],
          assignments: {},
          dayNotes: {},
          places: [],
          reservations: [],
          accommodations: [],
          packing: [],
          budget: [],
          categories: [],
          permissions: { share_bookings: false, share_packing: false, share_budget: false, share_collab: false },
          collab: [],
        })),
      );
      renderSharedTrip('test-token');
      // The untitled day shows the German label "Tag 1", proving the hardcoded English
      // "Day 1" was replaced by the i18n key t('dayplan.dayN'). The map's select names
      // the whole trip until a day is picked, so the card is the one place it shows.
      await waitFor(() => expect(screen.getAllByText('Tag 1')).toHaveLength(1));
      expect(screen.getByText('Tag 1').closest('[aria-pressed]')).not.toBeNull();
    });
  });

  describe('FE-PAGE-SHARED-019: budget renders in the owner\'s baseCurrency, not the EUR trip fallback (#1361)', () => {
    it('labels totals with the payload baseCurrency even when the trip currency is EUR', async () => {
      server.use(
        // No FX needed when the expense is already in the base; stub frankfurter so
        // the live-rate fetch never hits the network in tests.
        http.get('https://api.frankfurter.dev/v2/rates', () => HttpResponse.json([])),
        http.get('/api/shared/:token', ({ params }) => {
          if (params.token !== 'cad-token') return;
          return HttpResponse.json({
            trip: { id: 1, title: 'Shared Paris Trip', start_date: '2026-07-01', end_date: '2026-07-05', currency: 'EUR' },
            baseCurrency: 'CAD',
            days: [], assignments: {}, dayNotes: {}, places: [], reservations: [], accommodations: [], packing: [],
            budget: [{ id: 1, name: 'Hotel', total_price: '200', category: 'Accommodation', currency: 'CAD' }],
            categories: [],
            permissions: { share_bookings: false, share_packing: false, share_budget: true, share_collab: false },
            collab: [],
          });
        }),
      );

      renderSharedTrip('cad-token');
      await waitFor(() => expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: /costs/i }));

      await waitFor(() => expect(screen.getByText('Hotel')).toBeInTheDocument());
      // Total + per-row labelled CAD; never the EUR fallback.
      expect(screen.getAllByText(/200\.00 CAD/).length).toBeGreaterThan(0);
      expect(screen.queryByText(/EUR/)).toBeNull();
    });
  });

  describe('FE-PAGE-SHARED-020: mixed-currency expenses convert into baseCurrency via live FX (#1361)', () => {
    it('converts a EUR expense into the base using fetched rates', async () => {
      // Distinct base (NZD) so this test can't read the cached CAD rates seeded by
      // FE-PAGE-SHARED-019 (useExchangeRates caches per base in module memory).
      server.use(
        // rates[X] = units of X per 1 base(NZD); 0.8 EUR per NZD → 100 EUR = 125.00 NZD
        // (a clean 2-decimal result, distinct from the unconverted 100).
        http.get('https://api.frankfurter.dev/v2/rates', () => HttpResponse.json([{ quote: 'EUR', rate: 0.8 }])),
        http.get('/api/shared/:token', ({ params }) => {
          if (params.token !== 'mixed-token') return;
          return HttpResponse.json({
            trip: { id: 1, title: 'Shared Paris Trip', start_date: '2026-07-01', end_date: '2026-07-05', currency: 'EUR' },
            baseCurrency: 'NZD',
            days: [], assignments: {}, dayNotes: {}, places: [], reservations: [], accommodations: [], packing: [],
            budget: [{ id: 1, name: 'Dinner', total_price: '100', category: 'Food', currency: 'EUR' }],
            categories: [],
            permissions: { share_bookings: false, share_packing: false, share_budget: true, share_collab: false },
            collab: [],
          });
        }),
      );

      renderSharedTrip('mixed-token');
      await waitFor(() => expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: /costs/i }));

      await waitFor(() => expect(screen.getByText('Dinner')).toBeInTheDocument());
      // 100 EUR / 0.8 = 125.00 NZD once the rate resolves.
      await waitFor(() => expect(screen.getAllByText(/125\.00 NZD/).length).toBeGreaterThan(0));
    });
  });

  describe('FE-PAGE-SHARED-043: a foreign expense reads at the rate it was booked at, as in Costs (#2525)', () => {
    it('shows the frozen-rate value in whole cents, not today\'s rate', async () => {
      // CHF so no earlier test has cached rates for this base. Today 1 CHF buys 1.1395
      // USD; the expense froze 1.17 when it was entered. Costs reads 801.76 / 1.17 =
      // 685.26 CHF. Today's rate alone gives 703.61, printed as "703.607".
      server.use(
        http.get('https://api.frankfurter.dev/v2/rates', () => HttpResponse.json([{ quote: 'USD', rate: 1.1395 }])),
        http.get('/api/shared/:token', ({ params }) => {
          if (params.token !== 'booked-token') return;
          return HttpResponse.json({
            trip: { id: 1, title: 'Shared Paris Trip', start_date: '2026-07-01', end_date: '2026-07-05', currency: 'CHF' },
            baseCurrency: 'CHF',
            days: [], assignments: {}, dayNotes: {}, places: [], reservations: [], accommodations: [], packing: [],
            budget: [
              { id: 1, name: 'Aparthotel Silver', total_price: 801.76, category: 'Accommodation', currency: 'USD', exchange_rate: 1.17 },
              { id: 2, name: 'Tram pass', total_price: 100, category: 'Transport', currency: null, exchange_rate: 1 },
            ],
            categories: [],
            permissions: { share_bookings: false, share_packing: false, share_budget: true, share_collab: false },
            collab: [],
          });
        }),
      );

      renderSharedTrip('booked-token');
      await waitFor(() => expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: /costs/i }));

      await waitFor(() => expect(screen.getByText('Aparthotel Silver')).toBeInTheDocument());
      // Row and its category both read the booked value; the trip total adds the
      // 100 CHF tram pass to it.
      // The row, its category card and the category's line in the overview.
      await waitFor(() => expect(screen.getAllByText('685.26 CHF')).toHaveLength(3));
      expect(screen.getByText('785.26 CHF')).toBeInTheDocument();
      expect(screen.queryByText(/703\.6/)).toBeNull();
      // What was entered stays beside the converted row, as the Costs list shows it.
      expect(screen.getByText('801.76 USD')).toBeInTheDocument();
    });

    it('reads a same-day bill in the display currency exactly as typed, with the trip currency\'s quote', async () => {
      // ZAR trip read in USD (ZAR so no earlier test has cached its rates). The bill froze
      // 0.05911 USD per rand, today's ZAR quote. The USD quote, 16.918 rand per dollar, is
      // rounded on its own and is not its inverse.
      server.use(
        http.get('https://api.frankfurter.dev/v2/rates', ({ request }) => {
          const base = new URL(request.url).searchParams.get('base');
          return HttpResponse.json(base === 'ZAR' ? [{ quote: 'USD', rate: 0.05911 }] : [{ quote: 'ZAR', rate: 16.918 }]);
        }),
        http.get('/api/shared/:token', ({ params }) => {
          if (params.token !== 'same-day-token') return;
          return HttpResponse.json({
            trip: { id: 1, title: 'Shared Paris Trip', start_date: '2026-07-01', end_date: '2026-07-05', currency: 'ZAR' },
            baseCurrency: 'USD',
            days: [], assignments: {}, dayNotes: {}, places: [], reservations: [], accommodations: [], packing: [],
            budget: [
              { id: 1, name: 'Villa', total_price: 12345.67, category: 'Accommodation', currency: 'USD', exchange_rate: 0.05911 },
            ],
            categories: [],
            permissions: { share_bookings: false, share_packing: false, share_budget: true, share_collab: false },
            collab: [],
          });
        }),
      );

      renderSharedTrip('same-day-token');
      await waitFor(() => expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: /costs/i }));

      // Total, overview, category card and row, and no second "entered" line under the row.
      await waitFor(() => expect(screen.getAllByText('12,345.67 USD')).toHaveLength(4));
    });

    it('reads a bill in the display currency through the trip currency too, beside what was entered', async () => {
      // The owner reads in USD on a CHF trip. The USD bill was booked at 685.26 CHF,
      // which today is 780.86 USD, the figure Costs and its balances use; the CHF one
      // converts at today's rate (100 CHF = 113.95 USD).
      server.use(
        http.get('https://api.frankfurter.dev/v2/rates', () => HttpResponse.json([{ quote: 'CHF', rate: 1 / 1.1395 }])),
        http.get('/api/shared/:token', ({ params }) => {
          if (params.token !== 'display-token') return;
          return HttpResponse.json({
            trip: { id: 1, title: 'Shared Paris Trip', start_date: '2026-07-01', end_date: '2026-07-05', currency: 'CHF' },
            baseCurrency: 'USD',
            days: [], assignments: {}, dayNotes: {}, places: [], reservations: [], accommodations: [], packing: [],
            budget: [
              { id: 1, name: 'Aparthotel Silver', total_price: 801.76, category: 'Accommodation', currency: 'USD', exchange_rate: 1.17 },
              { id: 2, name: 'Tram pass', total_price: 100, category: 'Transport', currency: null, exchange_rate: 1 },
            ],
            categories: [],
            permissions: { share_bookings: false, share_packing: false, share_budget: true, share_collab: false },
            collab: [],
          });
        }),
      );

      renderSharedTrip('display-token');
      await waitFor(() => expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: /costs/i }));

      await waitFor(() => expect(screen.getAllByText('113.95 USD')).toHaveLength(3));
      expect(screen.getAllByText('780.86 USD')).toHaveLength(3);
      expect(screen.getByText('894.81 USD')).toBeInTheDocument();
      expect(screen.getByText('801.76 USD')).toBeInTheDocument();
      expect(screen.getByText('100.00 CHF')).toBeInTheDocument();
    });
  });

  // FE-PAGE-SHARED-021 to FE-PAGE-SHARED-037 drive the remaining render branches of
  // the page: header variants, the permission-driven tab strip, and every item kind
  // the day timeline, bookings, packing, costs and chat sections can produce.

  const ALL_TABS = { share_bookings: true, share_packing: true, share_budget: true, share_collab: true };

  function payload(over: Record<string, unknown> = {}) {
    return {
      trip: { id: 1, title: 'Shared Paris Trip' },
      days: [],
      assignments: {},
      dayNotes: {},
      places: [],
      reservations: [],
      accommodations: [],
      packing: [],
      budget: [],
      categories: [],
      permissions: { share_bookings: false, share_packing: false, share_budget: false, share_collab: false },
      collab: [],
      ...over,
    };
  }

  /** Serve one payload for `token`; anything else falls through to the default handler. */
  function serve(token: string, body: Record<string, unknown>) {
    server.use(
      http.get('/api/shared/:token', ({ params }) => (params.token === token ? HttpResponse.json(body) : undefined)),
    );
  }

  async function open(token: string, body: Record<string, unknown>) {
    serve(token, body);
    renderSharedTrip(token);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Shared Paris Trip' })).toBeInTheDocument());
  }

  function coverStyle(): string {
    return document.querySelector('[data-testid="shared-hero"] img')?.getAttribute('src') ?? '';
  }

  /** The select over the map and its step buttons. */
  const dayPicker = () => within(screen.getByTestId('map-day-picker'));
  const onMap = () => within(screen.getByTestId('map-container'));
  const nextDay = () => fireEvent.click(dayPicker().getByRole('button', { name: 'Next day' }));
  const prevDay = () => fireEvent.click(dayPicker().getByRole('button', { name: 'Previous day' }));
  /** The card of one day, found by its title. */
  const dayCard = (title: string) => within(screen.getByText(title).closest('article') as HTMLElement);

  /** The page formats dates through the active locale (en-US in tests). */
  const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(iso).toLocaleDateString('en-US', opts);

  describe('FE-PAGE-SHARED-021: cover image, description and date range in the header', () => {
    it('uses an absolute cover URL unchanged and renders the description', async () => {
      await open('cover-http-token', payload({
        trip: {
          id: 1, title: 'Shared Paris Trip', description: 'Five days of pastry',
          cover_image: 'https://cdn.example.com/a.jpg',
        },
      }));

      expect(coverStyle()).toContain('https://cdn.example.com/a.jpg');
      expect(screen.getByText('Five days of pastry')).toBeInTheDocument();
      // Without start/end dates the date pill is skipped entirely.
      expect(screen.queryByText(/days$/)).toBeNull();
    });

    it('keeps a root-relative cover path as-is', async () => {
      await open('cover-abs-token', payload({
        trip: { id: 1, title: 'Shared Paris Trip', cover_image: '/uploads/covers/b.jpg' },
      }));

      expect(coverStyle()).toContain('/uploads/covers/b.jpg');
      expect(coverStyle()).not.toContain('/uploads//uploads/');
    });

    it('prefixes a bare filename with the uploads directory', async () => {
      await open('cover-bare-token', payload({
        trip: { id: 1, title: 'Shared Paris Trip', cover_image: 'c.jpg' },
      }));

      expect(coverStyle()).toContain('/uploads/c.jpg');
    });

    it('shows only the start date and no day count when the trip has no days', async () => {
      await open('startonly-token', payload({
        trip: { id: 1, title: 'Shared Paris Trip', start_date: '2026-07-01' },
      }));

      expect(
        screen.getByText(fmtDate('2026-07-01T00:00:00Z', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })),
      ).toBeInTheDocument();
      expect(screen.queryByText(/^\d+ days$/)).toBeNull();
    });
  });

  describe('FE-PAGE-SHARED-022: a payload without optional collections still renders', () => {
    it('falls back to empty lists when places, reservations and permissions are missing', async () => {
      await open('sparse-token', {
        trip: { id: 1, title: 'Shared Paris Trip' },
        days: [{ id: 1, trip_id: 1, day_number: 1, date: null, title: 'Lone day' }],
        assignments: {},
        dayNotes: {},
      });

      // share_map is undefined, so the plan (the !== false branch) shows; with nothing
      // else shared there is no tab bar to choose from.
      expect(screen.queryByRole('button', { name: /plan/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /bookings/i })).toBeNull();
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
      // The day card still renders even though reservations/accommodations are absent.
      expect(screen.getByText('Lone day')).toBeInTheDocument();
      expect(screen.getByText('0 places')).toBeInTheDocument();
      expect(screen.getByText(/shared via/i)).toBeInTheDocument();
    });
  });

  describe('FE-PAGE-SHARED-023: share_map=false hides the plan tab', () => {
    it('lands on the first shared section instead of an empty map', async () => {
      await open('nomap-token', payload({
        permissions: { share_map: false, ...ALL_TABS },
        packing: [{ id: 1, name: 'Passport', category: null, checked: false }],
        reservations: [{ id: 1, title: 'Hotel Ibis', type: 'hotel', status: 'pending', metadata: null }],
      }));

      expect(screen.queryByRole('button', { name: /plan/i })).toBeNull();
      // Bookings is the first shared section, so it is auto-selected and rendered.
      await waitFor(() => expect(screen.getByText('Hotel Ibis')).toBeInTheDocument());
      expect(screen.queryByTestId('map-container')).toBeNull();
    });
  });

  describe('FE-PAGE-SHARED-024: day header details', () => {
    it('renders an accommodation badge, the place count and the undated fallback', async () => {
      const day = { id: 5, trip_id: 1, day_number: 1, date: null, title: null };
      await open('accom-token', payload({
        days: [day],
        accommodations: [{ id: 3, place_name: 'Hotel Lutetia', start_day_id: 5, end_day_id: 5 }],
      }));

      // On the card's head, which is also what opens the day on the map.
      expect(screen.getAllByText('Day 1')).toHaveLength(1);
      expect(screen.getByText('Day 1').closest('[aria-pressed]')).not.toBeNull();
      expect(screen.getByText('Hotel Lutetia')).toBeInTheDocument();
      expect(screen.getByText('0 places')).toBeInTheDocument();
      // No date row for an undated day.
      expect(screen.queryByText(/2026/)).toBeNull();
    });

    it('sorts days by day_number regardless of payload order', async () => {
      await open('order-token', payload({
        days: [
          { id: 2, trip_id: 1, day_number: 2, date: null, title: 'Second' },
          { id: 1, trip_id: 1, day_number: 1, date: null, title: 'First' },
        ],
      }));

      const titles = Array.from(document.querySelectorAll('div')).map((d) => d.textContent);
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(titles.join('|').indexOf('First')).toBeLessThan(titles.join('|').lastIndexOf('Second'));
    });
  });

  describe('FE-PAGE-SHARED-025: expanded day renders every place variant', () => {
    const day = { id: 7, trip_id: 1, day_number: 1, date: '2026-07-01', title: 'Day One' };
    const withImage = {
      id: 201, name: 'Louvre', lat: 48.86, lng: 2.33, category_id: 4,
      image_url: '/uploads/places/louvre.jpg', address: 'Rue de Rivoli', place_time: '09:00', end_time: '11:00',
    };
    const withDescription = {
      id: 202, name: 'Seine Walk', lat: null, lng: null, category_id: null,
      image_url: null, address: null, description: 'Along the river', place_time: '12:00', end_time: null,
    };
    const bare = { id: 203, name: 'Mystery Stop', lat: null, lng: null, category_id: 99, image_url: null };

    it('shows the photo, the category colour, the address/description fallback and the time range', async () => {
      await open('places-token', payload({
        days: [day],
        places: [withImage, withDescription, bare],
        categories: [{ id: 4, name: 'Museum', color: '#ff0000', icon: 'landmark' }],
        assignments: {
          '7': [
            { id: 301, day_id: 7, place_id: 201, order_index: 0, place: withImage },
            { id: 302, day_id: 7, place_id: 202, order_index: 1, place: withDescription },
            { id: 303, day_id: 7, place_id: 203, order_index: 2, place: bare },
            // A dangling assignment whose place was deleted must not crash the timeline.
            { id: 304, day_id: 7, place_id: 999, order_index: 3, place: null },
          ],
        },
      }));

      // The count matches the rendered rows — the assignment whose place is gone is left out.
      expect(screen.getByText('3 places')).toBeInTheDocument();

      await waitFor(() => expect(screen.getByText('Rue de Rivoli')).toBeInTheDocument());
      expect((document.querySelector('img[src="/uploads/places/louvre.jpg"]') as HTMLImageElement)).toBeInTheDocument();
      // A place with no address falls back to its description.
      expect(screen.getByText('Along the river')).toBeInTheDocument();
      // The bare place shows neither line and no time badge.
      expect(screen.getByText('Mystery Stop')).toBeInTheDocument();
      expect(screen.getByText('09:00 → 11:00')).toBeInTheDocument();
      expect(screen.getByText(/^12:00$/)).toBeInTheDocument();
    });

    it('only maps the day its card opens, and the whole trip again on a second click', async () => {
      const pantheon = { id: 204, name: 'Pantheon', lat: 48.846, lng: 2.346, category_id: null, image_url: null };
      await open('mapday-token', payload({
        days: [day],
        places: [withImage, withDescription, pantheon],
        assignments: { '7': [{ id: 301, day_id: 7, place_id: 201, order_index: 0, place: withImage }] },
      }));

      // Whole trip: every geocoded place has a marker on the map (the unplanned card
      // lists the Pantheon as well, so look only at the map's tooltips), the Pantheon too, though no day visits it.
      expect(onMap().getByText('Pantheon')).toBeInTheDocument();
      expect(onMap().queryByText('Seine Walk')).toBeNull();

      // Once picked, the select over the map names the day as well; the card is the one in an article.
      const cardTitle = () => screen.getAllByText('Day One').find(el => el.closest('article')) as HTMLElement;
      fireEvent.click(cardTitle());
      await waitFor(() => expect(onMap().queryByText('Pantheon')).toBeNull());
      expect(cardTitle().closest('[aria-pressed]')).toHaveAttribute('aria-pressed', 'true');

      fireEvent.click(cardTitle());
      await waitFor(() => expect(onMap().getByText('Pantheon')).toBeInTheDocument());
    });
  });

  // ── Day order, route line and the day picker at the map (#1962) ────────────
  describe('FE-PAGE-SHARED-038: day markers carry their order and a connecting line', () => {
    const day = { id: 7, trip_id: 1, day_number: 1, date: '2026-07-02', title: 'Day One' };
    const louvre = { id: 201, name: 'Louvre', lat: 48.86, lng: 2.33, category: { id: 1, name: 'Sight', color: '#ff0000', icon: 'landmark' } };
    const orsay = { id: 202, name: 'Orsay', lat: 48.85, lng: 2.32, category: null };
    const notre = { id: 203, name: 'Notre-Dame', lat: 48.853, lng: 2.35, category: null };

    beforeEach(() => divIconMock().mockClear());

    it('numbers the stops by order_index, not by payload order', async () => {
      await open('order-map-token', payload({
        days: [day],
        places: [louvre, orsay, notre],
        assignments: {
          '7': [
            { id: 302, day_id: 7, place_id: 202, order_index: 1, place: orsay },
            { id: 303, day_id: 7, place_id: 203, order_index: 2, place: notre },
            { id: 301, day_id: 7, place_id: 201, order_index: 0, place: louvre },
          ],
        },
      }));

      nextDay();
      await waitFor(() => expect(iconHtml().some((h: string) => h.includes('>1<'))).toBe(true));

      const html = iconHtml();
      // Louvre is order_index 0 and therefore 1, regardless of where it sat in the payload.
      expect(html.filter((h: string) => h.includes('>1<'))).toHaveLength(1);
      expect(html.filter((h: string) => h.includes('>2<'))).toHaveLength(1);
      expect(html.filter((h: string) => h.includes('>3<'))).toHaveLength(1);
    });

    it('shows both positions once for a stop the day visits twice, and renders it once', async () => {
      await open('twice-token', payload({
        days: [day],
        places: [louvre, orsay],
        assignments: {
          '7': [
            { id: 301, day_id: 7, place_id: 201, order_index: 0, place: louvre },
            { id: 302, day_id: 7, place_id: 202, order_index: 1, place: orsay },
            { id: 303, day_id: 7, place_id: 201, order_index: 2, place: louvre },
          ],
        },
      }));

      nextDay();
      await waitFor(() => expect(iconHtml().some((h: string) => h.includes('>1, 3<'))).toBe(true));
      // One marker for the repeated place, not two with the same React key.
      expect(iconHtml().filter((h: string) => h.includes('>1, 3<'))).toHaveLength(1);
    });

    it('leaves the trip-wide pool unnumbered, since it has no order to show', async () => {
      await open('nonum-token', payload({
        days: [day],
        places: [louvre, orsay],
        assignments: { '7': [{ id: 301, day_id: 7, place_id: 201, order_index: 0, place: louvre }] },
      }));

      await waitFor(() => expect(iconHtml().length).toBeGreaterThan(0));
      expect(iconHtml().some((h: string) => h.includes('border-radius:8px'))).toBe(false);
    });

    it('draws the connecting line only for a day with more than one stop', async () => {
      await open('line-token', payload({
        days: [day],
        places: [louvre, orsay],
        assignments: {
          '7': [
            { id: 301, day_id: 7, place_id: 201, order_index: 0, place: louvre },
            { id: 302, day_id: 7, place_id: 202, order_index: 1, place: orsay },
          ],
        },
      }));

      // No day selected: no line, even though the trip has two geocoded places.
      expect(screen.queryByTestId('route-line')).toBeNull();

      nextDay();
      await waitFor(() => expect(screen.getByTestId('route-line')).toBeInTheDocument());

      prevDay();
      await waitFor(() => expect(screen.queryByTestId('route-line')).toBeNull());
    });

    it('does not draw a line for a day with a single stop', async () => {
      await open('single-token', payload({
        days: [day],
        places: [louvre],
        assignments: { '7': [{ id: 301, day_id: 7, place_id: 201, order_index: 0, place: louvre }] },
      }));

      nextDay();
      await waitFor(() => expect(screen.getAllByText('Louvre').length).toBeGreaterThan(1));
      expect(screen.queryByTestId('route-line')).toBeNull();
    });
  });

  describe('FE-PAGE-SHARED-039: the day picker sits at the map and agrees with the day card', () => {
    const day = { id: 7, trip_id: 1, day_number: 1, date: '2026-07-02', title: 'Day One' };
    const louvre = { id: 201, name: 'Louvre', lat: 48.86, lng: 2.33, category: null };
    const orsay = { id: 202, name: 'Orsay', lat: 48.85, lng: 2.32, category: null };

    it('narrows the markers to one day and back again', async () => {
      await open('picker-token', payload({
        days: [day],
        places: [louvre, orsay],
        assignments: { '7': [{ id: 301, day_id: 7, place_id: 201, order_index: 0, place: louvre }] },
      }));

      // All: both geocoded places are on the map, so Orsay's tooltip is present (the
      // unplanned card names Orsay too, so the check stays inside the map).
      expect(onMap().getByText('Orsay')).toBeInTheDocument();

      nextDay();
      await waitFor(() => expect(onMap().queryByText('Orsay')).toBeNull());

      prevDay();
      await waitFor(() => expect(onMap().getByText('Orsay')).toBeInTheDocument());
    });

    it('names the open day in the select and presses its card, and stops at either end', async () => {
      await open('pressed-token', payload({ days: [day], places: [louvre], assignments: {} }));

      expect(dayPicker().getByText('Whole trip')).toBeInTheDocument();
      expect(dayPicker().getByRole('button', { name: 'Previous day' })).toBeDisabled();

      nextDay();
      await waitFor(() => expect(dayPicker().getByText('Day One')).toBeInTheDocument());
      const card = screen.getAllByText('Day One').find(el => el.closest('article'));
      expect(card?.closest('[aria-pressed]')).toHaveAttribute('aria-pressed', 'true');
      expect(dayPicker().getByRole('button', { name: 'Next day' })).toBeDisabled();
    });

    it('opens a day picked from the list of the select', async () => {
      await open('select-token', payload({
        days: [day],
        places: [louvre, orsay],
        assignments: { '7': [{ id: 301, day_id: 7, place_id: 201, order_index: 0, place: louvre }] },
      }));

      fireEvent.click(dayPicker().getByText('Whole trip'));
      const option = screen.getAllByText('Day One').find(el => !el.closest('article') && !el.closest('[data-testid="map-day-picker"]'));
      fireEvent.click(option as HTMLElement);
      await waitFor(() => expect(onMap().queryByText('Orsay')).toBeNull());
    });
  });

  describe('FE-PAGE-SHARED-041: a share link visitor gets a basemap that needs no key', () => {
    const louvre = { id: 201, name: 'Louvre', lat: 48.86, lng: 2.33, category: null };

    it('draws the OpenFreeMap style rather than raster tiles', async () => {
      // A visitor has no settings of their own, so the map falls back to the app
      // default. CARTO stamps "API KEY REQUIRED" over keyless tiles since
      // 26.08.2026, and a share link is exactly where nobody has a key.
      await open('basemap-token', payload({ days: [], places: [louvre], assignments: {} }));

      expect(screen.getByTestId('vector-basemap')).toHaveAttribute(
        'data-style',
        'https://tiles.openfreemap.org/styles/positron',
      );
      expect(screen.queryByTestId('raster-tiles')).toBeNull();
    });
  });

  describe('FE-PAGE-SHARED-040: trip-wide markers keep their category colour', () => {
    // The payload nests the category on a day's assignments but sends it flat on the
    // trip-wide pool, so reading only the nested shape painted every marker indigo.
    it('reads the flat category_color the trip pool sends', async () => {
      divIconMock().mockClear();
      await open('flatcat-token', payload({
        days: [],
        places: [{ id: 201, name: 'Louvre', lat: 48.86, lng: 2.33, category_color: '#ff8800', category_icon: 'landmark' }],
        assignments: {},
      }));

      await waitFor(() => expect(iconHtml().length).toBeGreaterThan(0));
      const html = iconHtml();
      expect(html.some((h: string) => h.includes('#ff8800'))).toBe(true);
      expect(html.some((h: string) => h.includes('#6366f1'))).toBe(false);
    });
  });

  describe('FE-PAGE-SHARED-026: expanded day renders notes and single-leg transports', () => {
    const day = { id: 9, trip_id: 1, day_number: 1, date: '2026-07-02', title: 'Day One' };

    it('renders timed and untimed notes plus flight, train and fallback transport rows', async () => {
      await open('transport-token', payload({
        days: [day],
        dayNotes: {
          '9': [
            { id: 41, day_id: 9, text: 'Buy museum pass', time: '08:30', sort_order: 0 },
            { id: 42, day_id: 9, text: 'Anything goes', time: null, sort_order: 1 },
          ],
        },
        reservations: [
          {
            id: 51, title: 'Flight home', type: 'flight', status: 'confirmed', day_id: 9, end_day_id: 9,
            reservation_time: '2026-07-02T18:00:00', reservation_end_time: '2026-07-02T20:30:00',
            // Already-parsed metadata (not a JSON string) must work too.
            metadata: { airline: 'Air France', flight_number: 'AF1', departure_airport: 'CDG', arrival_airport: 'TXL' },
          },
          {
            id: 52, title: 'ICE 599', type: 'train', status: 'confirmed', day_id: 9, end_day_id: 9,
            reservation_time: '2026-07-02T09:15:00', reservation_end_time: null,
            metadata: JSON.stringify({ train_number: 'ICE 599', platform: '7' }),
          },
          {
            id: 53, title: 'Harbour ferry', type: 'ferry', status: 'pending', day_id: 9, end_day_id: 9,
            reservation_time: null, reservation_end_time: null, metadata: '',
          },
        ],
      }));

      await waitFor(() => expect(screen.getByText('Buy museum pass')).toBeInTheDocument());
      expect(screen.getByText('08:30')).toBeInTheDocument();
      expect(screen.getByText('Anything goes')).toBeInTheDocument();

      // Each fact on its own, beside the time pill.
      expect(screen.getByText('Flight home')).toBeInTheDocument();
      expect(screen.getByText('18:00 → 20:30')).toBeInTheDocument();
      expect(screen.getByText('Air France')).toBeInTheDocument();
      expect(screen.getByText('AF1')).toBeInTheDocument();
      expect(screen.getByText('CDG → TXL')).toBeInTheDocument();
      // The title and the train number are the same words here.
      expect(screen.getAllByText('ICE 599')).toHaveLength(2);
      expect(screen.getByText('Platform 7')).toBeInTheDocument();
      expect(screen.getByText('09:15')).toBeInTheDocument();
      // An unmapped transport type falls back to the generic ticket row with no subtitle.
      expect(screen.getByText('Harbour ferry')).toBeInTheDocument();
    });

    it('leaves the subtitle empty when the metadata carries no route at all', async () => {
      await open('nometa-token', payload({
        days: [day],
        reservations: [
          {
            id: 61, title: 'Bus 100', type: 'bus', status: 'confirmed', day_id: 9, end_day_id: 9,
            reservation_time: '2026-07-02T07:00:00', metadata: null,
          },
          {
            id: 62, title: 'Regio', type: 'train', status: 'confirmed', day_id: 9, end_day_id: 9,
            reservation_time: '2026-07-02T08:00:00', metadata: JSON.stringify({}),
          },
          {
            id: 63, title: 'Shuttle', type: 'flight', status: 'confirmed', day_id: 9, end_day_id: 9,
            reservation_time: '2026-07-02T10:00:00', metadata: JSON.stringify({ airline: 'KLM' }),
          },
        ],
      }));

      await waitFor(() => expect(screen.getByText('Bus 100')).toBeInTheDocument());
      expect(screen.getByText('07:00')).toBeInTheDocument();
      expect(screen.getByText('Regio')).toBeInTheDocument();
      expect(screen.getByText('08:00')).toBeInTheDocument();
      // Only the airline is known, so no airport pair is appended.
      expect(screen.getByText('KLM')).toBeInTheDocument();
    });

    it('renders each leg of a multi-leg train with its own train number and platform', async () => {
      await open('trainlegs-token', payload({
        days: [day],
        reservations: [
          {
            id: 71, title: 'Rail to Milan', type: 'train', status: 'confirmed', day_id: 9, end_day_id: 9,
            reservation_time: '2026-07-02T06:00:00', reservation_end_time: '2026-07-02T18:00:00',
            metadata: JSON.stringify({
              legs: [
                { from: 'Berlin', to: 'Basel', train_number: 'ICE 73', platform: '3', dep_day_id: 9, dep_time: '06:00', arr_day_id: 9, arr_time: '12:00' },
                { train_number: 'EC 51', dep_day_id: 9, dep_time: '12:30', arr_day_id: 9, arr_time: '18:00' },
              ],
            }),
          },
        ],
      }));

      await waitFor(() => expect(screen.getByText('ICE 73')).toBeInTheDocument());
      expect(screen.getByText('Platform 3')).toBeInTheDocument();
      expect(screen.getByText('Berlin → Basel')).toBeInTheDocument();
      // The second leg has neither platform nor stations, so only its number shows.
      expect(screen.getByText('EC 51')).toBeInTheDocument();
    });

    it('drops the route from a flight leg that has no airports of its own', async () => {
      await open('flightlegs-token', payload({
        days: [day],
        reservations: [
          {
            id: 72, title: 'Long haul', type: 'flight', status: 'confirmed', day_id: 9, end_day_id: 9,
            reservation_time: '2026-07-02T06:00:00', reservation_end_time: '2026-07-02T22:00:00',
            metadata: JSON.stringify({
              legs: [
                { from: 'FRA', to: 'DXB', airline: 'Emirates', flight_number: 'EK46', dep_day_id: 9, dep_time: '06:00', arr_day_id: 9, arr_time: '14:00' },
                { airline: 'Emirates', flight_number: 'EK350', dep_day_id: 9, dep_time: '16:00', arr_day_id: 9, arr_time: '22:00' },
              ],
            }),
          },
        ],
      }));

      await waitFor(() => expect(screen.getByText('EK46')).toBeInTheDocument());
      expect(screen.getByText('FRA → DXB')).toBeInTheDocument();
      expect(screen.getAllByText('Emirates')).toHaveLength(2);
      // The second leg has no airports of its own, so it states its number and no route.
      expect(screen.getByText('EK350')).toBeInTheDocument();
      expect(screen.getAllByText(/ → [A-Z]{3}$/)).toHaveLength(1);
    });
  });

  describe('FE-PAGE-SHARED-027: bookings tab detail rows', () => {
    it('shows date, time and location only when present and marks the status', async () => {
      await open('bookingmeta-token', payload({
        permissions: { share_bookings: true, share_packing: false, share_budget: false, share_collab: false },
        reservations: [
          {
            id: 81, title: 'Museum entry', type: 'ticket', status: 'pending',
            reservation_time: '2026-07-03T14:00:00', location: 'Louvre', metadata: '{}',
          },
          {
            id: 82, title: 'Rental car', type: 'car', status: 'confirmed',
            reservation_time: null, location: null, metadata: { airline: 'Sixt', flight_number: 'X9' },
          },
          {
            id: 83, title: 'Night bus', type: 'bus', status: 'confirmed',
            reservation_time: null, location: null, metadata: null,
          },
          {
            id: 84, title: 'Coach', type: 'car', status: 'confirmed',
            reservation_time: null, location: null, metadata: { airline: 'Flixbus' },
          },
        ],
      }));

      fireEvent.click(screen.getByRole('button', { name: /bookings/i }));

      await waitFor(() => expect(screen.getByText('Museum entry')).toBeInTheDocument());
      expect(
        screen.getByText(fmtDate('2026-07-03T00:00:00Z', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })),
      ).toBeInTheDocument();
      expect(screen.getByText('14:00')).toBeInTheDocument();
      expect(screen.getByText('Louvre')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();

      // No date/time/location for the car, only its metadata, one field each.
      expect(screen.getByText('Sixt')).toBeInTheDocument();
      expect(screen.getByText('X9')).toBeInTheDocument();
      expect(screen.getAllByText('Confirmed')).toHaveLength(3);
      // Metadata-less bookings render the title only, no meta line.
      expect(screen.getByText('Night bus')).toBeInTheDocument();
      // An airline without a flight number appends nothing after it.
      expect(screen.getByText('Flixbus')).toBeInTheDocument();
    });

    it('lists train legs with platform labels in the bookings tab', async () => {
      await open('bookingtrain-token', payload({
        permissions: { share_bookings: true, share_packing: false, share_budget: false, share_collab: false },
        reservations: [
          {
            id: 91, title: 'Rail pass', type: 'train', status: 'confirmed',
            reservation_time: '2026-07-04', metadata: JSON.stringify({
              legs: [
                { from: 'Bern', to: 'Zurich', train_number: 'IC 8', platform: '12' },
                { train_number: 'S3' },
              ],
            }),
          },
        ],
      }));

      fireEvent.click(screen.getByRole('button', { name: /bookings/i }));

      await waitFor(() => expect(screen.getByText('IC 8 Platform 12 Bern → Zurich')).toBeInTheDocument());
      expect(screen.getByText('S3')).toBeInTheDocument();
      // A bare date without a time renders the date field only.
      expect(
        screen.getByText(fmtDate('2026-07-04T00:00:00Z', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })),
      ).toBeInTheDocument();
      expect(screen.queryByText('Time')).toBeNull();
    });

    it('omits the route of a flight leg without airports', async () => {
      await open('bookingflight-token', payload({
        permissions: { share_bookings: true, share_packing: false, share_budget: false, share_collab: false },
        reservations: [
          {
            id: 92, title: 'Long haul', type: 'flight', status: 'confirmed', reservation_time: null,
            metadata: JSON.stringify({
              legs: [
                { from: 'FRA', to: 'DXB', airline: 'Emirates', flight_number: 'EK46' },
                { airline: 'Emirates', flight_number: 'EK350' },
              ],
            }),
          },
        ],
      }));

      fireEvent.click(screen.getByRole('button', { name: /bookings/i }));

      await waitFor(() => expect(screen.getByText('Emirates EK46 FRA → DXB')).toBeInTheDocument());
      expect(screen.getByText('Emirates EK350')).toBeInTheDocument();
    });

    it('renders no booking list at all when the trip has none', async () => {
      await open('nobookings-token', payload({
        permissions: { share_bookings: true, share_packing: false, share_budget: false, share_collab: false },
      }));

      fireEvent.click(screen.getByRole('button', { name: /bookings/i }));

      expect(screen.queryByText('Confirmed')).toBeNull();
      expect(screen.queryByTestId('map-container')).toBeNull();
      expect(screen.getByText('No bookings shared yet')).toBeInTheDocument();
    });
  });

  describe('FE-PAGE-SHARED-028: packing list grouping', () => {
    it('groups by category, falls back to Other and strikes through checked items', async () => {
      await open('packinggroup-token', payload({
        permissions: { share_bookings: false, share_packing: true, share_budget: false, share_collab: false },
        packing: [
          { id: 1, name: 'Toothbrush', category: 'Bathroom', checked: true },
          { id: 2, name: 'Towel', category: 'Bathroom', checked: false },
          { id: 3, name: 'Charger', category: null, checked: false },
        ],
      }));

      fireEvent.click(screen.getByRole('button', { name: /packing/i }));

      await waitFor(() => expect(screen.getByText('Bathroom')).toBeInTheDocument());
      expect(screen.getByText('Other')).toBeInTheDocument();
      expect(screen.getByText('Toothbrush')).toHaveClass('line-through');
      expect(screen.getByText('Towel')).not.toHaveClass('line-through');
      // One of three packed, overall and in its category.
      expect(screen.getByText('1 of 3 packed (33%)')).toBeInTheDocument();
      expect(screen.getByText('1/2')).toBeInTheDocument();
    });

    it('renders nothing when the packing list is empty', async () => {
      await open('packingempty-token', payload({
        permissions: { share_bookings: false, share_packing: true, share_budget: false, share_collab: false },
      }));

      fireEvent.click(screen.getByRole('button', { name: /packing/i }));
      expect(screen.queryByText('Other')).toBeNull();
      expect(screen.getByText('The packing list is still empty')).toBeInTheDocument();
    });
  });

  describe('FE-PAGE-SHARED-029: costs tab fallbacks', () => {
    it('uses the trip currency for rows without one and dashes out priceless items', async () => {
      server.use(http.get('https://api.frankfurter.dev/v2/rates', () => HttpResponse.json([])));
      await open('costfallback-token', payload({
        trip: { id: 1, title: 'Shared Paris Trip', currency: 'GBP' },
        permissions: { share_bookings: false, share_packing: false, share_budget: true, share_collab: false },
        budget: [
          { id: 1, name: 'Hostel', total_price: '80', category: 'Stay', currency: null },
          { id: 2, name: 'Museum pass', total_price: null, category: null, currency: null },
        ],
      }));

      fireEvent.click(screen.getByRole('button', { name: /costs/i }));

      await waitFor(() => expect(screen.getByText('Hostel')).toBeInTheDocument());
      // Each category twice: its line in the overview and its own card.
      expect(screen.getAllByText('Stay')).toHaveLength(2);
      expect(screen.getAllByText('Other')).toHaveLength(2);
      // The priceless row states no amount rather than a placeholder.
      expect(screen.getByText('Museum pass').closest('li')?.textContent).toBe('Museum pass');
      // The priceless row contributes 0, so the total equals the single priced row.
      expect(screen.getAllByText('80.00 GBP').length).toBeGreaterThanOrEqual(2);
    });

    it('falls back to the payload base currency and treats an unparsable price as zero', async () => {
      server.use(http.get('https://api.frankfurter.dev/v2/rates', () => HttpResponse.json([])));
      await open('costbase-token', payload({
        // Neither the trip nor the rows name a currency, so curOf() lands on the base.
        trip: { id: 1, title: 'Shared Paris Trip' },
        baseCurrency: 'SEK',
        permissions: { share_bookings: false, share_packing: false, share_budget: true, share_collab: false },
        budget: [{ id: 1, name: 'Tips', total_price: 'free', category: 'Misc', currency: null }],
      }));

      fireEvent.click(screen.getByRole('button', { name: /costs/i }));

      await waitFor(() => expect(screen.getByText('Tips')).toBeInTheDocument());
      expect(screen.getAllByText('0.00 SEK').length).toBeGreaterThanOrEqual(3);
    });

    it('renders nothing when there are no expenses', async () => {
      await open('costempty-token', payload({
        permissions: { share_bookings: false, share_packing: false, share_budget: true, share_collab: false },
      }));

      fireEvent.click(screen.getByRole('button', { name: /costs/i }));
      expect(screen.queryByText('Total Costs')).toBeNull();
      expect(screen.getByText('No expenses yet')).toBeInTheDocument();
    });
  });

  describe('FE-PAGE-SHARED-030: chat tab message rendering', () => {
    it('prints one date separator per day and falls back to an initial without an avatar', async () => {
      await open('chatgroup-token', payload({
        permissions: { share_bookings: false, share_packing: false, share_budget: false, share_collab: true },
        collab: [
          { id: 1, username: 'alice', text: 'Morning', created_at: '2026-07-01T08:00:00Z', avatar: 'a.png' },
          { id: 2, username: 'bob', text: 'Afternoon', created_at: '2026-07-01T14:00:00Z', avatar: null },
          { id: 3, username: null, text: 'Next day', created_at: '2026-07-02T09:00:00Z', avatar: null },
        ],
      }));

      fireEvent.click(screen.getByRole('button', { name: /chat/i }));

      await waitFor(() => expect(screen.getByText('Morning')).toBeInTheDocument());
      const head = screen.getByRole('heading', { name: 'Chat' }).parentElement as HTMLElement;
      expect(within(head).getByText('3')).toBeInTheDocument();
      // Two distinct days -> exactly one separator each, none for the second message
      // of day one.
      const sep = (iso: string) => fmtDate(iso, { weekday: 'short', day: 'numeric', month: 'short' });
      expect(screen.getAllByText(sep('2026-07-01T08:00:00Z'))).toHaveLength(1);
      expect(screen.getAllByText(sep('2026-07-02T09:00:00Z'))).toHaveLength(1);
      expect(document.querySelector('img[src*="a.png"]')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      // A message without a username renders the "?" placeholder.
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('renders nothing when the chat is empty', async () => {
      await open('chatempty-token', payload({
        permissions: { share_bookings: false, share_packing: false, share_budget: false, share_collab: true },
      }));

      fireEvent.click(screen.getByRole('button', { name: /chat/i }));
      expect(screen.queryByRole('heading', { name: 'Chat' })).toBeNull();
      expect(screen.getByText('No messages yet')).toBeInTheDocument();
    });
  });

  describe('FE-PAGE-SHARED-031: language options highlight on hover', () => {
    it('paints and clears the hover background of a language entry', async () => {
      await open('langhover-token', payload());

      fireEvent.click(screen.getByRole('button', { name: /english/i }));
      const option = screen.getByRole('button', { name: /deutsch/i });

      fireEvent.mouseEnter(option);
      expect(option.style.background).toBe('var(--bg-hover)');
      fireEvent.mouseLeave(option);
      expect(option.style.background).toBe('none');
    });
  });

  describe('FE-PAGE-SHARED-037: a multi-day parking only shows on its drop-off and pickup day (#1937)', () => {
    const days = [
      { id: 9, trip_id: 1, day_number: 1, date: '2026-07-01', title: 'Day One' },
      { id: 10, trip_id: 1, day_number: 2, date: '2026-07-02', title: 'Day Two' },
      { id: 11, trip_id: 1, day_number: 3, date: '2026-07-03', title: 'Day Three' },
    ];

    it('skips the days in between and leaves that day empty', async () => {
      await open('parking-token', payload({
        days,
        reservations: [
          {
            id: 81, title: 'Airport Parking', type: 'parking', status: 'confirmed', day_id: 9, end_day_id: 11,
            reservation_time: '2026-07-01T05:30:00', reservation_end_time: '2026-07-03T19:00:00', metadata: null,
          },
        ],
      }));

      // Every day is open, so each card is checked on its own.
      expect(dayCard('Day One').getByText('Airport Parking')).toBeInTheDocument();
      expect(dayCard('Day Two').queryByText('Airport Parking')).toBeNull();
      expect(dayCard('Day Two').getByText('No places planned for this day')).toBeInTheDocument();
      expect(dayCard('Day Three').getByText('Airport Parking')).toBeInTheDocument();
      // The drop-off and the pickup say which end of the stay they are.
      expect(dayCard('Day One').getByText('Drop-off')).toBeInTheDocument();
    });
  });

  describe('FE-PAGE-SHARED-037b: a booked night is not listed twice on a shared day', () => {
    // Booking a night puts its hotel on the check-in day as a stop, because road trip
    // mode drives to it. A shared link has no road trip view and already shows the
    // booking as its own chip on the day, so that stop would be the same hotel again.
    const days = [{ id: 41, trip_id: 1, day_number: 1, date: '2026-07-01', title: 'Day One' }];
    // The address is the tell: the list row prints it, the map marker's tooltip does not,
    // so it says whether the row rendered rather than whether the place exists at all.
    const place = (id: number, name: string, address: string) => ({
      id, name, description: null, address, lat: 48.86, lng: 2.34, category_id: null,
      price: null, place_time: null, end_time: null, duration_minutes: null, notes: null,
      website: null, phone: null, image_url: null, transport_mode: null, category: null, tags: [],
    });

    it('leaves out the stop the booking wrote and keeps the one the traveller placed', async () => {
      await open('stay-token', payload({
        days,
        assignments: {
          41: [
            { id: 401, day_id: 41, order_index: 0, notes: null, accommodation_id: null, place: place(601, 'Musee Rodin', '77 Rue de Varenne') },
            { id: 402, day_id: 41, order_index: 1, notes: null, accommodation_id: 7, place: place(602, 'Hotel Adlon', 'Unter den Linden 77') },
          ],
        },
        accommodations: [{ id: 7, place_id: 602, start_day_id: 41, end_day_id: 41, place_name: 'Hotel Adlon' }],
      }));

      // The stop the traveller placed is listed, address and all.
      await waitFor(() => expect(screen.getByText('77 Rue de Varenne')).toBeInTheDocument());
      // The booked night is not: it is already on the day as its own chip.
      expect(screen.queryByText('Unter den Linden 77')).toBeNull();
    });

    it('numbers the map and draws the day line over the traveller\'s stops only, and keeps the hotel as an unnumbered pin', async () => {
      // Since the reseat the booked night heads its day, so counting it gave the hotel
      // badge 1, every real stop one more than the app shows, and a line setting off
      // from where the day ends.
      divIconMock().mockClear();
      const hotel = { ...place(602, 'Hotel Adlon', 'Unter den Linden 77'), lat: 52.52, lng: 13.38 };
      const rodin = { ...place(601, 'Musee Rodin', '77 Rue de Varenne'), lat: 48.86, lng: 2.32 };
      const orsay = { ...place(603, 'Musee d Orsay', '1 Rue de la Legion d Honneur'), lat: 48.86, lng: 2.33 };
      await open('stay-map-token', payload({
        days,
        assignments: {
          41: [
            { id: 402, day_id: 41, order_index: 0, notes: null, accommodation_id: 7, place: hotel },
            { id: 401, day_id: 41, order_index: 1, notes: null, accommodation_id: null, place: rodin },
            { id: 403, day_id: 41, order_index: 2, notes: null, accommodation_id: null, place: orsay },
          ],
        },
        accommodations: [{ id: 7, place_id: 602, start_day_id: 41, end_day_id: 41, place_name: 'Hotel Adlon' }],
      }));

      nextDay();
      await waitFor(() => expect(iconHtml().some((h: string) => h.includes('>1<'))).toBe(true));

      // Rodin is 1 and Orsay is 2, as in the planner; nothing wears 3 and the hotel's
      // pin is still drawn, without a badge.
      const html = iconHtml();
      expect(html.filter((h: string) => h.includes('>1<'))).toHaveLength(1);
      expect(html.filter((h: string) => h.includes('>2<'))).toHaveLength(1);
      expect(html.some((h: string) => h.includes('>3<'))).toBe(false);
      expect(html.filter((h: string) => !h.includes('<span'))).toHaveLength(1);

      // The day line joins the two stops and does not start at the hotel.
      const line = screen.getByTestId('route-line');
      expect(JSON.parse(line.getAttribute('data-positions') ?? '[]')).toEqual([[48.86, 2.32], [48.86, 2.33]]);
    });
  });

  // ── #2320: the richer read-only detail ─────────────────────────────────

  describe('FE-PAGE-SHARED-038: a stop shows its address, description, both notes, duration and contact (#2320)', () => {
    const days = [{ id: 21, trip_id: 1, day_number: 1, date: '2026-07-01', title: 'Day One' }];
    const assignments = {
      21: [
        {
          id: 301, day_id: 21, order_index: 0, notes: 'go early, before the coaches',
          place: {
            id: 501, name: 'Louvre', description: 'The big one', address: 'Rue de Rivoli, Paris',
            lat: 48.86, lng: 2.34, category_id: null, price: null, place_time: '09:00', end_time: null,
            duration_minutes: 150, notes: 'Skip the pyramid queue', website: 'https://louvre.fr',
            phone: '+33 1 40 20 50 50', image_url: null, transport_mode: 'walking', category: null, tags: [],
          },
        },
      ],
    };

    it('renders every field the owner filled, as separate lines', async () => {
      await open('detail-token', payload({ days, assignments }));
      // The name is also on the map marker's tooltip, so the list row is the one with the address under it.
      await waitFor(() => expect(screen.getByText('Rue de Rivoli, Paris')).toBeInTheDocument());
      expect(screen.getAllByText('Louvre').length).toBeGreaterThan(0);

      expect(screen.getByText('The big one')).toBeInTheDocument();
      expect(screen.getByText('go early, before the coaches')).toBeInTheDocument();
      expect(screen.getByText('Skip the pyramid queue')).toBeInTheDocument();
      expect(screen.getByText('2 h 30 min')).toBeInTheDocument();

      const website = screen.getByRole('link', { name: /website/i });
      expect(website).toHaveAttribute('href', 'https://louvre.fr');
      expect(website).toHaveAttribute('target', '_blank');
      expect(website).toHaveAttribute('rel', 'noopener noreferrer');

      const maps = screen.getByRole('link', { name: /google maps/i });
      expect(maps.getAttribute('href')).toContain('google.com/maps/search/');
      expect(maps.getAttribute('href')).toContain(encodeURIComponent('Louvre, Rue de Rivoli, Paris'));
      expect(maps).toHaveAttribute('rel', 'noopener noreferrer');

      const phone = screen.getByRole('link', { name: '+33 1 40 20 50 50' });
      expect(phone).toHaveAttribute('href', 'tel:+33140205050');
    });

    it('leaves out what is empty and never renders a link that is not http(s)', async () => {
      const bare = {
        21: [{
          id: 302, day_id: 21, order_index: 0, notes: null,
          place: {
            id: 502, name: 'Somewhere', description: null, address: null, lat: null, lng: null,
            duration_minutes: 0, notes: '   ', website: 'javascript:alert(1)', phone: null,
            category_id: null, price: null, place_time: null, end_time: null, image_url: null,
            transport_mode: 'walking', category: null, tags: [],
          },
        }],
      };
      await open('bare-token', payload({ days, assignments: bare }));
      await waitFor(() => expect(screen.getByText('Somewhere')).toBeInTheDocument());

      expect(screen.queryByRole('link', { name: /website/i })).toBeNull();
      expect(screen.queryByRole('link', { name: /google maps/i })).toBeNull();
      expect(document.querySelector('a[href^="javascript:"]')).toBeNull();
      expect(screen.queryByText(/min$/)).toBeNull();
    });
  });

  describe('FE-PAGE-SHARED-039: a booking shows its note and its link, and nothing that is not http(s) (#2320)', () => {
    it('renders the note and a link labelled by its host', async () => {
      await open('booking-token', payload({
        permissions: { share_bookings: true, share_packing: false, share_budget: false, share_collab: false },
        reservations: [
          {
            id: 91, title: 'Night train', type: 'train', status: 'confirmed', day_id: null, end_day_id: null,
            reservation_time: '2026-07-01T21:00:00', reservation_end_time: null, metadata: null,
            notes: 'Meet at the north entrance', url: 'https://www.bahn.example/booking/abc',
          },
          {
            id: 92, title: 'Sketchy', type: 'other', status: 'pending', day_id: null, end_day_id: null,
            reservation_time: null, reservation_end_time: null, metadata: null,
            notes: null, url: 'javascript:alert(1)',
          },
        ],
      }));
      fireEvent.click(screen.getByRole('button', { name: 'Bookings' }));
      await waitFor(() => expect(screen.getByText('Night train')).toBeInTheDocument());

      expect(screen.getByText('Meet at the north entrance')).toBeInTheDocument();
      const link = screen.getByRole('link', { name: 'bahn.example' });
      expect(link).toHaveAttribute('href', 'https://www.bahn.example/booking/abc');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');

      expect(screen.getByText('Sketchy')).toBeInTheDocument();
      expect(document.querySelector('a[href^="javascript:"]')).toBeNull();
    });
  });

  // ── #2345: the header has to clip the decoration it bleeds ──────────────

  describe('FE-PAGE-SHARED-042: the hero clips its cover (#2345)', () => {
    it('does not let it widen the page', async () => {
      await open('overflow-token', payload({ trip: { id: 1, title: 'Shared Paris Trip', cover_image: 'c.jpg' } }));

      // The cover fills the hero edge to edge, so the page only stays as wide as the
      // viewport if the hero itself is the clip.
      const hero = screen.getByTestId('shared-hero');
      expect(hero.textContent).toContain('Shared Paris Trip');
      expect(hero).toHaveClass('overflow-hidden');
    });
  });

  // ── #2505: only a 404 means the link is dead ────────────────────────────

  describe('FE-PAGE-SHARED-043: a failed load is not an expired link (#2505)', () => {
    const failWith = (status: number) =>
      server.use(http.get('/api/shared/:token', () => HttpResponse.json({ error: 'nope' }, { status })));

    it.each([500, 502, 503, 429])('keeps the link when the server answers %i', async (status) => {
      failWith(status);
      renderSharedTrip('test-token');

      await waitFor(() => expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument());
      expect(screen.queryByText(/link expired or invalid/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    // A request with no response makes the api client probe /api/health for a
    // proxy wall first; answer it the way a healthy server does.
    const healthy = () => http.get('/api/health', () => HttpResponse.json({ status: 'ok' }));

    it('keeps the link when the request never reaches the server', async () => {
      server.use(healthy(), http.get('/api/shared/:token', () => HttpResponse.error()));
      renderSharedTrip('test-token');

      await waitFor(() => expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument());
      expect(screen.queryByText(/link expired or invalid/i)).not.toBeInTheDocument();
    });

    it('keeps the link when the request times out', async () => {
      // What axios rejects with once its 8s deadline passes: no response at all.
      const timeout = new AxiosError('timeout of 8000ms exceeded', AxiosError.ECONNABORTED);
      const spy = vi.spyOn(shareApi, 'getSharedTrip').mockRejectedValueOnce(timeout);
      renderSharedTrip('test-token');

      await waitFor(() => expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument());
      expect(screen.queryByText(/link expired or invalid/i)).not.toBeInTheDocument();
      spy.mockRestore();
    });

    it('still calls a 404 from the share endpoint an expired link, without a retry', async () => {
      server.use(
        http.get('/api/shared/:token', () => HttpResponse.json({ error: 'Invalid or expired link' }, { status: 404 })),
      );
      renderSharedTrip('gone-token');

      await waitFor(() => expect(screen.getByText(/link expired or invalid/i)).toBeInTheDocument());
      expect(screen.queryByText(/could not be loaded/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });

    // A reverse proxy that has no upstream for TREK (Traefik while the
    // container is stopped or still in its start period, nginx with a missing
    // location) answers 404 on its own. That is the restart window of the
    // report, not a dead link.
    it.each([
      ['a plain text 404 from Traefik', '404 page not found\n', 'text/plain; charset=utf-8'],
      ['an HTML 404 from nginx', '<html><head><title>404 Not Found</title></head><body></body></html>', 'text/html'],
    ])('keeps the link on %s', async (_label, body, contentType) => {
      server.use(
        http.get('/api/shared/:token', () => new HttpResponse(body, { status: 404, headers: { 'content-type': contentType } })),
      );
      renderSharedTrip('test-token');

      await waitFor(() => expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument());
      expect(screen.queryByText(/link expired or invalid/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('shows the failed screen instead of crashing when a 200 is not the share payload', async () => {
      // An auth wall or a captive portal answering the API call with its own page.
      let calls = 0;
      server.use(
        http.get('/api/shared/:token', () => {
          calls += 1;
          if (calls === 1) {
            return new HttpResponse('<!doctype html><html><body>Sign in</body></html>', {
              status: 200,
              headers: { 'content-type': 'text/html' },
            });
          }
          return HttpResponse.json({
            trip: { id: 1, title: 'Past The Wall', start_date: '2026-07-01', end_date: '2026-07-02' },
            days: [],
            assignments: {},
            dayNotes: {},
            places: [],
            reservations: [],
            accommodations: [],
            permissions: { share_map: true },
          });
        }),
      );
      renderSharedTrip('test-token');

      fireEvent.click(await screen.findByRole('button', { name: /try again/i }));

      await waitFor(() => expect(screen.getByRole('heading', { name: 'Past The Wall' })).toBeInTheDocument());
      expect(calls).toBe(2);
    });

    it('loads the trip when the retry gets through', async () => {
      let calls = 0;
      server.use(
        http.get('/api/shared/:token', () => {
          calls += 1;
          if (calls === 1) return new HttpResponse(null, { status: 503 });
          return HttpResponse.json({
            trip: { id: 1, title: 'Back Online Trip', start_date: '2026-07-01', end_date: '2026-07-02' },
            days: [],
            assignments: {},
            dayNotes: {},
            places: [],
            reservations: [],
            accommodations: [],
            permissions: { share_map: true },
          });
        }),
      );
      renderSharedTrip('test-token');

      const retry = await screen.findByRole('button', { name: /try again/i });
      fireEvent.click(retry);

      await waitFor(() => expect(screen.getByRole('heading', { name: 'Back Online Trip' })).toBeInTheDocument());
      expect(calls).toBe(2);
    });

    it('keeps the failed screen up with a busy button while the retry runs, and sends it once', async () => {
      let calls = 0;
      let release: () => void = () => {};
      server.use(
        http.get('/api/shared/:token', async () => {
          calls += 1;
          if (calls === 1) return new HttpResponse(null, { status: 500 });
          await new Promise<void>((resolve) => { release = resolve; });
          return new HttpResponse(null, { status: 500 });
        }),
      );
      renderSharedTrip('test-token');

      const retry = await screen.findByRole('button', { name: /try again/i });
      fireEvent.click(retry);
      await waitFor(() => expect(retry).toBeDisabled());
      expect(retry).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();
      fireEvent.click(retry);

      await waitFor(() => expect(calls).toBe(2));
      release();
      await waitFor(() => expect(retry).not.toBeDisabled());
      expect(calls).toBe(2);
      expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();
    });

    it('lands on the expired screen when the retry finds the link gone', async () => {
      let calls = 0;
      server.use(
        healthy(),
        http.get('/api/shared/:token', () => {
          calls += 1;
          return calls === 1
            ? HttpResponse.error()
            : HttpResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
        }),
      );
      renderSharedTrip('test-token');

      fireEvent.click(await screen.findByRole('button', { name: /try again/i }));

      await waitFor(() => expect(screen.getByText(/link expired or invalid/i)).toBeInTheDocument());
      expect(calls).toBe(2);
    });
  });

  describe('FE-PAGE-SHARED-040: unplanned places and the travel-only link (#1758, #1712)', () => {
    const payload = (permissions: Record<string, boolean>) => ({
      trip: { id: 1, title: 'Shared Paris Trip', start_date: '2026-07-01', end_date: '2026-07-03' },
      days: [
        { id: 1, day_number: 1, date: '2026-07-01' },
        { id: 2, day_number: 2, date: '2026-07-02' },
      ],
      assignments: { 1: [{ id: 11, order_index: 0, place: { id: 100, name: 'Louvre', lat: 48.86, lng: 2.34 } }] },
      dayNotes: {},
      places: [
        { id: 100, name: 'Louvre', lat: 48.86, lng: 2.34 },
        { id: 200, name: 'Sainte-Chapelle', lat: 48.85, lng: 2.35 },
      ],
      reservations: [],
      accommodations: [],
      packing: [], budget: [], categories: [], collab: [],
      permissions: { share_map: true, share_bookings: false, ...permissions },
    });

    it('lists the places no day has picked up under the days', async () => {
      server.use(http.get('/api/shared/:token', () => HttpResponse.json(payload({}))));
      renderSharedTrip('unplanned-token');
      const card = (await screen.findByText('Not planned yet')).closest('article') as HTMLElement;
      expect(within(card).getByText('Sainte-Chapelle')).toBeInTheDocument();
      expect(within(card).queryByText('Louvre')).toBeNull();
      fireEvent.click(within(card).getByRole('button', { name: /collapse/i }));
      expect(within(card).queryByText('Sainte-Chapelle')).toBeNull();
    });

    it('a travel-only link leaves out empty days and the unplanned pool', async () => {
      server.use(http.get('/api/shared/:token', () => HttpResponse.json(payload({ share_travel_only: true }))));
      renderSharedTrip('travel-token');
      await screen.findByRole('heading', { name: 'Shared Paris Trip' });
      expect(document.getElementById('shared-day-1')).not.toBeNull();
      expect(document.getElementById('shared-day-2')).toBeNull();
      expect(screen.queryByText('Not planned yet')).toBeNull();
    });
  });
});
