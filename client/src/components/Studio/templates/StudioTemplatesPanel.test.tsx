import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BookDocument } from '@trek/shared';
import { bookPageSetupSchema, decoratedTemplatesFor, normalizeBookDocument } from '@trek/shared';

import { act, fireEvent, render, screen } from '../../../../tests/helpers/render';
import { useStudioStore } from '../../../store/studioStore';
import { StudioTemplatesPanel } from './StudioTemplatesPanel';

/**
 * The Templates panel: the decorated templates of the open page's kind, each
 * a button named after its template and drawn as the page it lays, a style
 * filter, and a click that lays the page out in one undo step.
 */

const t = (k: string) => k;
const page = bookPageSetupSchema.parse({});
const source = {
  title: 'Azores',
  subtitle: 'Nine islands in the Atlantic',
  entries: [{ id: 4, title: 'Sintra', story: 'Up through the fog.', location: 'Serra de Sintra', date: '2026-05-14' }],
};

const book = (title = 'Portugal'): BookDocument =>
  normalizeBookDocument({
    version: 1,
    title,
    page: { preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 },
    spreads: [
      {
        id: 'sp-cover',
        role: 'cover',
        background: null,
        entryId: null,
        parked: [],
        elements: [{ id: 'ph', kind: 'photo', frame: { x: 0, y: 0, w: 50, h: 50 }, photoId: 7 }],
      },
      { id: 'sp-in', role: 'inner', background: null, entryId: 4, parked: [], elements: [] },
    ],
  });

/* jsdom lays nothing out; the cards measure their row to scale the page drawing into it. */
const size = Object.getOwnPropertyDescriptors(HTMLElement.prototype);
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 220 });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 600 });
});
afterAll(() => {
  for (const key of ['offsetWidth', 'offsetHeight'] as const) {
    const was = size[key];
    if (was) Object.defineProperty(HTMLElement.prototype, key, was);
  }
});

beforeEach(() => {
  useStudioStore.getState().load(book());
  useStudioStore.setState({ readOnly: false });
});

const panel = (onOpenContent = vi.fn()) =>
  render(
    <StudioTemplatesPanel
      page={page}
      pxPerMm={96 / 25.4}
      t={t}
      locale="en"
      source={source}
      stats={null}
      path={[]}
      onOpenContent={onOpenContent}
    />
  );

const spreadOf = (i: number) => useStudioStore.getState().doc?.spreads[i];

