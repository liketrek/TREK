// FE-PLANNER-BULKCAT-001 to FE-PLANNER-BULKCAT-004
import { render, screen, fireEvent } from '../../../tests/helpers/render';
import { buildCategory } from '../../../tests/helpers/factories';
import { PlacesBulkCategoryModal, CategoryTile } from './PlacesBulkCategoryModal';

const CATS = [buildCategory({ id: 1, name: 'Museum', color: '#3b82f6' }), buildCategory({ id: 2, name: 'Food', color: null })];

describe('PlacesBulkCategoryModal', () => {
  it('FE-PLANNER-BULKCAT-001: names the dialog and says how many places it changes', () => {
    render(<PlacesBulkCategoryModal count={3} categories={CATS} onPick={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'Change category' })).toBeInTheDocument();
    expect(screen.getByText('3 selected')).toBeInTheDocument();
  });

  it('FE-PLANNER-BULKCAT-002: a category row applies that category', () => {
    const onPick = vi.fn();
    render(<PlacesBulkCategoryModal count={1} categories={CATS} onPick={onPick} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Food' }));
    expect(onPick).toHaveBeenCalledWith(2);
  });

  it('FE-PLANNER-BULKCAT-003: "No Category" clears it, even with no categories to offer', () => {
    const onPick = vi.fn();
    render(<PlacesBulkCategoryModal count={1} categories={[]} onPick={onPick} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'No Category' }));
    expect(onPick).toHaveBeenCalledWith(null);
  });

  it('FE-PLANNER-BULKCAT-004: Cancel, the X and Escape close without picking', () => {
    const onPick = vi.fn();
    const onClose = vi.fn();
    render(<PlacesBulkCategoryModal count={1} categories={CATS} onPick={onPick} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(3);
    expect(onPick).not.toHaveBeenCalled();
  });
});

describe('CategoryTile', () => {
  it('FE-PLANNER-BULKCAT-005: tints with the category colour, and falls back to the neutral pin without one', () => {
    const { container, rerender } = render(<CategoryTile category={{ icon: 'MapPin', color: '#3b82f6' }} size={20} />);
    const tile = container.firstChild as HTMLElement;
    expect(tile.style.width).toBe('20px');
    expect(tile.style.background).toContain('color-mix');

    rerender(<CategoryTile />);
    expect((container.firstChild as HTMLElement).className).toContain('bg-surface-tertiary');
  });
});
