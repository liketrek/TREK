// FE-COMP-PACKEDCOUNTER-001 to FE-COMP-PACKEDCOUNTER-003 (#2296)
import { vi } from 'vitest';
import { render, screen, fireEvent } from '../../../tests/helpers/render';
import { PackedCounter } from './PackingPackedCounter';
import { packedOf } from './packingListPanel.helpers';

describe('PackedCounter', () => {
  it('FE-COMP-PACKEDCOUNTER-001: shows the count and steps it both ways', () => {
    const onChange = vi.fn();
    render(<PackedCounter packed={3} quantity={10} onChange={onChange} />);
    expect(screen.getByText('3/10')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '3 of 10 packed' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Pack one more' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pack one less' }));
    expect(onChange.mock.calls).toEqual([[4], [2]]);
  });

  it('FE-COMP-PACKEDCOUNTER-002: stops at nothing and at all of it', () => {
    const { rerender } = render(<PackedCounter packed={0} quantity={2} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Pack one less' })).toBeDisabled();
    rerender(<PackedCounter packed={2} quantity={2} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Pack one more' })).toBeDisabled();
  });

  it('FE-COMP-PACKEDCOUNTER-003: a ticked item reads as fully packed', () => {
    expect(packedOf({ checked: 1, quantity: 4, packed_quantity: null })).toBe(4);
    expect(packedOf({ checked: 0, quantity: 4, packed_quantity: 3 })).toBe(3);
    expect(packedOf({ checked: 0 })).toBe(0);
  });
});
