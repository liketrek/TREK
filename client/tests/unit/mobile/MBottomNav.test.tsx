import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../helpers/render';
import MBottomNav from '../../../src/mobile/components/MBottomNav';
import { useAddonStore } from '../../../src/store/addonStore';
import { usePluginStore } from '../../../src/store/pluginStore';

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
});
