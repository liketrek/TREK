// FE-MOB-APAD-001 to FE-MOB-APAD-010: the paddle regions card of the phone admin, drawn from a
// controlled usePaddleRegionsAdmin (the hook has its own test).
import type { PaddleRegion, PaddleRegionPending } from '@trek/shared';
import { describe, expect, it, vi } from 'vitest';
import type { usePaddleRegionsAdmin } from '../../../../src/components/Admin/paddle/usePaddleRegionsAdmin';
import MAdminPaddleRegionsPanel from '../../../../src/mobile/screens/admin/MAdminPaddleRegionsPanel';
import { fireEvent, render, screen, within } from '../../../helpers/render';

type Admin = ReturnType<typeof usePaddleRegionsAdmin>;

const hook = vi.hoisted(() => ({ usePaddleRegionsAdmin: vi.fn<() => Admin>() }));
vi.mock('../../../../src/components/Admin/paddle/usePaddleRegionsAdmin', () => ({
  usePaddleRegionsAdmin: hook.usePaddleRegionsAdmin,
}));

function region(overrides: Partial<PaddleRegion> = {}): PaddleRegion {
  return {
    id: 'oberpfalz',
    name: 'Oberpfalz',
    status: 'ready',
    origin: 'admin',
    source_timestamp: '2026-10-03T12:00:00Z',
    imported_at: '2026-10-04T08:00:00Z',
    feature_count: 1234,
    error: null,
    progress: null,
    network: null,
    ...overrides,
  };
}

const REQUEST: PaddleRegionPending = {
  id: 'germany/bayern',
  name: 'Bayern',
  reason: 'too_large',
  bytes: 700 * 1024 * 1024,
  requested_by: 'alice',
  requested_at: '2026-10-05T12:00:00Z',
  declined: false,
} as PaddleRegionPending;

function show(overrides: Partial<Admin> = {}, search: Partial<Admin['search']> = {}) {
  const state: Admin = {
    toursOn: true,
    offline: false,
    regions: [],
    requests: [],
    autoLoad: { settings: null, saving: false, save: vi.fn(async () => {}) },
    loading: false,
    error: null,
    retry: vi.fn(),
    added: new Set<string>(),
    busyId: null,
    add: vi.fn(async () => {}),
    refresh: vi.fn(async () => {}),
    approve: vi.fn(async () => {}),
    decline: vi.fn(async () => {}),
    removing: null,
    askRemove: vi.fn(),
    cancelRemove: vi.fn(),
    confirmRemove: vi.fn(),
    ...overrides,
    search: { query: '', setQuery: vi.fn(), hits: null, searching: false, error: null, ...search },
  };
  hook.usePaddleRegionsAdmin.mockReturnValue(state);
  render(<MAdminPaddleRegionsPanel />);
  return state;
}

