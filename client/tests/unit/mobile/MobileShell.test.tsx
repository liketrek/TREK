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

  // #1809: iOS Safari only minimises its address bar when the document scrolls,
  // so the phone shell must not sit a scroll container between the two.
  it('FE-MOB-MSHELL-005: the phone shell owns no scroll container and grows with the document', () => {
    const { container } = render(
      <MobileShell isPhone><p>page body</p></MobileShell>,
      { initialEntries: ['/dashboard'] },
    );

    const root = container.querySelector('.m-root') as HTMLElement;
    // svh, not dvh: dvh grows while the toolbar retracts.
    expect(root.className).toContain('min-h-svh');
    expect(root.className).not.toContain('h-dvh');
    expect(root.querySelector(':scope > .overflow-y-auto')).toBeNull();

    const content = screen.getByText('page body').parentElement as HTMLElement;
    expect(content.className).toContain('flex-1');
    expect(content.className).not.toContain('overflow');
  });

  it('FE-MOB-MSHELL-006: paints background and screen gradient on a viewport-sized layer', () => {
    const { container } = render(
      <MobileShell isPhone><p>page body</p></MobileShell>,
      { initialEntries: ['/dashboard'] },
    );

    const root = container.querySelector('.m-root') as HTMLElement;
    const layer = root.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(layer).toBeInTheDocument();
    expect(layer.className).toContain('fixed');
    expect(layer.className).toContain('inset-0');
    expect(layer.className).toContain('var(--m-scr)');
    expect(layer.className).toContain('var(--m-bg)');
    expect(root.className).not.toContain('var(--m-bg)');
    expect(layer.className).toContain('-z-10');
  });

  it('FE-MOB-MSHELL-006b: the content wrapper is not a stacking context', () => {
    // A positioned wrapper with a z-index traps every fixed overlay a screen
    // renders inside it: the vacay view/edit FAB (z-50) went underneath the dock
    // (z-40) when this carried `relative z-10`. The screens rely on their own
    // z-index competing with the chrome, so this has to stay unpositioned.
    render(<MobileShell isPhone><p>page body</p></MobileShell>, { initialEntries: ['/dashboard'] });

    const content = screen.getByText('page body').parentElement as HTMLElement;
    expect(content.className).toContain('flex-1');
    expect(content.className).not.toMatch(/(^|\s)(relative|absolute|fixed|sticky)(\s|$)/);
    expect(content.className).not.toMatch(/z-\[?\d/);
  });

  it('FE-MOB-MSHELL-007: the desktop branch keeps its own scroller', () => {
    render(
      <MobileShell isPhone={false}><p>page body</p></MobileShell>,
      { initialEntries: ['/dashboard'] },
    );

    const content = screen.getByText('page body').parentElement as HTMLElement;
    expect(content.className).toContain('overflow-y-auto');
    expect(content.className).toContain('md:overflow-visible');
  });
});
