import type { BookDocument } from '@trek/shared';
import { bookPageSetupSchema, bookThemeOf } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../tests/helpers/render';
import { useStudioStore } from '../../../store/studioStore';
import { StudioInspector } from '../StudioInspector';

/**
 * FE-STUDIO-DOCINSP-001 to FE-STUDIO-DOCINSP-004: the inspector with nothing
 * selected. It says what it is for, shows the page's background, the book's
 * theme with the way to the Theme panel, and the page numbers; the page size
 * sits in its head.
 */

const page = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 });

function load(extra: Partial<BookDocument> = {}) {
  useStudioStore.getState().load({
    version: 1,
    title: 'T',
    page,
    spreads: [{ id: 'sp1', role: 'inner', background: null, elements: [], parked: [], entryId: null }],
    ...extra,
  } as BookDocument);
  useStudioStore.getState().select([]);
}

function draw(onOpenPanel?: (section: string) => void) {
  return render(
    <StudioInspector
      spreadIndex={0}
      page={page}
      stats={null}
      path={[]}
      source={{ entries: [], photos: [], photoEntries: {} }}
      setPageNumbers={() => {}}
      t={(k: string) => k}
      locale="en"
      onOpenPanel={onOpenPanel}
    />
  );
}

const groups = (c: HTMLElement) =>
  [...c.querySelectorAll('.st-section.is-fold > h3 .st-section-label')].map((l) => l.textContent);

beforeEach(() => load());

describe('the inspector with nothing selected', () => {
  it('FE-STUDIO-DOCINSP-001: opens on what it is for, then the page, the theme and the page numbers', () => {
    const { container } = draw();
    expect(container.querySelector('.st-what-label')?.textContent).toBe('journey.studio.document');
    expect(container.querySelector('.st-head-meta')?.textContent).toBe('journey.studio.pageHint 210 × 210 mm');
    expect(container.querySelector('.st-empty-note')?.textContent).toBe('journey.studio.inspectorEmpty');
    expect(groups(container)).toEqual([
      'journey.studio.paint.background',
      'studio.theme.panel',
      'journey.studio.pageNumbers',
    ]);
  });

  it('FE-STUDIO-DOCINSP-002: offers a theme to a book without one, and opens the Theme panel for it', () => {
    const onOpenPanel = vi.fn();
    const { container } = draw(onOpenPanel);
    expect(container.querySelector('.st-theme-sum')).toBeNull();
    expect(screen.getByText('studio.theme.intro')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'studio.theme.choose' }));
    expect(onOpenPanel).toHaveBeenCalledWith('theme');
  });

  it('FE-STUDIO-DOCINSP-003: shows the theme a book has, as the panel draws it, with its name', () => {
    load({ theme: bookThemeOf('nordic') });
    const onOpenPanel = vi.fn();
    const { container } = draw(onOpenPanel);
    const sheet = container.querySelector('.st-theme-sum .st-theme-sheet') as HTMLElement | null;
    expect(sheet?.style.background).not.toBe('');
    expect(container.querySelectorAll('.st-theme-sum .st-theme-dots > span')).toHaveLength(3);
    expect(container.querySelector('.st-theme-sum-name')?.textContent).toBe('studio.theme.name.nordic');
    fireEvent.click(screen.getByRole('button', { name: 'studio.theme.change' }));
    expect(onOpenPanel).toHaveBeenCalledWith('theme');
  });

  it('FE-STUDIO-DOCINSP-004: offers no way to the panel when the shell gives none', () => {
    draw();
    expect(screen.queryByRole('button', { name: 'studio.theme.choose' })).toBeNull();
  });
});