describe('MAdminPaddleRegionsPanel', () => {
  it('FE-MOB-APAD-001: shows nothing while the Tours addon is off', () => {
    show({ toursOn: false });
    expect(screen.queryByText('Paddle water data')).not.toBeInTheDocument();
  });

  it('FE-MOB-APAD-002: a region shows its status, its objects and its actions', () => {
    const state = show({ regions: [region({ network: { water_km: 812 } as PaddleRegion['network'] })] });
    const row = screen.getByTestId('paddle-region-row');
    expect(within(row).getByText('Oberpfalz')).toBeInTheDocument();
    expect(within(row).getByText('Ready')).toBeInTheDocument();
    expect(within(row).getByText('1234 objects')).toBeInTheDocument();
    expect(within(row).getByText('812 km of water')).toBeInTheDocument();

    fireEvent.click(within(row).getByRole('button', { name: 'Read again Oberpfalz' }));
    expect(state.refresh).toHaveBeenCalledWith('oberpfalz');
    fireEvent.click(within(row).getByRole('button', { name: 'Remove region Oberpfalz' }));
    expect(state.askRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 'oberpfalz' }));
  });

  it('FE-MOB-APAD-003: a failed read says why and that the old data stays', () => {
    show({ regions: [region({ status: 'failed', error: 'Download broke off.' })] });
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText(/Download broke off\. The data read before stays in use\./)).toBeInTheDocument();
  });

  it('FE-MOB-APAD-004: the mode and the size are switched in place', () => {
    const save = vi.fn(async () => {});
    show({ autoLoad: { settings: { mode: 'auto', max_mb: 500 }, saving: false, save } as Admin['autoLoad'] });
    const modes = screen.getByRole('radiogroup', { name: 'Load regions automatically' });
    expect(within(modes).getByRole('radio', { name: /Automatic/ })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(within(modes).getByRole('radio', { name: /On request/ }));
    expect(save).toHaveBeenCalledWith({ mode: 'ask' });

    const sizes = screen.getByRole('group', { name: 'Largest region loaded automatically' });
    fireEvent.click(within(sizes).getByRole('button', { name: /1 GB/ }));
    expect(save).toHaveBeenCalledWith({ max_mb: 1000 });
  });

  it('FE-MOB-APAD-005: no size choice outside the automatic mode', () => {
    show({
      autoLoad: {
        settings: { mode: 'off', max_mb: 500 },
        saving: false,
        save: vi.fn(),
      } as unknown as Admin['autoLoad'],
    });
    expect(screen.queryByRole('group', { name: 'Largest region loaded automatically' })).not.toBeInTheDocument();
  });

  it('FE-MOB-APAD-006: a requested region is loaded or declined', () => {
    const state = show({ requests: [REQUEST] });
    const row = screen.getByTestId('paddle-region-request');
    expect(within(row).getByText('Bayern')).toBeInTheDocument();
    fireEvent.click(within(row).getByRole('button', { name: /Load/ }));
    expect(state.approve).toHaveBeenCalledWith('germany/bayern');
    fireEvent.click(within(row).getByRole('button', { name: 'Decline' }));
    expect(state.decline).toHaveBeenCalledWith('germany/bayern');
  });

  it('FE-MOB-APAD-007: a search hit is added, an added one says so', () => {
    const state = show(
      { added: new Set(['netherlands/limburg']) },
      {
        query: 'Limburg',
        hits: [
          { id: 'belgium/limburg', name: 'Limburg', path: ['Europe', 'Belgium'] },
          { id: 'netherlands/limburg', name: 'Limburg NL', path: ['Europe', 'Netherlands'] },
        ],
      }
    );
    const hits = screen.getAllByTestId('paddle-region-hit');
    expect(within(hits[0]).getByText('Belgium')).toBeInTheDocument();
    fireEvent.click(within(hits[0]).getByRole('button', { name: /Limburg/ }));
    expect(state.add).toHaveBeenCalledWith('belgium/limburg');
    expect(within(hits[1]).getByText('Added')).toBeInTheDocument();
  });

  it('FE-MOB-APAD-008: typing searches, and a search without hits says so', () => {
    const state = show({}, { hits: [] });
    fireEvent.change(screen.getByRole('searchbox', { name: 'Add a region' }), { target: { value: 'Atlantis' } });
    expect(state.search.setQuery).toHaveBeenCalledWith('Atlantis');
    expect(screen.getByText('No region by that name')).toBeInTheDocument();
  });

  it('FE-MOB-APAD-009: a failed read of the list says so and can be retried', () => {
    const state = show({ error: 'Server down' });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(state.retry).toHaveBeenCalled();
  });

  it('FE-MOB-APAD-010: removing asks in a phone sheet first', () => {
    const state = show({ regions: [region()], removing: region() });
    const question = screen.getByRole('dialog', { name: 'Remove region' });
    fireEvent.click(within(question).getByRole('button', { name: 'Remove' }));
    expect(state.confirmRemove).toHaveBeenCalled();
  });
});
