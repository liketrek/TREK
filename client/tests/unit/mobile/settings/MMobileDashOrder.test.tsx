// FE-MOB-SETDORD-001 onwards
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '../../../helpers/render';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { useAddonStore } from '../../../../src/store/addonStore';
import { DEFAULT_APPEARANCE, type AppearanceConfig, type MobileDashToken } from '@trek/shared';
import MMobileDashOrder from '../../../../src/mobile/screens/settings/MMobileDashOrder';

function buildCfg(over: Partial<AppearanceConfig['dashboard']> = {}): AppearanceConfig {
  return {
    ...DEFAULT_APPEARANCE,
    dashboard: { ...DEFAULT_APPEARANCE.dashboard, ...over },
  };
}

function enableCollections() {
  seedStore(useAddonStore, {
    addons: [{ id: 'collections', name: 'Collections', type: 'global', icon: '', enabled: true }],
    loaded: true,
  });
}

/** The label + badge wrapper of one block row. */
function blockRow(label: string): HTMLElement {
  return screen.getByText(label).parentElement!;
}

/** The visible block labels in DOM order. */
function rowLabels(): string[] {
  return screen.getAllByLabelText('Move up').map((btn) => {
    const row = btn.closest('div')!;
    return row.querySelector('span > span')!.textContent ?? '';
  });
}

describe('MMobileDashOrder', () => {
  beforeEach(() => {
    resetAllStores();
    enableCollections();
  });

  it('FE-MOB-SETDORD-001: renders the built-in order when nothing is stored', () => {
    render(<MMobileDashOrder cfg={buildCfg()} onChange={vi.fn()} />);

    expect(rowLabels()).toEqual(['Trips', 'Currency', 'Collections', 'Timezones', 'Upcoming reservations']);
  });

  it('FE-MOB-SETDORD-002: a stored order wins and missing tokens are appended', () => {
    render(<MMobileDashOrder cfg={buildCfg({ mobileOrder: ['timezones', 'trips'] })} onChange={vi.fn()} />);

    expect(rowLabels()).toEqual(['Timezones', 'Trips', 'Currency', 'Collections', 'Upcoming reservations']);
  });

  it('FE-MOB-SETDORD-003: moving a block down emits the reordered token list', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(order: MobileDashToken[]) => void>();
    render(<MMobileDashOrder cfg={buildCfg()} onChange={onChange} />);

    await user.click(screen.getAllByLabelText('Move down')[0]);
    expect(onChange).toHaveBeenCalledWith(['currency', 'trips', 'collections', 'timezones', 'upcomingReservations']);
  });

  it('FE-MOB-SETDORD-004: moving a block up swaps it with its predecessor', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(order: MobileDashToken[]) => void>();
    render(<MMobileDashOrder cfg={buildCfg()} onChange={onChange} />);

    await user.click(screen.getAllByLabelText('Move up')[2]);
    expect(onChange).toHaveBeenCalledWith(['trips', 'collections', 'currency', 'timezones', 'upcomingReservations']);
  });

  it('FE-MOB-SETDORD-005: the first row cannot move up and the last cannot move down', () => {
    render(<MMobileDashOrder cfg={buildCfg()} onChange={vi.fn()} />);

    const ups = screen.getAllByLabelText('Move up');
    const downs = screen.getAllByLabelText('Move down');
    expect(ups[0]).toBeDisabled();
    expect(ups[1]).not.toBeDisabled();
    expect(downs[downs.length - 1]).toBeDisabled();
    expect(downs[0]).not.toBeDisabled();
  });

  it('FE-MOB-SETDORD-006: a widget switched off is marked hidden, trips never is', () => {
    const cfg = buildCfg({
      mobile: { ...DEFAULT_APPEARANCE.dashboard.mobile, currency: false, timezones: false },
    });
    render(<MMobileDashOrder cfg={cfg} onChange={vi.fn()} />);

    expect(screen.getAllByText('Hidden')).toHaveLength(2);
    const tripsRow = blockRow('Trips');
    expect(tripsRow.textContent).not.toContain('Hidden');
  });

  it('FE-MOB-SETDORD-007: collections counts as hidden while the addon is off', () => {
    seedStore(useAddonStore, { addons: [], loaded: true });
    render(<MMobileDashOrder cfg={buildCfg()} onChange={vi.fn()} />);

    const collectionsRow = blockRow('Collections');
    expect(collectionsRow.textContent).toContain('Hidden');
    expect(screen.getAllByText('Hidden')).toHaveLength(1);
  });

  it('FE-MOB-SETDORD-008: upcoming reservations follows its own mobile flag', () => {
    const cfg = buildCfg({
      mobile: { ...DEFAULT_APPEARANCE.dashboard.mobile, upcomingReservations: false },
    });
    render(<MMobileDashOrder cfg={cfg} onChange={vi.fn()} />);

    const row = blockRow('Upcoming reservations');
    expect(row.textContent).toContain('Hidden');
  });
});
