// FE-PLANNER-EDITORPARTS-001 to FE-PLANNER-EDITORPARTS-011
import { useState } from 'react';
import { render, screen, fireEvent } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { PillSelect, Segmented, EditorField, AddRowButton } from './dialogParts';

type Kind = 'flight' | 'train' | 'bus' | 'transit';

const OPTIONS = [
  { value: 'flight' as const, label: 'Flight', icon: <span data-testid="icon-flight" /> },
  { value: 'train' as const, label: 'Train' },
  { value: 'bus' as const, label: 'Bus' },
];

function Picker({ initial = 'train', onChange = vi.fn() }: { initial?: Kind; onChange?: (v: Kind) => void }) {
  const [value, setValue] = useState<Kind>(initial);
  return (
    <PillSelect<Kind>
      label="Booking Type"
      value={value}
      options={OPTIONS}
      onChange={v => { setValue(v); onChange(v); }}
      fallback={{ label: 'Transit', icon: <span data-testid="icon-fallback" /> }}
    />
  );
}

const pill = () => screen.getByRole('button', { name: /^Booking Type:/ });
const list = () => screen.queryByRole('group', { name: 'Booking Type' });
const option = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}$`) });

describe('PillSelect', () => {
  it('FE-PLANNER-EDITORPARTS-001: the pill names what is picked and the value, and claims no menu', () => {
    render(<Picker />);
    expect(pill()).toHaveAccessibleName(/^Booking Type: ?Train$/);
    expect(pill()).toHaveAttribute('aria-expanded', 'false');
    expect(pill()).not.toHaveAttribute('aria-haspopup');
    expect(list()).toBeNull();
  });

  it('FE-PLANNER-EDITORPARTS-002: opening shows the list as a named group and puts the focus on the current choice', async () => {
    render(<Picker />);
    await userEvent.click(pill());
    expect(list()).toBeInTheDocument();
    expect(screen.queryByRole('menu')).toBeNull();
    expect(pill()).toHaveAttribute('aria-expanded', 'true');
    expect(pill()).toHaveAttribute('aria-controls', list()!.id);
    expect(option('Train')).toHaveFocus();
  });

  it('FE-PLANNER-EDITORPARTS-003: picking reports the value, closes the list and returns to the pill', async () => {
    const onChange = vi.fn();
    render(<Picker onChange={onChange} />);
    await userEvent.click(pill());
    await userEvent.click(option('Bus'));
    expect(onChange).toHaveBeenCalledWith('bus');
    expect(list()).toBeNull();
    expect(pill()).toHaveAccessibleName(/^Booking Type: ?Bus$/);
    expect(pill()).toHaveFocus();
  });

  it('FE-PLANNER-EDITORPARTS-004: Escape closes only the list, a dialog listening on the document never hears it', async () => {
    const dialogEscape = vi.fn();
    document.addEventListener('keydown', dialogEscape);
    try {
      render(<Picker />);
      await userEvent.click(pill());
      await userEvent.keyboard('{Escape}');
      expect(list()).toBeNull();
      expect(dialogEscape).not.toHaveBeenCalled();
      expect(pill()).toHaveFocus();

      // With the list closed the next Escape is the dialog's again.
      await userEvent.keyboard('{Escape}');
      expect(dialogEscape).toHaveBeenCalledOnce();
    } finally {
      document.removeEventListener('keydown', dialogEscape);
    }
  });

  it('FE-PLANNER-EDITORPARTS-005: a press outside closes the list, a press inside does not', async () => {
    render(<><Picker /><p>elsewhere</p></>);
    await userEvent.click(pill());
    fireEvent.mouseDown(option('Bus'));
    expect(list()).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText('elsewhere'));
    expect(list()).toBeNull();
  });

  it('FE-PLANNER-EDITORPARTS-006: a second click on the pill closes the list', async () => {
    render(<Picker />);
    await userEvent.click(pill());
    await userEvent.click(pill());
    expect(list()).toBeNull();
  });

  it('FE-PLANNER-EDITORPARTS-007: the arrow keys, Home and End walk the list and wrap around', async () => {
    render(<Picker initial="flight" />);
    await userEvent.click(pill());
    expect(option('Flight')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(option('Train')).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(option('Bus')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(option('Flight')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(option('Bus')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(option('Flight')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(list()).toBeNull();
    expect(pill()).toHaveAccessibleName(/^Booking Type: ?Flight$/);
  });

  it('FE-PLANNER-EDITORPARTS-008: Tab closes the list and goes on from the pill', async () => {
    render(<Picker />);
    await userEvent.click(pill());
    fireEvent.keyDown(option('Train'), { key: 'Tab' });
    expect(list()).toBeNull();
    expect(pill()).toHaveFocus();
  });

  it('FE-PLANNER-EDITORPARTS-009: a value none of the options holds shows the fallback, and the list opens on the first option', async () => {
    render(<Picker initial="transit" />);
    expect(pill()).toHaveAccessibleName(/^Booking Type: ?Transit$/);
    expect(screen.getByTestId('icon-fallback')).toBeInTheDocument();
    await userEvent.click(pill());
    expect(option('Flight')).toHaveFocus();
    expect(screen.getByTestId('icon-flight')).toBeInTheDocument();
  });
});

describe('editor fields', () => {
  it('FE-PLANNER-EDITORPARTS-010: Segmented marks the chosen option and reports a new one', async () => {
    const onChange = vi.fn();
    render(<Segmented label="Mode" value="manual" onChange={onChange} options={[{ value: 'manual', label: 'Manual' }, { value: 'automated', label: 'Automated' }]} />);
    expect(screen.getByRole('group', { name: 'Mode' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manual' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Automated' }));
    expect(onChange).toHaveBeenCalledWith('automated');
  });

  it('FE-PLANNER-EDITORPARTS-011: EditorField shows an error in place of its hint, and AddRowButton adds', async () => {
    const onAdd = vi.fn();
    const { rerender } = render(<EditorField label="Seat" htmlFor="seat" hint="Optional"><input id="seat" /></EditorField>);
    expect(screen.getByLabelText('Seat')).toBeInTheDocument();
    expect(screen.getByText('Optional')).toBeInTheDocument();
    rerender(<EditorField label="Seat" htmlFor="seat" hint="Optional" error="Taken"><input id="seat" /></EditorField>);
    expect(screen.getByText('Taken')).toBeInTheDocument();
    expect(screen.queryByText('Optional')).toBeNull();

    render(<AddRowButton onClick={onAdd}>Add stop</AddRowButton>);
    await userEvent.click(screen.getByRole('button', { name: 'Add stop' }));
    expect(onAdd).toHaveBeenCalledOnce();
  });
});
