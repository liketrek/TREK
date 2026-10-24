import type { BookDocument, BookElement } from '@trek/shared';
import { bookPageSetupSchema, bookShapeElementSchema, bookTextElementSchema } from '@trek/shared';
import { beforeEach, describe, expect, it } from 'vitest';

import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { useStudioStore } from '../../store/studioStore';
import { StudioArrangeSection } from './StudioArrangeSection';
import { selectionTitle } from './studioLayerRows';
import { StudioLayersPanel } from './StudioLayersPanel';

const page = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 });
const t = (k: string) => k;

/** The value, or a failed test when it is missing. */
function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('expected a value');
  return value;
}

const shape = (id: string, x: number, over: Partial<BookElement> = {}): BookElement =>
  bookShapeElementSchema.parse({
    id,
    kind: 'shape',
    frame: { x, y: 10, w: 20, h: 20 },
    shape: 'rect',
    ...over,
  }) as BookElement;

function load(elements: BookElement[], groups?: { id: string; name?: string }[]) {
  useStudioStore.getState().load({
    version: 1,
    title: 'T',
    page,
    spreads: [{ id: 'sp1', role: 'inner', background: null, elements, parked: [], entryId: null, groups }],
  } as BookDocument);
  useStudioStore.setState({ enteredGroup: null, styleClip: null, readOnly: false });
}

const store = () => useStudioStore.getState();
const el = (id: string) => must(must(must(store().doc).spreads[0]).elements.find((e) => e.id === id));
const order = () => must(must(store().doc).spreads[0]).elements.map((e) => e.id);

const book = () => {
  const title = bookTextElementSchema.parse({
    id: 't',
    kind: 'text',
    frame: { x: 0, y: 0, w: 50, h: 10 },
    text: 'Reykjavik',
  }) as BookElement;
  load(
    [shape('a', 0), shape('g1', 40, { group: 'g' }), shape('g2', 80, { group: 'g' }), title],
    [{ id: 'g', name: 'Pair' }]
  );
};

const rows = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>('[data-layer-key]'));

beforeEach(book);