describe('the Templates panel', () => {
  it('offers the cover templates on the cover, each a named button drawn with the page photo and the book title', () => {
    panel();
    for (const tpl of decoratedTemplatesFor('single')) {
      expect(screen.getByRole('button', { name: tpl.labelKey })).toBeTruthy();
    }
    expect(screen.queryByRole('button', { name: 'studio.templates.name.polaroidStack' })).toBeNull();
    const card = screen.getByRole('button', { name: 'studio.templates.name.minimalSerifClassic' });
    expect(card.textContent).toContain('Portugal');
    expect(card.querySelector('img')?.getAttribute('src')).toContain('/api/photos/7/');
    expect(screen.getByText('studio.templates.decorated')).toBeTruthy();
    expect(screen.getByText('journey.studio.builtInLayouts')).toBeTruthy();
  });

  it('narrows the set to one archetype from the style chips', () => {
    panel();
    const chips = screen.getByRole('radiogroup', { name: 'studio.templates.style' });
    expect(chips.querySelectorAll('[role="radio"]')).toHaveLength(8);
    fireEvent.click(screen.getByRole('radio', { name: 'studio.templates.archetype.postcard' }));
    expect(
      screen.getByRole('radio', { name: 'studio.templates.archetype.postcard' }).getAttribute('aria-checked')
    ).toBe('true');
    const names = decoratedTemplatesFor('single', 'postcard').map((tpl) => tpl.labelKey);
    for (const name of names) expect(screen.getByRole('button', { name })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'studio.templates.name.gridBadgeCircle' })).toBeNull();
  });

  it('lays the page out on a click, as one undo step, keeping its photo', () => {
    panel();
    fireEvent.click(screen.getByRole('button', { name: 'studio.templates.name.postcardHouses' }));
    const cover = spreadOf(0);
    expect(cover?.elements.some((e) => e.kind === 'sticker' && e.stickerId === 'rowHouses')).toBe(true);
    expect(cover?.elements.find((e) => e.kind === 'photo')).toMatchObject({ photoId: 7 });
    expect(cover?.elements.some((e) => e.kind === 'text' && e.text === 'Portugal')).toBe(true);
    expect(useStudioStore.getState().past).toHaveLength(1);
    useStudioStore.getState().undo();
    expect(spreadOf(0)?.elements.map((e) => e.id)).toEqual(['ph']);
  });

  it("sets a cover in the journey's subtitle, bound to it, and in the journey's title when the book has none", () => {
    panel();
    fireEvent.click(screen.getByRole('button', { name: 'studio.templates.name.minimalSerifClassic' }));
    const texts = (spreadOf(0)?.elements ?? []).flatMap((e) => (e.kind === 'text' ? [e] : []));
    expect(texts.map((e) => e.text)).toEqual(['Portugal', 'Nine islands in the Atlantic', '2026']);
    expect(texts[1]?.binding).toEqual({ source: 'journey.subtitle' });

    act(() => useStudioStore.getState().load(book('')));
    fireEvent.click(screen.getByRole('button', { name: 'studio.templates.name.minimalSerifClassic' }));
    const untitled = (spreadOf(0)?.elements ?? []).flatMap((e) => (e.kind === 'text' ? [e.text] : []));
    expect(untitled[0]).toBe('Azores');
  });

  it('offers the spread templates on a double page, sets it in its entry and opens the photos for empty frames', () => {
    useStudioStore.getState().setActiveSpread(1);
    const onOpenContent = vi.fn();
    panel(onOpenContent);
    for (const tpl of decoratedTemplatesFor('inner')) {
      expect(screen.getByRole('button', { name: tpl.labelKey })).toBeTruthy();
    }
    fireEvent.click(screen.getByRole('button', { name: 'studio.templates.name.storyQuote' }));
    const inner = spreadOf(1);
    const title = inner?.elements.find((e) => e.kind === 'text' && e.text === 'Sintra');
    expect(title?.kind === 'text' && title.binding).toEqual({ source: 'entry.title', entryId: 4 });
    expect(onOpenContent).toHaveBeenCalledTimes(1);
  });

  it('lays a built-in layout out from the same panel', () => {
    useStudioStore.getState().setActiveSpread(1);
    panel();
    fireEvent.click(screen.getByText('journey.studio.tpl.grid4'));
    expect(spreadOf(1)?.elements.filter((e) => e.kind === 'photo')).toHaveLength(4);
  });

  it('leaves what is locked where it is, as the assistant does, and lays out the rest', () => {
    const locked = normalizeBookDocument({
      ...book(),
      spreads: [
        book().spreads[0],
        {
          id: 'sp-in',
          role: 'inner',
          background: null,
          entryId: 4,
          parked: [],
          elements: [
            { id: 'panel', kind: 'shape', frame: { x: 0, y: 150, w: 420, h: 60 }, locked: true },
            { id: 'free', kind: 'photo', frame: { x: 230, y: 20, w: 60, h: 60 }, photoId: 8 },
            { id: 'kept', kind: 'photo', frame: { x: 10, y: 20, w: 60, h: 60 }, photoId: 9, locked: true },
          ],
        },
      ],
    });
    useStudioStore.getState().load(locked);
    useStudioStore.getState().setActiveSpread(1);
    panel();
    fireEvent.click(screen.getByText('journey.studio.tpl.grid4'));
    const after = spreadOf(1)?.elements ?? [];
    expect(after[0]).toEqual(locked.spreads[1]?.elements[0]);
    expect(after.find((e) => e.id === 'kept')).toEqual(locked.spreads[1]?.elements[2]);
    const poured = after.filter((e) => e.kind === 'photo' && !e.locked);
    expect(poured).toHaveLength(4);
    expect(poured.map((e) => (e.kind === 'photo' ? e.photoId : null))).toContain(8);
  });
});
