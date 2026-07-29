import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '../../helpers/render';
import MobileShell from '../../../src/mobile/MobileShell';
import { useAddonStore } from '../../../src/store/addonStore';
import { usePluginStore } from '../../../src/store/pluginStore';

// FE-MOB-MSHELL-001 onwards

beforeEach(() => {
  useAddonStore.setState({ addons: [], loaded: true });
  usePluginStore.setState({ plugins: [], loaded: true });
});

describe('MobileShell', () => {
  it('FE-MOB-MSHELL-001: keeps the legacy wrapper above the phone breakpoint', () => {
    const { container } = render(
      <MobileShell isPhone={false}><p>page body</p></MobileShell>,
      { initialEntries: ['/dashboard'] },
    );

    expect(screen.getByText('page body')).toBeInTheDocument();
    expect(container.querySelector('.m-root')).toBeNull();
    expect(document.getElementById('m-sheet-root')).toBeNull();
  });

  it('FE-MOB-MSHELL-002: scopes the mobile tokens and mounts the dock plus sheet portal', () => {
    const { container } = render(
      <MobileShell isPhone><p>page body</p></MobileShell>,
      { initialEntries: ['/dashboard'] },
    );

    expect(container.querySelector('.m-root')).toBeInTheDocument();
    expect(document.getElementById('m-sheet-root')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'My Trips' })).toBeInTheDocument();
  });

  it('FE-MOB-MSHELL-003: hides the global dock inside the trip planner', () => {
    render(
      <MobileShell isPhone><p>page body</p></MobileShell>,
      { initialEntries: ['/trips/7'] },
    );

    expect(screen.queryByRole('button', { name: 'My Trips' })).not.toBeInTheDocument();
    expect(screen.getByText('page body')).toBeInTheDocument();
  });

  it('FE-MOB-MSHELL-004: the mobile toast presenter takes over the global bridge', () => {
    const previous = vi.fn(() => 0);
    window.__addToast = previous;

    render(<MobileShell isPhone><p>page body</p></MobileShell>, { initialEntries: ['/dashboard'] });
    expect(window.__addToast).not.toBe(previous);

    act(() => { window.__addToast?.('Saved', 'success'); });
    expect(screen.getByText('Saved')).toBeInTheDocument();

    delete window.__addToast;
  });
});
