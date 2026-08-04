// FE-MOB-APERM-001 to FE-MOB-APERM-011
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '../../../helpers/render';
import { server } from '../../../helpers/msw/server';
import { resetAllStores } from '../../../helpers/store';
import { usePermissionsStore } from '../../../../src/store/permissionsStore';
import { ToastContainer } from '../../../../src/components/shared/Toast';
import MAdminPermissionsPanel from '../../../../src/mobile/screens/admin/MAdminPermissionsPanel';

const ALLOWED = ['admin', 'trip_owner', 'trip_member', 'everybody'];

function buildPermission(key: string, level = 'trip_member', defaultLevel = 'trip_member') {
  return { key, level, defaultLevel, allowedLevels: [...ALLOWED] };
}

const ALL_KEYS = [
  'trip_create', 'trip_edit', 'trip_delete', 'trip_archive', 'trip_cover_upload',
  'member_manage',
  'file_upload', 'file_edit', 'file_delete',
  'place_edit', 'day_edit', 'reservation_edit',
  'budget_edit', 'packing_edit', 'collab_edit', 'share_manage',
];

const SAMPLE_PERMISSIONS = ALL_KEYS.map((k) => buildPermission(k));

function renderPanel() {
  return render(
    <>
      <ToastContainer />
      <MAdminPermissionsPanel />
    </>,
  );
}

beforeEach(() => {
  resetAllStores();
  server.use(
    http.get('/api/admin/permissions', () => HttpResponse.json({ permissions: SAMPLE_PERMISSIONS })),
  );
});

afterEach(() => {
  server.resetHandlers();
});

describe('MAdminPermissionsPanel', () => {
  it('FE-MOB-APERM-001: renders only the spinner while loading', () => {
    server.use(
      http.get('/api/admin/permissions', async () => {
        await new Promise(() => {});
        return HttpResponse.json({ permissions: [] });
      }),
    );
    renderPanel();

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Permission Settings')).not.toBeInTheDocument();
  });

  it('FE-MOB-APERM-002: renders every category and its actions after load', async () => {
    renderPanel();

    await screen.findByText('Permission Settings');
    expect(screen.getByText('Control who can perform actions across the application')).toBeInTheDocument();
    expect(screen.getByText('Trip Management')).toBeInTheDocument();
    expect(screen.getByText('Member Management')).toBeInTheDocument();
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('Content & Schedule')).toBeInTheDocument();
    expect(screen.getByText('Budget, Packing & Collaboration')).toBeInTheDocument();
    expect(screen.getByText('Create trips')).toBeInTheDocument();
    expect(screen.getByText('Who can create new trips')).toBeInTheDocument();
    expect(screen.getAllByRole('combobox')).toHaveLength(ALL_KEYS.length);
  });

  it('FE-MOB-APERM-003: a select reflects the stored level and offers every allowed level', async () => {
    renderPanel();

    await screen.findByText('Permission Settings');
    const select = screen.getByRole('combobox', { name: 'Create trips' }) as HTMLSelectElement;
    expect(select.value).toBe('trip_member');
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual([
      'Admin only', 'Trip owner', 'Trip members', 'Everyone',
    ]);
  });

  it('FE-MOB-APERM-004: keys missing from the payload are skipped', async () => {
    server.use(
      http.get('/api/admin/permissions', () =>
        HttpResponse.json({ permissions: [buildPermission('trip_create')] }),
      ),
    );
    renderPanel();

    await screen.findByText('Permission Settings');
    expect(screen.getByText('Create trips')).toBeInTheDocument();
    expect(screen.queryByText('Delete trips')).not.toBeInTheDocument();
    expect(screen.getAllByRole('combobox')).toHaveLength(1);
  });

  it('FE-MOB-APERM-005: the customized badge shows only where level differs from the default', async () => {
    server.use(
      http.get('/api/admin/permissions', () =>
        HttpResponse.json({
          permissions: [
            buildPermission('trip_create', 'admin', 'trip_member'),
            buildPermission('trip_edit', 'trip_member', 'trip_member'),
          ],
        }),
      ),
    );
    renderPanel();

    await screen.findByText('Permission Settings');
    expect(screen.getAllByText('customized')).toHaveLength(1);
  });

  it('FE-MOB-APERM-006: Save stays disabled until a select changes', async () => {
    const user = userEvent.setup();
    renderPanel();

    await screen.findByText('Permission Settings');
    const save = screen.getByRole('button', { name: /Save/ });
    expect(save).toBeDisabled();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Create trips' }), 'admin');

    expect(save).not.toBeDisabled();
    expect(screen.getAllByText('customized')).toHaveLength(1);
  });

  it('FE-MOB-APERM-007: Reset puts every value back to its default and marks the form dirty', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/permissions', () =>
        HttpResponse.json({
          permissions: [
            buildPermission('trip_create', 'admin', 'trip_member'),
            buildPermission('trip_edit', 'everybody', 'trip_owner'),
          ],
        }),
      ),
    );
    renderPanel();

    await screen.findByText('Permission Settings');
    expect(screen.getAllByText('customized')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }));

    await waitFor(() => expect(screen.queryByText('customized')).not.toBeInTheDocument());
    expect((screen.getByRole('combobox', { name: 'Create trips' }) as HTMLSelectElement).value).toBe('trip_member');
    expect((screen.getByRole('combobox', { name: 'Edit trip details' }) as HTMLSelectElement).value).toBe('trip_owner');
    expect(screen.getByRole('button', { name: /Save/ })).not.toBeDisabled();
  });

  it('FE-MOB-APERM-008: saving PUTs the current values and pushes them into the store', async () => {
    const user = userEvent.setup();
    let sent: Record<string, unknown> = {};
    server.use(
      http.put('/api/admin/permissions', async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ permissions: { trip_create: 'admin' } });
      }),
    );
    renderPanel();

    await screen.findByText('Permission Settings');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Create trips' }), 'admin');
    await user.click(screen.getByRole('button', { name: /Save/ }));

    await screen.findByText('Permission settings saved');
    expect((sent.permissions as Record<string, string>).trip_create).toBe('admin');
    expect(usePermissionsStore.getState().permissions.trip_create).toBe('admin');
    await waitFor(() => expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled());
  });

  it('FE-MOB-APERM-009: a response without permissions leaves the store untouched', async () => {
    const user = userEvent.setup();
    const before = usePermissionsStore.getState().permissions;
    server.use(http.put('/api/admin/permissions', () => HttpResponse.json({ ok: true })));
    renderPanel();

    await screen.findByText('Permission Settings');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Create trips' }), 'admin');
    await user.click(screen.getByRole('button', { name: /Save/ }));

    await screen.findByText('Permission settings saved');
    expect(usePermissionsStore.getState().permissions).toBe(before);
  });

  it('FE-MOB-APERM-010: a failing save toasts and keeps the form dirty', async () => {
    const user = userEvent.setup();
    server.use(
      http.put('/api/admin/permissions', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );
    renderPanel();

    await screen.findByText('Permission Settings');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Create trips' }), 'admin');
    const save = screen.getByRole('button', { name: /Save/ });
    await user.click(save);

    await screen.findByText('Error');
    expect(save).not.toBeDisabled();
  });

  it('FE-MOB-APERM-011: a failing load toasts and renders no categories', async () => {
    server.use(
      http.get('/api/admin/permissions', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );
    renderPanel();

    await screen.findByText('Error');
    expect(screen.getByText('Permission Settings')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
