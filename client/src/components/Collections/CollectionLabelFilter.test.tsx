// FE-COMP-COLLABELS-001 to FE-COMP-COLLABELS-006
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import type { TranslationFn } from '../../types';
import CollectionLabelFilter, { type LabelOption } from './CollectionLabelFilter';

const t = ((key: string) => key) as unknown as TranslationFn;
const LABELS = [
  { id: 1, name: 'Core shortlist', color: '#2563eb', count: 2 },
  { id: 2, name: 'Heritage', color: null, count: 0 },
] as unknown as LabelOption[];

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(() => vi.restoreAllMocks());

/** The labels need `need` px against a slot of `room` px beside the map's controls. */
function room(need: number, room: number) {
  vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockImplementation(function (this: Element) {
    return this.classList.contains('col-labelfilter-measure') ? need : 0;
  });
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(function (this: Element) {
    return this.classList.contains('col-labelfilter-slot') ? room : 0;
  });
}

function setup(props: Partial<Parameters<typeof CollectionLabelFilter>[0]> = {}) {
  const onLabelFilter = vi.fn();
  const onManageLabels = vi.fn();
  const view = render(
    <CollectionLabelFilter
      labelOptions={LABELS}
      labelFilter={[]}
      onLabelFilter={onLabelFilter}
      canManageLabels
      onManageLabels={onManageLabels}
      t={t}
      {...props}
    />
  );
  return { ...view, onLabelFilter, onManageLabels };
}

describe('CollectionLabelFilter', () => {
  it('FE-COMP-COLLABELS-001: the filter row toggles a label on and off', () => {
    const on = setup();
    fireEvent.click(screen.getByRole('button', { name: /Core shortlist/ }));
    expect(on.onLabelFilter).toHaveBeenCalledWith([1]);
    on.unmount();

    const off = setup({ labelFilter: [1, 2] });
    expect(screen.getByRole('button', { name: /Core shortlist/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /Core shortlist/ }));
    expect(off.onLabelFilter).toHaveBeenCalledWith([2]);
  });

  it('FE-COMP-COLLABELS-002: offers to add a label when there is none, and to manage them otherwise', () => {
    const empty = setup({ labelOptions: [] });
    fireEvent.click(screen.getByRole('button', { name: 'collections.labels.add' }));
    expect(empty.onManageLabels).toHaveBeenCalled();
    empty.unmount();

    setup();
    expect(screen.getByRole('button', { name: 'collections.labels.manage' })).toBeInTheDocument();
  });

  it('FE-COMP-COLLABELS-003: on the map the strip shows its labels while they fit', () => {
    room(300, 500);
    setup({ variant: 'map' });
    expect(screen.getByRole('button', { name: /Heritage/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /collections.labels.title/ })).toBeNull();
  });

  it('FE-COMP-COLLABELS-004: without room it folds into one button that lists the labels', () => {
    room(600, 200);
    const { onLabelFilter } = setup({ variant: 'map', labelFilter: [2] });
    const fold = screen.getByRole('button', { name: /collections.labels.title/ });
    expect(fold).toHaveTextContent('1');
    expect(fold).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(fold);
    const list = screen.getByRole('group', { name: 'collections.labels.title' });
    expect(list).toHaveTextContent('Core shortlist');
    expect(screen.getByRole('button', { name: /Heritage/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /Core shortlist/ }));
    expect(onLabelFilter).toHaveBeenCalledWith([2, 1]);
  });

  it('FE-COMP-COLLABELS-005: the folded list manages labels and closes on Escape or a click beside it', () => {
    room(600, 200);
    const { onManageLabels } = setup({ variant: 'map' });
    const fold = screen.getByRole('button', { name: /collections.labels.title/ });

    fireEvent.click(fold);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('group', { name: 'collections.labels.title' })).toBeNull();

    fireEvent.click(fold);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('group', { name: 'collections.labels.title' })).toBeNull();

    fireEvent.click(fold);
    fireEvent.click(screen.getByRole('button', { name: /collections.labels.manage/ }));
    expect(onManageLabels).toHaveBeenCalled();
    expect(screen.queryByRole('group', { name: 'collections.labels.title' })).toBeNull();
  });

  it('FE-COMP-COLLABELS-006: a click inside the folded list keeps it open', () => {
    room(600, 200);
    setup({ variant: 'map' });
    fireEvent.click(screen.getByRole('button', { name: /collections.labels.title/ }));
    fireEvent.mouseDown(screen.getByRole('group', { name: 'collections.labels.title' }));
    expect(screen.getByRole('group', { name: 'collections.labels.title' })).toBeInTheDocument();
  });
});
