import { FolderOpen, Map as MapIcon, PenLine } from 'lucide-react';
import { useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MNavRail from '../../../src/mobile/components/MNavRail';
import { useScreenRailAction } from '../../../src/mobile/components/railAction';
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

  it('FE-MOB-RAIL-003: administration sits at the foot for an admin, under its short name', () => {
    useAuthStore.setState({ user: buildUser({ role: 'admin' }) });
    render(<MNavRail />, { initialEntries: ['/dashboard'] });
    // The rail names it "Admin" (nav.admin): the avatar menu's "Admin Settings"
    // ran to two lines in English and was cut in German.
    expect(within(rail()).getByRole('button', { name: 'Admin' })).toBeInTheDocument();
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

  it('FE-MOB-RAIL-009: the head is the same 56px circle on every top-level page, so no entry moves', () => {
    const head = () => rail().firstElementChild?.firstElementChild as HTMLElement;
    for (const path of ['/dashboard', '/atlas', '/settings', '/admin', '/vacay']) {
      const { unmount } = render(<MNavRail />, { initialEntries: [path] });
      expect([path, head().className]).toEqual([path, expect.stringContaining('h-14 w-14')]);
      unmount();
    }
  });

  it("FE-MOB-RAIL-010: on the vacation calendar the head is the screen's own switch", () => {
    const toggle = vi.fn();
    function Vacay({ editing }: { editing: boolean }) {
      useScreenRailAction({ label: editing ? 'Year' : 'Edit calendar', icon: PenLine, pressed: editing, run: toggle });
      return null;
    }
    const { rerender } = render(
      <>
        <MNavRail />
        <Vacay editing={false} />
      </>,
      { initialEntries: ['/vacay'] }
    );
    const first = within(rail()).getAllByRole('button')[0];
    expect(first).toHaveAccessibleName('Edit calendar');
    fireEvent.click(first);
    expect(toggle).toHaveBeenCalledOnce();

    rerender(
      <>
        <MNavRail />
        <Vacay editing />
      </>
    );
    expect(within(rail()).getAllByRole('button')[0]).toHaveAccessibleName('Year');
    expect(within(rail()).getAllByRole('button')[0].className).toContain('border-2');
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

  it('FE-MOB-RAIL-011: the rail comes before the page, so a keyboard reaches the navigation first', () => {
    setSizeClass('wide');
    const { container } = render(
      <MobileShell isPhone>
        <button type="button">in the page</button>
      </MobileShell>,
      { initialEntries: ['/dashboard'] }
    );
    const page = screen.getByRole('button', { name: 'in the page' });
    expect(rail().compareDocumentPosition(page) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelector('.m-shell')?.getAttribute('data-size')).toBe('wide');
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
