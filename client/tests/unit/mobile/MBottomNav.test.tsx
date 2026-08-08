import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useLocation } from 'react-router';
import { render, screen, fireEvent } from '../../helpers/render';
import MBottomNav from '../../../src/mobile/components/MBottomNav';
import { useAddonStore } from '../../../src/store/addonStore';
import { usePluginStore } from '../../../src/store/pluginStore';

function LocationEcho() {
  const location = useLocation();
  return <span data-testid="loc">{location.pathname + location.search}</span>;
}

const nav = (entry: string) =>
  render(<><MBottomNav /><LocationEcho /></>, { initialEntries: [entry] });

const at = () => screen.getByTestId('loc').textContent;

// FE-MOB-NAV-001 onwards

function seedAddons(ids: string[]) {
  useAddonStore.setState({
    addons: ids.map((id) => ({ id, name: id, type: 'global', icon: 'globe', enabled: true })),
    loaded: true,
  });
}

describe('MBottomNav', () => {
  beforeEach(() => {
    useAddonStore.setState({ addons: [], loaded: true });
    usePluginStore.setState({ plugins: [], loaded: true });
  });

  it('FE-MOB-NAV-001: renders the dashboard tab plus enabled global addons', () => {
    seedAddons(['vacay', 'atlas']);
    render(<MBottomNav />, { initialEntries: ['/dashboard'] });

    expect(screen.getByRole('button', { name: 'My Trips' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vacay' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Atlas' })).toBeInTheDocument();
  });

  it('FE-MOB-NAV-002: omits tabs for addons that are not enabled', () => {
    render(<MBottomNav />, { initialEntries: ['/dashboard'] });

    expect(screen.getByRole('button', { name: 'My Trips' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Atlas' })).not.toBeInTheDocument();
  });

  it('FE-MOB-NAV-003: marks the current route as the active tab', () => {
    seedAddons(['atlas']);
    render(<MBottomNav />, { initialEntries: ['/atlas'] });

    expect(screen.getByRole('button', { name: 'Atlas' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'My Trips' })).not.toHaveAttribute('aria-current');
  });

  it('FE-MOB-NAV-004: the "+" creates a trip on the dashboard', () => {
    render(<MBottomNav />, { initialEntries: ['/dashboard'] });
    expect(screen.getByRole('button', { name: 'New Trip' })).toBeInTheDocument();
  });

  it('FE-MOB-NAV-005: the "+" follows the persisted trip tab inside a trip', () => {
    sessionStorage.setItem('trip-tab-7', 'buchungen');
    render(<MBottomNav />, { initialEntries: ['/trips/7'] });
    expect(screen.getByRole('button', { name: 'Manual Booking' })).toBeInTheDocument();
  });

  it('FE-MOB-NAV-006: journey and collections live in the More popover, not the dock', () => {
    seedAddons(['vacay', 'atlas', 'journey', 'collections']);
    render(<MBottomNav />, { initialEntries: ['/dashboard'] });

    expect(screen.queryByRole('button', { name: 'Journey' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByRole('button', { name: /Journey/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Collections/ })).toBeInTheDocument();
  });

  it('FE-MOB-NAV-007: no More slot without popover entries', () => {
    seedAddons(['vacay', 'atlas']);
    render(<MBottomNav />, { initialEntries: ['/dashboard'] });
    expect(screen.queryByRole('button', { expanded: false })).not.toBeInTheDocument();
  });

  it('FE-MOB-NAV-008: the centre button opens the country search on the atlas', () => {
    seedAddons(['atlas']);
    render(<MBottomNav />, { initialEntries: ['/atlas'] });
    expect(screen.getByRole('button', { name: 'Search a country...' })).toBeInTheDocument();
  });

  it('FE-MOB-NAV-009: settings shows the disabled logo slot instead of a create action', () => {
    render(<MBottomNav />, { initialEntries: ['/settings'] });
    expect(screen.queryByRole('button', { name: 'New Trip' })).not.toBeInTheDocument();
  });

  it('FE-MOB-NAV-010: admin also swaps the "+" for the logo slot', () => {
    render(<MBottomNav />, { initialEntries: ['/admin'] });
    expect(screen.queryByRole('button', { name: 'New Trip' })).not.toBeInTheDocument();
  });

  it('FE-MOB-NAV-011: choosing a More entry navigates and closes the popover', () => {
    seedAddons(['vacay', 'atlas', 'journey', 'collections']);
    render(<MBottomNav />, { initialEntries: ['/dashboard'] });

    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    fireEvent.click(screen.getByRole('button', { name: /Journey/ }));

    const more = screen.getByRole('button', { name: 'More' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(more).toHaveAttribute('aria-current', 'page');
  });

  it('FE-MOB-NAV-012: tapping the scrim closes the More popover again', () => {
    seedAddons(['vacay', 'atlas', 'journey', 'collections']);
    const { container } = render(<MBottomNav />, { initialEntries: ['/dashboard'] });

    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    const scrim = container.querySelector('.fixed.inset-0') as HTMLElement;

    fireEvent.click(scrim);

    expect(screen.getByRole('button', { name: 'More' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: /Collections/ })).not.toBeInTheDocument();
  });

  it('FE-MOB-NAV-013: a click inside the popover does not close it', () => {
    seedAddons(['vacay', 'atlas', 'journey', 'collections']);
    const { container } = render(<MBottomNav />, { initialEntries: ['/dashboard'] });

    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    fireEvent.click(container.querySelector('.fixed.inset-0 > div') as HTMLElement);

    expect(screen.getByRole('button', { name: /Journey/ })).toBeInTheDocument();
  });

  it.each([
    ['/journey', 'New Journey', '/journey?create=1'],
    ['/journey/4', 'Add Entry', '/journey/4?create=entry'],
    ['/collections', 'Add a place', '/collections?create=place'],
    ['/trips/7', 'Add Place/Activity', '/trips/7?create=place'],
    ['/dashboard', 'New Trip', '/dashboard?create=1'],
    ['/atlas', 'Search a country...', '/atlas?search=1'],
  ])('FE-MOB-NAV-014: the "+" on %s runs "%s"', (route, label, target) => {
    seedAddons(['journey', 'collections', 'atlas']);
    nav(route);

    fireEvent.click(screen.getByRole('button', { name: label }));

    expect(at()).toBe(target);
  });

  it.each([
    ['finanzplan', 'Add expense', '/trips/7?create=expense'],
    ['transports', 'Transport', '/trips/7?create=transport'],
    ['buchungen', 'Manual Booking', '/trips/7?create=reservation'],
  ])('FE-MOB-NAV-015: the trip "+" follows the %s tab', (tab, label, target) => {
    sessionStorage.setItem('trip-tab-7', tab);
    nav('/trips/7');

    fireEvent.click(screen.getByRole('button', { name: label }));

    expect(at()).toBe(target);
  });

  it('FE-MOB-NAV-016: a dock tab navigates to its route', () => {
    seedAddons(['vacay', 'atlas']);
    nav('/dashboard');

    fireEvent.click(screen.getByRole('button', { name: 'Atlas' }));

    expect(at()).toBe('/atlas');
  });

  it('FE-MOB-NAV-017: a More entry navigates to its route', () => {
    seedAddons(['vacay', 'atlas', 'journey', 'collections']);
    nav('/dashboard');

    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    fireEvent.click(screen.getByRole('button', { name: /Collections/ }));

    expect(at()).toBe('/collections');
  });
});
