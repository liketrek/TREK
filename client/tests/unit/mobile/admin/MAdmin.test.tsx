import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '../../../helpers/render';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildAdmin } from '../../../helpers/factories';
import { useAuthStore } from '../../../../src/store/authStore';
import MAdmin from '../../../../src/mobile/screens/admin/MAdmin';

// FE-MOB-ADMIN-001 onwards

// The permissions matrix is its own heavy panel — out of scope here.
vi.mock('../../../../src/components/Admin/PermissionsPanel', () => ({
  default: () => <div data-testid="permissions-panel" />,
}));

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { isAuthenticated: true, user: buildAdmin() });
});

describe('MAdmin', () => {
  it('FE-MOB-ADMIN-001: renders stats grid and the user list with role badges', async () => {
    render(<MAdmin />);

    // Users load from GET /api/admin/users (MSW: admin + alice)
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();

    // Stats from GET /api/admin/stats: 42 places, 8 files
    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument());
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('FE-MOB-ADMIN-002: the section dropdown switches to the settings section', async () => {
    render(<MAdmin />);
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());

    // Open the switcher pill (labelled with the admin title)
    fireEvent.click(screen.getByRole('button', { name: 'Administration' }));

    // All standard sections are listed
    expect(screen.getByRole('button', { name: 'User Defaults' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Backup' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Audit' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    // Settings section renders the auth methods card, user list is gone
    await waitFor(() => expect(screen.getByText('Authentication Methods')).toBeInTheDocument());
    expect(screen.queryByText('alice')).not.toBeInTheDocument();
  });
});
