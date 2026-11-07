import { FolderOpen, Map as MapIcon } from 'lucide-react';
import { useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MNavRail from '../../../src/mobile/components/MNavRail';
import MobileShell from '../../../src/mobile/MobileShell';
import MTripRail from '../../../src/mobile/screens/trip/MTripRail';
import { useAddonStore } from '../../../src/store/addonStore';
import { useAuthStore } from '../../../src/store/authStore';
import { usePluginStore } from '../../../src/store/pluginStore';
import { buildUser } from '../../helpers/factories';
import { fireEvent, render, screen, within } from '../../helpers/render';
import { setSizeClass } from '../../helpers/sizeClass';

// FE-MOB-RAIL-001 onwards

function LocationEcho() {
  const location = useLocation();
  return <span data-testid="loc">{location.pathname + location.search}</span>;
}

function seedAddons(ids: string[]) {
  useAddonStore.setState({
    addons: ids.map((id) => ({ id, name: id, type: 'global', icon: 'globe', enabled: true })),
    loaded: true,
  });
}

const rail = () => screen.getByRole('navigation', { name: 'Navigation' });

describe('MNavRail', () => {
  beforeEach(() => {
    useAddonStore.setState({ addons: [], loaded: true });
    usePluginStore.setState({ plugins: [], loaded: true });
    useAuthStore.setState({ user: buildUser({ role: 'user' }) });
  });

  it('FE-MOB-RAIL-001: holds every destination at once, the ones the dock keeps under More included', () => {
    seedAddons(['vacay', 'journey', 'atlas', 'collections']);
    render(<MNavRail />, { initialEntries: ['/dashboard'] });

    for (const name of ['My Trips', 'Vacay', 'Journey', 'Atlas', 'Collections', 'Settings']) {
      expect(within(rail()).getByRole('button', { name })).toBeInTheDocument();
    }
    expect(within(rail()).queryByRole('button', { name: 'More' })).not.toBeInTheDocument();
    expect(within(rail()).queryByRole('button', { name: 'Admin Settings' })).not.toBeInTheDocument();
  });

  it('FE-MOB-RAIL-002: marks the current section and navigates on a tap', () => {
    seedAddons(['atlas']);
    render(
      <>
        <MNavRail />
        <LocationEcho />
      </>,
      { initialEntries: ['/atlas'] }
    );

    expect(within(rail()).getByRole('button', { name: 'Atlas' })).toHaveAttribute('aria-current', 'page');
    fireEvent.click(within(rail()).getByRole('button', { name: 'My Trips' }));
    expect(screen.getByTestId('loc').textContent).toBe('/dashboard');
    fireEvent.click(within(rail()).getByRole('button', { name: 'Settings' }));
    expect(screen.getByTestId('loc').textContent).toBe('/settings');
  });

  it('FE-MOB-RAIL-003: administration sits at the foot for an admin', () => {
    useAuthStore.setState({ user: buildUser({ role: 'admin' }) });
    render(<MNavRail />, { initialEntries: ['/dashboard'] });
    expect(within(rail()).getByRole('button', { name: 'Admin Settings' })).toBeInTheDocument();
  });

  it("FE-MOB-RAIL-004: the create button keeps the dock's meaning and its exceptions", () => {
    const { unmount } = render(
      <>
        <MNavRail />
        <LocationEcho />
      </>,
      { initialEntries: ['/dashboard'] }
    );
    const create = within(rail()).getAllByRole('button')[0];
    fireEvent.click(create);
    expect(screen.getByTestId('loc').textContent).toContain('create');
    unmount();

    render(<MNavRail />, { initialEntries: ['/settings'] });
    expect(within(rail()).getAllByRole('button')[0]).toHaveAccessibleName('My Trips');
  });
});

describe('MTripRail', () => {
  const tabs = [
    { id: 'plan', label: 'Plan' },
    { id: 'transports', label: 'Transport' },
    { id: 'dateien', label: 'Files', icon: FolderOpen },
    { id: 'plugin:x', label: 'Plugin', icon: MapIcon },
  ];

  it('FE-MOB-RAIL-005: every section is in the rail with its name, More keeps the actions', () => {
    const onSelect = vi.fn();
    const onMore = vi.fn();
    render(
      <MTripRail
        tabs={tabs}
        active="transports"
        onSelect={onSelect}
        onMore={onMore}
        labelOf={(id) => tabs.find((x) => x.id === id)?.label ?? id}
      />
    );
    const nav = screen.getByRole('navigation', { name: 'Trip sections' });
    expect(
      within(nav)
        .getAllByRole('button')
        .map((b) => b.getAttribute('title'))
    ).toEqual(['Plan', 'Transport', 'Files', 'Plugin', 'More']);
    expect(within(nav).getByRole('button', { name: 'Transport' })).toHaveAttribute('aria-current', 'page');

    fireEvent.click(within(nav).getByRole('button', { name: 'Files' }));
    expect(onSelect).toHaveBeenCalledWith('dateien');
    fireEvent.click(within(nav).getByRole('button', { name: 'More' }));
    expect(onMore).toHaveBeenCalledOnce();
  });
});

describe('MobileShell on a wide window', () => {
  beforeEach(() => {
    useAddonStore.setState({ addons: [], loaded: true });
    usePluginStore.setState({ plugins: [], loaded: true });
  });

  it("FE-MOB-RAIL-006: the rail takes the dock's place and the page column starts after it", () => {
    setSizeClass('wide');
    const { container } = render(
      <MobileShell isPhone>
        <p>page body</p>
      </MobileShell>,
      { initialEntries: ['/dashboard'] }
    );

    expect(rail()).toBeInTheDocument();
    expect(container.querySelector('.m-dock-vt')?.tagName).toBe('NAV');
    expect(container.querySelector('.m-shell')).toBeInTheDocument();
    expect(screen.getByText('page body').parentElement?.className).toContain('wide:ps-[var(--m-rail-w)]');
  });

  it('FE-MOB-RAIL-007: folding back to compact brings the dock back, the page stays mounted', () => {
    setSizeClass('wide');
    render(
      <MobileShell isPhone>
        <input aria-label="note" defaultValue="" />
      </MobileShell>,
      { initialEntries: ['/dashboard'] }
    );
    const field = screen.getByLabelText('note') as HTMLInputElement;
    fireEvent.change(field, { target: { value: 'typed before the fold' } });

    setSizeClass('compact');
    expect(screen.queryByRole('navigation', { name: 'Navigation' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'My Trips' })).toBeInTheDocument();
    expect((screen.getByLabelText('note') as HTMLInputElement).value).toBe('typed before the fold');
    expect(screen.getByLabelText('note')).toBe(field);
  });

  it('FE-MOB-RAIL-008: no rail inside a trip, which brings its own', () => {
    setSizeClass('wide');
    render(
      <MobileShell isPhone>
        <p>page body</p>
      </MobileShell>,
      { initialEntries: ['/trips/7'] }
    );
    expect(screen.queryByRole('navigation', { name: 'Navigation' })).not.toBeInTheDocument();
  });
});
