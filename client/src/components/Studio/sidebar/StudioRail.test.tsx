import type { BookDocument } from '@trek/shared';
import { normalizeBookDocument } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import { useStudioStore } from '../../../store/studioStore';
import { StudioSidebar, type JourneySource } from '../StudioSidebar';
import type { StudioUploader } from '../studioUpload';
import { RAIL_SECTIONS, type RailSection } from './railSections';

/**
 * FE-STUDIO-RAIL-001 to FE-STUDIO-RAIL-006: the rail down the side of Studio
 * and the panel it opens. Every section is a tab that opens its own panel
 * under one head, the keyboard reaches every tab, a long name wraps inside
 * the rail, and the shell can hold the open section so the inspector can open
 * one from the other side.
 */

const SOURCE: JourneySource = { entries: [], photos: [], photoEntries: {} };
const NO_UPLOAD: StudioUploader = async () => ({ photoIds: [], failed: 0, skippedVideos: 0 });

/** The value, or a failed test saying it was missing. */
function must<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('expected a value');
  return value;
}

const book = (): BookDocument =>
  normalizeBookDocument({
    version: 1,
    title: 'Lisbon',
    page: { preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 },
    spreads: [{ id: 'sp1', role: 'inner', entryId: null, background: null, elements: [], parked: [] }],
  });

function draw(over: { section?: RailSection; onSection?: (s: RailSection) => void } = {}) {
  const doc = must(useStudioStore.getState().doc);
  return render(
    <StudioSidebar
      page={doc.page}
      pxPerMm={96 / 25.4}
      bookView={false}
      source={SOURCE}
      stats={null}
      path={[]}
      t={(k: string) => k}
      locale="en"
      canEdit
      onUpload={NO_UPLOAD}
      onToggleStop={async () => true}
      section={over.section}
      onSection={over.onSection}
    />
  );
}

/** The head of the panel that is open: the name every panel opens on. */
const panelTitle = () => must(document.querySelector('.st-side .st-panel-head .st-what-label')).textContent;

/** The name each section's panel opens on. */
const TITLES: Record<RailSection, string> = {
  pages: 'journey.studio.pages',
  content: 'journey.studio.content',
  templates: 'journey.studio.templates',
  elements: 'journey.studio.elements',
  travel: 'journey.studio.travel',
  theme: 'studio.theme.panel',
  layers: 'journey.studio.layers',
};

beforeEach(() => {
  useStudioStore.getState().load(book());
});

describe('the rail', () => {
  it('FE-STUDIO-RAIL-001: lists the sections in the order a book is made, the theme and layers set apart', () => {
    const { container } = draw();
    const rail = screen.getByRole('tablist', { name: 'journey.studio.sections' });
    expect(rail.getAttribute('aria-orientation')).toBe('vertical');
    const tabs = within(rail).getAllByRole('tab');
    expect(tabs.map((t) => t.getAttribute('aria-label'))).toEqual(RAIL_SECTIONS.map((s) => s.labelKey));
    expect(RAIL_SECTIONS.map((s) => s.id)).toEqual([
      'pages',
      'content',
      'templates',
      'elements',
      'travel',
      'theme',
      'layers',
    ]);
    // The rule sits right before the theme, and stickers are no longer a section of their own.
    const sep = must(container.querySelector('.st-rail-sep'));
    expect(sep.nextElementSibling?.getAttribute('aria-label')).toBe('studio.theme.panel');
    expect(tabs.some((t) => t.getAttribute('aria-label') === 'journey.studio.stickers')).toBe(false);
  });

  it('FE-STUDIO-RAIL-002: opens on Pages, and every tab opens its own panel under its own head', () => {
    draw();
    expect(screen.getByRole('tab', { name: 'journey.studio.pages' }).getAttribute('aria-selected')).toBe('true');
    expect(panelTitle()).toBe(TITLES.pages);
    for (const entry of RAIL_SECTIONS) {
      const tab = screen.getByRole('tab', { name: entry.labelKey });
      fireEvent.click(tab);
      expect(tab.getAttribute('aria-selected')).toBe('true');
      const panel = must(document.querySelector('.st-side'));
      expect(panel.getAttribute('role')).toBe('tabpanel');
      expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
      expect(panelTitle()).toBe(TITLES[entry.id]);
    }
  });

  it('FE-STUDIO-RAIL-003: keeps one tab in the Tab order and reaches every tab with the arrows', () => {
    draw();
    const tabs = screen.getAllByRole('tab').filter((t) => t.classList.contains('st-rail-btn'));
    expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1, -1, -1, -1, -1]);
    const first = must(tabs[0]);
    first.focus();
    const seen = [document.activeElement];
    for (let i = 1; i < tabs.length; i++) {
      fireEvent.keyDown(must(document.activeElement), { key: 'ArrowDown' });
      seen.push(document.activeElement);
    }
    expect(seen).toEqual(tabs);
    // Down from the last wraps to the first; Home and End jump; arrowing opens nothing.
    fireEvent.keyDown(must(document.activeElement), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: 'End' });
    expect(document.activeElement).toBe(tabs[tabs.length - 1]);
    fireEvent.keyDown(must(document.activeElement), { key: 'Home' });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(tabs[tabs.length - 1]);
    expect(panelTitle()).toBe(TITLES.pages);
  });

  it('FE-STUDIO-RAIL-004: carries each name whole in its title, in a label that may wrap', () => {
    const { container } = draw();
    for (const tab of screen.getAllByRole('tab').filter((t) => t.classList.contains('st-rail-btn'))) {
      const label = must(tab.querySelector('.st-rail-label'));
      expect(tab.getAttribute('title')).toBe(label.textContent);
    }
    expect(container.querySelectorAll('.st-rail-label')).toHaveLength(RAIL_SECTIONS.length);
  });

  it('FE-STUDIO-RAIL-005: opens the section the shell holds, and tells the shell which one was picked', () => {
    const onSection = vi.fn();
    const view = draw({ section: 'theme', onSection });
    expect(panelTitle()).toBe(TITLES.theme);
    fireEvent.click(screen.getByRole('tab', { name: 'journey.studio.layers' }));
    expect(onSection).toHaveBeenCalledWith('layers');
    view.unmount();
    draw({ section: 'layers', onSection });
    expect(panelTitle()).toBe(TITLES.layers);
  });

  it('FE-STUDIO-RAIL-006: finds the stickers under Elements, beside the icons', () => {
    draw();
    fireEvent.click(screen.getByRole('tab', { name: 'journey.studio.elements' }));
    const kinds = screen.getAllByRole('tab').filter((t) => t.classList.contains('st-subtab'));
    expect(kinds.map((t) => t.textContent)).toEqual([
      'journey.studio.text',
      'journey.studio.shapes',
      'journey.studio.lines',
      'journey.studio.frames',
      'journey.studio.icons',
      'journey.studio.stickers',
    ]);
    fireEvent.click(screen.getByRole('tab', { name: 'journey.studio.stickers' }));
    expect(screen.getByRole('textbox', { name: 'journey.studio.searchStickers' })).toBeTruthy();
  });
});
