import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

import { useAuthStore } from '../../src/store/authStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useTripStore } from '../../src/store/tripStore';
import type { Settings } from '../../src/types';
import { buildAdmin, buildDay, buildTrip } from './factories';
import { server } from './msw/server';
import { resetAllStores, seedStore } from './store';

/** The day the day panel suites open. */
export const dayDetailDay = buildDay({ id: 1, trip_id: 1, date: '2025-06-15', title: 'Day in Paris' });

/** The panel's props for that day, with nothing planned on it. */
export const dayDetailProps = {
  day: dayDetailDay,
  days: [dayDetailDay],
  places: [],
  categories: [],
  tripId: 1,
  assignments: {},
  reservations: [],
  lat: null,
  lng: null,
  onClose: vi.fn(),
  onAccommodationChange: vi.fn(),
};

/**
 * Fresh stores for each day panel test: an admin on trip 1, the forecast and the stays
 * answering empty, and the given settings when the suite wants them before rendering.
 */
export function resetDayDetailPanel(settings?: Partial<Settings>): void {
  resetAllStores();
  vi.clearAllMocks();
  server.use(
    http.get('/api/weather/detailed', () => HttpResponse.json({ error: true })),
    http.get('/api/trips/1/accommodations', () => HttpResponse.json({ accommodations: [] }))
  );
  seedStore(useAuthStore, { user: buildAdmin(), isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }) });
  if (settings) seedStore(useSettingsStore, { settings });
}