describe('the layers panel', () => {
  it('lists the page front to back, a group with its members, a text by its words', () => {
    const { container } = render(<StudioLayersPanel t={t} />);
    expect(rows(container).map((r) => r.dataset.layerKey)).toEqual(['t', 'g:g', 'g2', 'g1', 'a']);
    expect(screen.getByText('Reykjavik')).toBeInTheDocument();
    expect(screen.getByText('Pair')).toBeInTheDocument();
  });

  it('selects a group from its row, a member alone inside it, and an element with shift added', () => {
    const { container } = render(<StudioLayersPanel t={t} />);
    fireEvent.click(must(rows(container)[1]));
    expect(store().selection).toEqual(['g1', 'g2']);
    fireEvent.click(must(rows(container)[2]));
    expect([store().selection, store().enteredGroup]).toEqual([['g2'], 'g']);
    fireEvent.click(must(rows(container)[4]), { shiftKey: true });
    expect(store().selection).toEqual(['g2', 'a']);
  });

  it('hides, shows and locks a layer from its row, and a group from its own', () => {
    const { container } = render(<StudioLayersPanel t={t} />);
    const aRow = must(rows(container)[4]);
    fireEvent.click(aRow.querySelector('[aria-label="journey.studio.layers.hide"]') as Element);
    expect(el('a').hidden).toBe(true);
    expect(must(rows(container)[4]).className).toContain('is-hidden');
    fireEvent.click(must(rows(container)[4]).querySelector('[aria-label="journey.studio.layers.show"]') as Element);
    expect(el('a').hidden).toBeUndefined();
    fireEvent.click(must(rows(container)[1]).querySelector('[aria-label="journey.studio.lock"]') as Element);
    expect([el('g1').locked, el('g2').locked]).toEqual([true, true]);
    // Toggling a row does not select it.
    expect(store().selection).toEqual([]);
  });

  it('renames on a double-click, Enter keeps it and Escape leaves the name as it was', () => {
    const { container } = render(<StudioLayersPanel t={t} />);
    fireEvent.doubleClick(screen.getByText('Pair'));
    const input = container.querySelector('.st-layer-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Sun and sea' } });
    fireEvent.blur(input);
    expect(must(must(store().doc).spreads[0]).groups).toEqual([{ id: 'g', name: 'Sun and sea' }]);

    fireEvent.doubleClick(screen.getByText('Reykjavik'));
    const again = container.querySelector('.st-layer-input') as HTMLInputElement;
    fireEvent.keyDown(again, { key: 'Escape' });
    expect(container.querySelector('.st-layer-input')).toBeNull();
    expect(el('t').name).toBeUndefined();
  });

  it('folds a group away and opens it again', () => {
    const { container } = render(<StudioLayersPanel t={t} />);
    fireEvent.click(container.querySelector('[aria-label="journey.studio.layers.collapse"]') as Element);
    expect(rows(container).map((r) => r.dataset.layerKey)).toEqual(['t', 'g:g', 'a']);
    fireEvent.click(container.querySelector('[aria-label="journey.studio.layers.expand"]') as Element);
    expect(rows(container)).toHaveLength(5);
  });

  it('restacks a row dragged over another, as one undo step', () => {
    const { container } = render(<StudioLayersPanel t={t} />);
    const list = container.querySelector('.st-layers') as HTMLElement;
    // Rows 20 pixels tall from the top, front to back.
    rows(container).forEach((row, i) => {
      row.getBoundingClientRect = () =>
        ({
          top: i * 20,
          bottom: i * 20 + 20,
          height: 20,
          left: 0,
          right: 100,
          width: 100,
          x: 0,
          y: i * 20,
          toJSON: () => ({}),
        }) as DOMRect;
    });
    fireEvent.pointerDown(must(rows(container)[4]), { clientY: 90, button: 0 });
    fireEvent.pointerMove(list, { clientY: 60 });
    fireEvent.pointerMove(list, { clientY: 3 });
    expect(must(rows(container)[0]).className).toContain('is-drop-above');
    fireEvent.pointerUp(list, { clientY: 3 });
    expect(order()).toEqual(['g1', 'g2', 't', 'a']);
    store().undo();
    expect(order()).toEqual(['a', 'g1', 'g2', 't']);
  });

  it('groups and ungroups the selection from its foot, and says when the page is empty', () => {
    store().select(['a', 't']);
    render(<StudioLayersPanel t={t} />);
    fireEvent.click(screen.getByText('journey.studio.layers.groupAction'));
    expect(el('a').group).toBeDefined();
    fireEvent.click(screen.getByText('journey.studio.layers.ungroup'));
    expect(el('a').group).toBeUndefined();
    load([]);
    render(<StudioLayersPanel t={t} />);
    expect(screen.getAllByText('journey.studio.layers.empty').length).toBeGreaterThan(0);
  });

  it('is one stop in the Tab order, and the arrows walk the rows from there', () => {
    const { container } = render(<StudioLayersPanel t={t} />);
    expect(rows(container).map((r) => r.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    fireEvent.keyDown(must(rows(container)[0]), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(rows(container)[1]);
    expect(rows(container).map((r) => r.tabIndex)).toEqual([-1, 0, -1, -1, -1]);
    fireEvent.keyDown(must(rows(container)[1]), { key: 'End' });
    expect(document.activeElement).toBe(rows(container)[4]);
    fireEvent.keyDown(must(rows(container)[4]), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(rows(container)[4]);
    fireEvent.keyDown(must(rows(container)[4]), { key: 'Home' });
    expect(document.activeElement).toBe(rows(container)[0]);
  });

  it('selects with Enter or Space, Shift adding, and keeps the arrow off the page', () => {
    store().select(['a']);
    const { container } = render(<StudioLayersPanel t={t} />);
    // The selected row is the one Tab reaches.
    expect(must(rows(container)[4]).tabIndex).toBe(0);
    fireEvent.keyDown(must(rows(container)[0]), { key: 'Enter' });
    expect(store().selection).toEqual(['t']);
    fireEvent.keyDown(must(rows(container)[4]), { key: ' ', shiftKey: true });
    expect(store().selection).toEqual(['t', 'a']);
    // Taken by the tree, so the sheet's own keys (useStudioKeys) leave the selection where it is.
    expect(fireEvent.keyDown(must(rows(container)[4]), { key: 'ArrowUp' })).toBe(false);
    expect(fireEvent.keyDown(must(rows(container)[3]), { key: 'Delete' })).toBe(true);
  });

  it('closes a group with Left, opens it with Right, and steps between a member and its group', () => {
    const { container } = render(<StudioLayersPanel t={t} />);
    fireEvent.keyDown(must(rows(container)[2]), { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(rows(container)[1]);
    fireEvent.keyDown(must(rows(container)[1]), { key: 'ArrowLeft' });
    expect(rows(container).map((r) => r.dataset.layerKey)).toEqual(['t', 'g:g', 'a']);
    expect(must(rows(container)[1]).getAttribute('aria-expanded')).toBe('false');
    fireEvent.keyDown(must(rows(container)[1]), { key: 'ArrowRight' });
    expect(rows(container)).toHaveLength(5);
    fireEvent.keyDown(must(rows(container)[1]), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(rows(container)[2]);
  });

  it('renames with F2, and the keyboard is back on the row after Enter or Escape', () => {
    const { container } = render(<StudioLayersPanel t={t} />);
    fireEvent.keyDown(must(rows(container)[0]), { key: 'F2' });
    const input = container.querySelector('.st-layer-input') as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: 'Title' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(el('t').name).toBe('Title');
    expect(document.activeElement).toBe(rows(container)[0]);

    fireEvent.keyDown(must(rows(container)[0]), { key: 'F2' });
    const again = container.querySelector('.st-layer-input') as HTMLInputElement;
    fireEvent.change(again, { target: { value: 'Something else' } });
    fireEvent.keyDown(again, { key: 'Escape' });
    expect(el('t').name).toBe('Title');
    expect(container.querySelector('.st-layer-input')).toBeNull();
    expect(document.activeElement).toBe(rows(container)[0]);
  });

  it('offers no drag, lock or visibility to a book held read-only', () => {
    useStudioStore.setState({ readOnly: true });
    const { container } = render(<StudioLayersPanel t={t} />);
    expect(container.querySelector('.st-layer-acts')).toBeNull();
    expect(container.querySelector('.st-layers-foot')).toBeNull();
  });
});

describe('the align section', () => {
  it('aligns a multi-selection within itself and distributes three', () => {
    store().select(['a', 'g1', 'g2', 't']);
    render(<StudioArrangeSection spreadIndex={0} t={t} />);
    fireEvent.click(screen.getByLabelText('journey.studio.layers.alignTop'));
    expect([el('a').frame.y, el('t').frame.y]).toEqual([0, 0]);
    const steps = store().past.length;
    fireEvent.click(screen.getByLabelText('journey.studio.layers.distributeH'));
    expect(store().past.length).toBe(steps + 1);
  });

  it('aligns a single element against its page, and copies and pastes style', () => {
    store().select(['a']);
    render(<StudioArrangeSection spreadIndex={0} t={t} />);
    // Folded for one element: lining up is not what one element usually needs next.
    expect(screen.queryByLabelText('journey.studio.layers.alignRight')).toBeNull();
    fireEvent.click(screen.getByText('journey.studio.arrange'));
    expect(screen.getByRole('radio', { name: 'journey.studio.layers.toSelection' })).toBeDisabled();
    fireEvent.click(screen.getByLabelText('journey.studio.layers.alignRight'));
    expect(el('a').frame.x).toBe(190);
    expect(screen.getByLabelText('journey.studio.layers.pasteStyle')).toBeDisabled();
    fireEvent.click(screen.getByLabelText('journey.studio.layers.copyStyle'));
    expect(store().styleClip?.kind).toBe('shape');
  });

  it('offers group for a loose selection and ungroup for a group, named in the inspector head', () => {
    store().select(['g1', 'g2']);
    const spread = must(store().doc).spreads[0];
    expect(selectionTitle(spread, ['g1', 'g2'], t)).toBe('Pair');
    expect(selectionTitle(spread, ['a', 'g1'], t)).toBe('journey.studio.multiple');
    render(<StudioArrangeSection spreadIndex={0} t={t} />);
    expect(screen.getByText('journey.studio.layers.groupHint')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('journey.studio.layers.ungroup'));
    expect(el('g1').group).toBeUndefined();
  });

  it('draws nothing without a selection', () => {
    const { container } = render(<StudioArrangeSection spreadIndex={0} t={t} />);
    expect(container.innerHTML).toBe('');
  });
});
