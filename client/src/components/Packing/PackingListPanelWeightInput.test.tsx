// FE-COMP-PACKING-095 to FE-COMP-PACKING-098
import { useState } from 'react';
import { vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import { WeightInput } from './PackingListPanelWeightInput';

/** A row whose stored weight changes only once a save answers, as the store does. */
function SlowRow({ onSave, onStored }: { onSave: (grams: number | null) => void; onStored: () => void }) {
  const [stored, setStored] = useState<number | null>(null);
  return (
    <WeightInput
      value={stored}
      width={36}
      onSave={(grams) => {
        onSave(grams);
        setTimeout(() => {
          setStored(grams);
          onStored();
        }, 300);
      }}
    />
  );
}

describe('WeightInput', () => {
  it('FE-COMP-PACKING-095: #3005 keeps every typed digit and saves the whole weight once', async () => {
    const onSave = vi.fn();
    const onStored = vi.fn();
    render(<SlowRow onSave={onSave} onStored={onStored} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.focus(input);
    for (const typed of ['2', '25', '250']) {
      fireEvent.change(input, { target: { value: typed } });
      expect(input.value).toBe(typed);
    }
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.blur(input);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(250);
    // Wait for the save to answer, so its update lands while the test still runs.
    await waitFor(() => expect(onStored).toHaveBeenCalled());
    expect(input.value).toBe('250');
  });

  it('FE-COMP-PACKING-096: saves on Enter and stores an empty field as no weight', () => {
    const onSave = vi.fn();
    render(<WeightInput value={300} width={36} onSave={onSave} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    input.focus();
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSave).toHaveBeenCalledWith(null);
  });

  it('FE-COMP-PACKING-097: leaves an unchanged weight alone and follows a change from elsewhere', () => {
    const onSave = vi.fn();
    const { rerender } = render(<WeightInput value={300} width={36} onSave={onSave} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onSave).not.toHaveBeenCalled();

    rerender(<WeightInput value={450} width={36} onSave={onSave} />);
    expect(input.value).toBe('450');
  });

  it('FE-COMP-PACKING-098: a read-only field never saves', () => {
    const onSave = vi.fn();
    render(<WeightInput value={300} width={36} readOnly onSave={onSave} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '9' } });
    fireEvent.blur(input);

    expect(onSave).not.toHaveBeenCalled();
  });
});
