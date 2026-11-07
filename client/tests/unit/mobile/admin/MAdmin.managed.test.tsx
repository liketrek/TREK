import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MAdmin from '../../../../src/mobile/screens/admin/MAdmin';
import { useAuthStore } from '../../../../src/store/authStore';
import { buildAdmin } from '../../../helpers/factories';
import { server } from '../../../helpers/msw/server';
import { fireEvent, render, screen, waitFor } from '../../../helpers/render';
import { resetAllStores, seedStore } from '../../../helpers/store';

// An install that fills the admin-tab attachment point (managed/index.tsx): one tab
// with a phone layout of its own, one without.
vi.mock('../../../../src/managed', async () => {
  // vi.mock is hoisted above the imports, so the factory brings its own.
  const { createElement } = await import('react');
  const { CreditCard, LifeBuoy } = await import('lucide-react');
  return {
    managedRoutes: [],
    managedNavItems: [],
    visibleManagedNavItems: () => [],
    managedAdminTabs: [
      {
        id: 'subscription',
        label: 'Subscription',
        Icon: CreditCard,
        group: 'maintenance',
        element: createElement('div', { 'data-testid': 'desktop-subscription' }),
        mobileElement: createElement('div', { 'data-testid': 'phone-subscription' }),
      },
      {
        id: 'support',
        label: 'Help and support',
        Icon: LifeBuoy,
        group: 'maintenance',
        element: createElement('div', { 'data-testid': 'desktop-support' }),
      },
    ],
  };
});

function renderAdmin() {
  return render(
    <Routes>
      <Route path="/admin" element={<MAdmin />} />
    </Routes>,
    { initialEntries: ['/admin'] }
  );
}

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { isAuthenticated: true, user: buildAdmin() });
  server.use(
    http.get('/api/admin/collab-features', () =>
      HttpResponse.json({ chat: true, notes: true, polls: true, whatsnext: true })
    ),
    http.get('/api/admin/places-photos', () => HttpResponse.json({ enabled: false })),
    http.get('/api/admin/places-autocomplete', () => HttpResponse.json({ enabled: false })),
    http.get('/api/admin/places-details', () => HttpResponse.json({ enabled: false })),
    http.get('/api/admin/invites/trips', () => HttpResponse.json({ trips: [] }))
  );
});

afterEach(() => {
  server.resetHandlers();
});

describe('MAdmin with an install’s own tabs', () => {
  it('FE-MOB-ADMIN-MANAGED-001: lists them in the section picker and shows their phone layout', async () => {
    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: 'Administration' }));
    fireEvent.click(screen.getByRole('button', { name: 'Subscription' }));
    await waitFor(() => expect(screen.getByTestId('phone-subscription')).toBeInTheDocument());
    expect(screen.queryByTestId('desktop-subscription')).not.toBeInTheDocument();
  });

  it('FE-MOB-ADMIN-MANAGED-002: a tab without a phone layout shows its desktop element', async () => {
    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: 'Administration' }));
    fireEvent.click(screen.getByRole('button', { name: 'Help and support' }));
    await waitFor(() => expect(screen.getByTestId('desktop-support')).toBeInTheDocument());
  });
});
