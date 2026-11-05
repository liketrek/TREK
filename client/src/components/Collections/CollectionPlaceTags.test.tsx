// FE-COMP-COLTAGS-001 to FE-COMP-COLTAGS-005
import type { CollectionLabel, CollectionPlace } from '@trek/shared';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import CollectionPlaceTags from './CollectionPlaceTags';

// jsdom lays nothing out: the observer reports each element once it is observed, and
// the widths below stand in for the browser's.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    constructor(private readonly cb: ResizeObserverCallback) {}
    observe(target: Element) {
      this.cb([{ target } as ResizeObserverEntry], this as unknown as ResizeObserver);
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(() => vi.restoreAllMocks());

/** Row and chip widths in px: the row holds the category, one label and the "+N" chip. */
function layout({ row = 250, cutName }: { row?: number; cutName?: string } = {}) {
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
    if (this.classList.contains('col-lrow-cat')) return 50;
    if (this.classList.contains('col-lrow-label')) return 100;
    return 0;
  });
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(function (this: Element) {
    if (this.classList.contains('col-lrow-tags')) return row;
    if (this.classList.contains('col-lrow-txt')) return 60;
    return 0;
  });
  vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockImplementation(function (this: Element) {
    if (this.classList.contains('col-lrow-txt')) return this.textContent === cutName ? 90 : 60;
    return 0;
  });
}

const label = (id: number, name: string): CollectionLabel =>
  ({ id, collection_id: 1, name, color: '#2563eb' }) as unknown as CollectionLabel;
const place = (category: { name: string; color?: string; icon?: string } | null = { name: 'Attraction' }) =>
  ({ id: 7, name: 'Torre', category }) as unknown as CollectionPlace;
const LABELS = [label(1, 'Core shortlist'), label(2, 'Heritage'), label(3, 'Pair with another stop')];

describe('CollectionPlaceTags', () => {
  it('FE-COMP-COLTAGS-001: draws nothing for a place without labels or a category', () => {
    const { container } = render(<CollectionPlaceTags place={place(null)} labels={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-COMP-COLTAGS-002: shows the category first, then the labels that fit, then a "+N" for the rest', () => {
    layout();
    const { container } = render(<CollectionPlaceTags place={place()} labels={LABELS} />);
    const chips = Array.from(container.querySelectorAll('.col-lrow-tags > span')).map((el) => el.className);
    expect(chips[0]).toBe('col-lrow-cat');
    expect(container.querySelectorAll('.col-lrow-label:not(.is-over)')).toHaveLength(1);
    expect(container.querySelectorAll('.col-lrow-label.is-over')).toHaveLength(2);
    expect(container.querySelector('.col-lrow-label.is-over')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('FE-COMP-COLTAGS-003: a row wide enough shows every label and no "+N"', () => {
    layout({ row: 800 });
    const { container } = render(<CollectionPlaceTags place={place()} labels={LABELS} />);
    expect(container.querySelectorAll('.col-lrow-label:not(.is-over)')).toHaveLength(3);
    expect(container.querySelector('.col-lrow-more')).toBeNull();
  });

  it('FE-COMP-COLTAGS-004: the "+N" names the hidden labels in its tooltip', async () => {
    layout();
    render(<CollectionPlaceTags place={place(null)} labels={LABELS} />);
    fireEvent.mouseEnter(screen.getByText('+2'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Heritage, Pair with another stop');
  });

  it('FE-COMP-COLTAGS-005: a chip says its name in a tooltip only while it cuts the name short', async () => {
    layout({ row: 800, cutName: 'Heritage' });
    render(<CollectionPlaceTags place={place()} labels={LABELS} />);
    fireEvent.mouseEnter(screen.getByText('Core shortlist').closest('.col-lrow-label') as HTMLElement);
    await new Promise((r) => setTimeout(r, 350));
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.mouseLeave(screen.getByText('Core shortlist').closest('.col-lrow-label') as HTMLElement);

    fireEvent.mouseEnter(screen.getByText('Heritage').closest('.col-lrow-label') as HTMLElement);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Heritage');
  });
});
