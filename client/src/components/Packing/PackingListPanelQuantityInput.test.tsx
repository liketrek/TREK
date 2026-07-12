// FE-COMP-PACKING-082 to FE-COMP-PACKING-083
import { vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../../../tests/helpers/render';
import { QuantityInput } from './PackingListPanelQuantityInput';

describe('QuantityInput', () => {
  it('FE-COMP-PACKING-082: selects the current value on focus so typing replaces it', async () => {
    render(<QuantityInput value={1} onSave={() => {}} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.focus(input);

    await waitFor(() => {
      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe(1);
    });
  });

  it('FE-COMP-PACKING-083: commits the typed quantity on blur', async () => {
    const onSave = vi.fn();
    render(<QuantityInput value={1} onSave={onSave} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '6' } });
    fireEvent.blur(input);

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(6));
  });

  it('FE-COMP-PACKING-084: #1513 focus-then-type replaces the value instead of appending to it', async () => {
    // The end-to-end shape of the bug: with the caret parked at the end, typing 6 over a
    // quantity of 1 committed 16. Selecting on focus makes the keystroke overwrite.
    const onSave = vi.fn();
    render(<QuantityInput value={1} onSave={onSave} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.focus(input);
    await waitFor(() => expect(input.selectionEnd).toBe(1));

    // A selected value means the browser replaces it — simulate the resulting input event.
    fireEvent.change(input, { target: { value: '6' } });
    fireEvent.blur(input);

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(6));
    expect(onSave).not.toHaveBeenCalledWith(16);
  });
});
