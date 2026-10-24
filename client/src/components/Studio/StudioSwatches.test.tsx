import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render } from '../../../tests/helpers/render';
import { AlphaSlider } from './StudioSwatches';

/**
 * The opacity slider: a move is shown while it is made and committed once
 * when it is let go, and a key let go on it that moved nothing (the Tab that
 * brought the focus there) commits nothing, whatever value it last moved to.
 */

function slider(value: number) {
  const onChange = vi.fn();
  const view = render(<AlphaSlider color="#112233" value={value} onChange={onChange} label="Opacity" />);
  const input = view.getByLabelText('Opacity') as HTMLInputElement;
  return { ...view, onChange, input };
}

describe('the opacity slider', () => {
  it('commits nothing when the focus arrives on it with Tab', () => {
    const { input, onChange } = slider(1);
    fireEvent.keyUp(input, { key: 'Tab' });
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('commits an arrow key once, at the value it moved to', () => {
    const { input, onChange } = slider(1);
    fireEvent.keyDown(input, { key: 'ArrowLeft' });
    fireEvent.change(input, { target: { value: '99' } });
    fireEvent.keyUp(input, { key: 'ArrowLeft' });
    fireEvent.keyUp(input, { key: 'Tab' });
    expect(onChange.mock.calls).toEqual([
      [0.99, false],
      [0.99, true],
    ]);
  });

  it('does not take an old move to a value given since', () => {
    const { input, onChange, rerender } = slider(0.4);
    fireEvent.pointerDown(input);
    fireEvent.change(input, { target: { value: '30' } });
    fireEvent.pointerUp(input);
    expect(onChange).toHaveBeenLastCalledWith(0.3, true);
    onChange.mockClear();
    // The same slider, now showing another colour's opacity: tabbing onto it changes nothing.
    rerender(<AlphaSlider color="#112233" value={1} onChange={onChange} label="Opacity" />);
    fireEvent.keyUp(input, { key: 'Tab' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('commits a move the focus leaves before any key or pointer is let go', () => {
    const { input, onChange } = slider(1);
    fireEvent.keyDown(input, { key: 'ArrowLeft' });
    fireEvent.change(input, { target: { value: '80' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith(0.8, true);
  });
});
