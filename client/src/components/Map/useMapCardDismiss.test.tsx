import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '../../../tests/helpers/render';
import { PillSelect } from '../shared/dialogParts';
import { useMapCardDismiss } from './useMapCardDismiss';

// FE-MAP-CARD-DISMISS-001 to FE-MAP-CARD-DISMISS-004

const OPTIONS = [
  { value: 'a', label: 'First' },
  { value: 'b', label: 'Last' },
];

/** A card over the map with a pick list in it, as the place card has its position. */
function Card({ onClose, onOutsidePress }: { onClose: () => void; onOutsidePress?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState('a');
  useMapCardDismiss(ref, true, onClose, onOutsidePress);
  return (
    <>
      <div ref={ref} data-testid="card">
        <PillSelect label="Position" value={value} options={OPTIONS} onChange={setValue} />
        <span data-testid="value">{value}</span>
      </div>
      <button type="button">elsewhere</button>
    </>
  );
}

describe('useMapCardDismiss', () => {
  it('FE-MAP-CARD-DISMISS-001: a press inside the card leaves it open', () => {
    const onClose = vi.fn();
    render(<Card onClose={onClose} />);
    fireEvent.pointerDown(screen.getByTestId('value'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('FE-MAP-CARD-DISMISS-002: picking from a list the card opened is no press outside, whichever option it is', () => {
    const onClose = vi.fn();
    const onOutsidePress = vi.fn();
    render(<Card onClose={onClose} onOutsidePress={onOutsidePress} />);
    fireEvent.click(within(screen.getByTestId('card')).getByRole('button', { name: /Position/ }));
    const list = screen.getByRole('group', { name: 'Position' });
    // The list is laid over the page, outside the card.
    expect(screen.getByTestId('card')).not.toContainElement(list);
    const last = within(list).getByRole('button', { name: 'Last' });
    fireEvent.pointerDown(last);
    fireEvent.mouseDown(last);
    fireEvent.click(last);
    expect(onClose).not.toHaveBeenCalled();
    expect(onOutsidePress).not.toHaveBeenCalled();
    expect(screen.getByTestId('value')).toHaveTextContent('b');
  });

  it('FE-MAP-CARD-DISMISS-003: a press outside both closes the card and is handed on', () => {
    const onClose = vi.fn();
    const onOutsidePress = vi.fn();
    render(<Card onClose={onClose} onOutsidePress={onOutsidePress} />);
    fireEvent.click(within(screen.getByTestId('card')).getByRole('button', { name: /Position/ }));
    fireEvent.pointerDown(screen.getByRole('button', { name: 'elsewhere' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOutsidePress).toHaveBeenCalledTimes(1);
  });

  it('FE-MAP-CARD-DISMISS-004: Escape closes the open list first and the card only on the next one', () => {
    const onClose = vi.fn();
    render(<Card onClose={onClose} />);
    fireEvent.click(within(screen.getByTestId('card')).getByRole('button', { name: /Position/ }));
    fireEvent.keyDown(screen.getByRole('group', { name: 'Position' }), { key: 'Escape' });
    expect(screen.queryByRole('group', { name: 'Position' })).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
