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
});
