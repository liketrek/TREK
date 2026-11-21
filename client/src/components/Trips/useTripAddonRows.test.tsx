// FE-TRIPADDONROWS-001 to FE-TRIPADDONROWS-003: the rows of the trip settings' Addons area,
// shared by the desktop dialog and the phone sheet.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { TripAddon } from '@trek/shared';
import 'fake-indexeddb/auto';
import { CarFront, ListChecks, Puzzle } from 'lucide-react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildUser } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { clearAll } from '../../db/offlineDb';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { useAuthStore } from '../../store/authStore';
import { useTripAddonRows } from './useTripAddonRows';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));

const LIST: TripAddon[] = [
  { id: 'packing', name: 'Packing', icon: 'ListChecks', enabled: true, instanceEnabled: true, overridden: false },
  { id: 'roadtrip', name: 'Road trip', icon: 'Route', enabled: false, instanceEnabled: true, overridden: true },
  { id: 'someplugin', name: 'Some plugin', icon: 'Unknown', enabled: true, instanceEnabled: false, overridden: true },
];

function wrapper({ children }: { children: ReactNode }) {
  return <TranslationProvider>{children}</TranslationProvider>;
}

let bodies: unknown[] = [];

beforeEach(async () => {
  await clearAll();
  resetAllStores();
  bodies = [];
  seedStore(useAuthStore, { user: buildUser({ id: 1 }), isAuthenticated: true });
  server.use(
    http.get('/api/trips/4/addons', () => HttpResponse.json({ tripId: 4, addons: LIST })),
    http.put('/api/trips/4/addons/:addonId', async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json({ tripId: 4, addons: LIST });
    })
  );
});

describe('useTripAddonRows', () => {
  it('FE-TRIPADDONROWS-001: names each addon from the catalog, with its icon and whether the trip chose it', async () => {
    const { result } = renderHook(() => useTripAddonRows(4), { wrapper });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.rows).toHaveLength(3));

    const [packing, roadtrip, plugin] = result.current.rows;
    expect(packing).toMatchObject({ name: 'Lists', Icon: ListChecks, enabled: true, ownChoice: false });
    expect(packing.description).not.toBe('');
    expect(roadtrip).toMatchObject({ Icon: CarFront, enabled: false, ownChoice: true });
    // An addon the catalog does not know keeps the server's name, no description and the fallback icon.
    expect(plugin).toMatchObject({ name: 'Some plugin', description: '', Icon: Puzzle });
    expect(result.current.loading).toBe(false);
  });

  it('FE-TRIPADDONROWS-002: a switch away from the instance stores the choice, back to it drops the choice', async () => {
    const { result } = renderHook(() => useTripAddonRows(4), { wrapper });
    await waitFor(() => expect(result.current.rows).toHaveLength(3));

    act(() => result.current.rows[0].toggle());
    await waitFor(() => expect(bodies).toEqual([{ enabled: false }]));
    await waitFor(() => expect(result.current.rows[0].busy).toBe(false));

    act(() => result.current.rows[1].toggle());
    await waitFor(() => expect(bodies).toEqual([{ enabled: false }, { enabled: null }]));
  });

  it('FE-TRIPADDONROWS-003: a second switch while one is saving is ignored', async () => {
    const { result } = renderHook(() => useTripAddonRows(4), { wrapper });
    await waitFor(() => expect(result.current.rows).toHaveLength(3));

    act(() => result.current.rows[0].toggle());
    expect(result.current.rows[0].busy).toBe(true);
    act(() => result.current.rows[2].toggle());
    await waitFor(() => expect(result.current.rows[0].busy).toBe(false));
    expect(bodies).toEqual([{ enabled: false }]);
  });
});
