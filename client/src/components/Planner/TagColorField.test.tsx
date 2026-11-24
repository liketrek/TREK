// FE-PLANNER-TAGCOLORFIELD-001 to FE-PLANNER-TAGCOLORFIELD-003: the custom colour of the tag palette.
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { TagColorField } from './TagColorField';

const t = (key: string) => key;

function renderField(value = '#ff0000') {
  const onPreview = vi.fn();
  const onPick = vi.fn();
  render(<TagColorField value={value} onPreview={onPreview} onPick={onPick} t={t} />);
  return { onPreview, onPick };
}

describe('TagColorField', () => {
  it('FE-PLANNER-TAGCOLORFIELD-001: a complete typed code is shown at once and kept on Enter; a broken one goes back', () => {
    const { onPreview, onPick } = renderField();
    const code = screen.getByRole('textbox', { name: 'places.tagColorHex' });
    expect(code).toHaveValue('#ff0000');
    fireEvent.change(code, { target: { value: '#10b9' } });
    expect(onPreview).not.toHaveBeenCalled();
    fireEvent.change(code, { target: { value: '10b981' } });
    expect(onPreview).toHaveBeenLastCalledWith('#10b981');
    fireEvent.keyDown(code, { key: 'Enter' });
    expect(onPick).toHaveBeenLastCalledWith('#10b981');

    fireEvent.change(code, { target: { value: 'nope' } });
    fireEvent.blur(code);
    expect(code).toHaveValue('#10b981');
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it('FE-PLANNER-TAGCOLORFIELD-002: the arrow keys move the field and the hue, and keep each step', () => {
    const { onPick } = renderField('#ff0000');
    const field = screen.getByRole('slider', { name: 'places.tagColorCustom' });
    fireEvent.keyDown(field, { key: 'ArrowDown' });
    // Full red, a little darker.
    expect(onPick).toHaveBeenLastCalledWith('#f50000');
    const hue = screen.getByRole('slider', { name: 'places.tagColorHue' });
    expect(hue).toHaveAttribute('aria-valuenow', '0');
    fireEvent.keyDown(hue, { key: 'ArrowRight' });
    expect(hue).toHaveAttribute('aria-valuenow', '6');
    fireEvent.keyDown(hue, { key: 'Tab' });
    expect(onPick).toHaveBeenCalledTimes(2);
  });

  it('FE-PLANNER-TAGCOLORFIELD-003: a drag shows the colour as it goes and keeps the one it ends on', () => {
    const { onPreview, onPick } = renderField('#ff0000');
    const field = screen.getByRole('slider', { name: 'places.tagColorCustom' });
    field.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    field.setPointerCapture = vi.fn();
    field.releasePointerCapture = vi.fn();
    field.hasPointerCapture = () => true;
    fireEvent.pointerDown(field, { pointerId: 1, clientX: 100, clientY: 0 });
    fireEvent.pointerMove(field, { pointerId: 1, clientX: 0, clientY: 0 });
    expect(onPreview).toHaveBeenLastCalledWith('#ffffff');
    expect(onPick).not.toHaveBeenCalled();
    fireEvent.pointerUp(field, { pointerId: 1, clientX: 0, clientY: 100 });
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenLastCalledWith('#000000');
  });
});
