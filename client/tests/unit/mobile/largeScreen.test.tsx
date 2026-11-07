import { act, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import JourneyEntryCover, { type CoverEntry } from '../../../src/components/Journey/JourneyEntryCover';
import MSheet from '../../../src/mobile/components/MSheet';
import { edgeFadeClass, useEdgeFade } from '../../../src/mobile/components/useEdgeFade';
import MSettings from '../../../src/mobile/screens/settings/MSettings';
import { usePluginStore } from '../../../src/store/pluginStore';
import { useSettingsStore } from '../../../src/store/settingsStore';
import { buildSettings } from '../../helpers/factories';
import { render, screen } from '../../helpers/render';
import { setSizeClass } from '../../helpers/sizeClass';
import { resetAllStores, seedStore } from '../../helpers/store';

// FE-MOB-LARGE-001 onwards: the touch shell's pieces laid out for a wide window.

describe('MSheet on a wide window', () => {
  // dialog > its box (width, arrow) > the region it stands in (place on the screen).
  const boxOf = (name: string) => screen.getByRole('dialog', { name }).parentElement as HTMLElement;
  const regionOf = (name: string) => boxOf(name).parentElement as HTMLElement;

  it('FE-MOB-LARGE-001: a sheet becomes a form sheet centred in the content beside the rail, of the width it asks for', () => {
    render(
      <MSheet open onClose={() => {}} variant="bottom" wideWidth="large" ariaLabel="Form">
        <span>body</span>
      </MSheet>
    );
    const region = regionOf('Form');
    // The region starts after the rail, so the sheet is centred in what is left of the window.
    expect(region.className).toContain('wide:ps-[calc(var(--m-rail-w)+24px)]');
    expect(region.className).toContain('wide:pe-6');
    expect(region.className).toContain('wide:justify-center');
    expect(region.className).toContain('wide:items-center');
    expect(boxOf('Form').className).toContain('wide:w-[min(720px,100%)]');
    expect(boxOf('Form').querySelector(':scope > span[aria-hidden="true"]')).toBeNull();
  });

  it("FE-MOB-LARGE-002: a menu from the rail's foot is a popover beside it, with an arrow", () => {
    render(
      <MSheet
        open
        onClose={() => {}}
        variant="bottom"
        dimTransparent
        wideWidth="compact"
        wideAnchor="rail-foot"
        ariaLabel="More"
      >
        <span>body</span>
      </MSheet>
    );
    const region = regionOf('More');
    expect(region.className).toContain('wide:ps-[calc(var(--m-rail-w)+6px)]');
    expect(region.className).toContain('wide:justify-end');
    expect(region.className).not.toContain('wide:justify-center');
    expect(boxOf('More').className).toContain('wide:w-[min(320px,100%)]');
    expect(boxOf('More').querySelector(':scope > span[aria-hidden="true"]')).not.toBeNull();
  });

  it('FE-MOB-LARGE-003: the drawer keeps its own place', () => {
    render(
      <MSheet open onClose={() => {}} variant="drawer" ariaLabel="Drawer">
        <span>body</span>
      </MSheet>
    );
    expect(regionOf('Drawer').className).not.toContain('wide:');
    expect(boxOf('Drawer').className).not.toContain('wide:');
  });
});

describe('useEdgeFade', () => {
  function strip(scrollWidth: number, clientWidth: number, scrollLeft = 0) {
    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollWidth', { configurable: true, value: scrollWidth });
    Object.defineProperty(el, 'clientWidth', { configurable: true, value: clientWidth });
    el.scrollLeft = scrollLeft;
    return el;
  }

  it('FE-MOB-LARGE-004: fades the edges that have more behind them, and follows scrolling', () => {
    const el = strip(900, 400);
    const { result } = renderHook(() => useEdgeFade(el));
    expect(result.current).toEqual({ start: false, end: true });
    expect(edgeFadeClass(result.current)).toBe('m-fade-e');

    act(() => {
      el.scrollLeft = 200;
      el.dispatchEvent(new Event('scroll'));
    });
    expect(edgeFadeClass(result.current)).toBe('m-fade-se');

    act(() => {
      el.scrollLeft = 500;
      el.dispatchEvent(new Event('scroll'));
    });
    expect(edgeFadeClass(result.current)).toBe('m-fade-s');
  });

  it('FE-MOB-LARGE-005: a strip that fits fades nowhere, and a right-to-left one counts from its start', () => {
    expect(edgeFadeClass(renderHook(() => useEdgeFade(strip(400, 400))).result.current)).toBe('');
    expect(renderHook(() => useEdgeFade(strip(900, 400, -500))).result.current).toEqual({ start: true, end: false });
    expect(renderHook(() => useEdgeFade(null)).result.current).toEqual({ start: false, end: false });
  });
});

describe('JourneyEntryCover sizes', () => {
  const entry = (overrides: Partial<CoverEntry> = {}): CoverEntry => ({
    id: 10,
    type: 'entry',
    title: 'Fushimi Inari Taisha',
    entry_date: '2026-11-07',
    location_name: 'Kyoto, Japan',
    country_code: 'JP',
    photos: [],
    ...overrides,
  });

  it('FE-MOB-LARGE-006: the large card has room for the whole place on two lines', () => {
    render(<JourneyEntryCover entry={entry()} dayColor="#14b8a6" isActive={false} onClick={() => {}} size="large" />);
    const card = screen.getByRole('button');
    expect(card.className).toContain('w-[176px]');
    expect(screen.getByText('Kyoto, Japan').className).toContain('line-clamp-2');
  });

  it("FE-MOB-LARGE-007: a card without a photo is the day's colour, not an empty grey", () => {
    render(<JourneyEntryCover entry={entry()} dayColor="#14b8a6" isActive={false} onClick={() => {}} tone="mobile" />);
    const card = screen.getByRole('button');
    expect(card.style.backgroundImage).toContain('rgba(20, 184, 166, 0.85)');
    expect(card.className).toContain('w-[136px]');
    expect(screen.getByText('Kyoto, Japan').className).toContain('truncate');
  });
});

describe('MSettings with room for two panes', () => {
  beforeEach(() => {
    resetAllStores();
    seedStore(useSettingsStore, { settings: buildSettings({ language: 'en' }) });
    usePluginStore.setState({ plugins: [], loaded: true });
  });

  it('FE-MOB-LARGE-008: the sections stand in a list beside the page, the dropdown goes', async () => {
    setSizeClass('split');
    const user = userEvent.setup();
    render(<MSettings />, { initialEntries: ['/settings'] });

    const list = screen.getByRole('navigation', { name: 'Settings' });
    expect(list).toBeInTheDocument();
    expect(screen.queryByRole('button', { expanded: false })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'General' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Appearance' }));
    expect(screen.getByRole('button', { name: 'Appearance' })).toHaveAttribute('aria-current', 'page');
  });
});
