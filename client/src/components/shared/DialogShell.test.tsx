// FE-COMP-DIALOGSHELL-001 to FE-COMP-DIALOGSHELL-020
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { resetBodyScrollLock } from '../../utils/bodyScrollLock';
import {
  DeleteButton,
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogShell,
  DialogTile,
  FooterSpacer,
  NEUTRAL_TINT,
  fs,
} from './DialogShell';

const onClose = vi.fn();

beforeEach(() => {
  onClose.mockClear();
  resetBodyScrollLock();
  document.body.style.overflow = '';
});

describe('fs', () => {
  it('FE-COMP-DIALOGSHELL-001: scales a size by the user\'s text size for its tier', () => {
    expect(fs(12)).toEqual({ fontSize: 'calc(12px * var(--fs-scale-caption, 1))' });
    expect(fs(20, 'subtitle')).toEqual({ fontSize: 'calc(20px * var(--fs-scale-subtitle, 1))' });
  });
});

describe('DialogShell', () => {
  it('FE-COMP-DIALOGSHELL-002: a dialog that is all head and foot has no body, and takes its width and alignment', () => {
    render(
      <DialogShell onClose={onClose} labelledBy="q-title" width="narrow" align="top"
        header={<DialogHeader tile={<DialogTile><span>i</span></DialogTile>} tint={NEUTRAL_TINT} labelId="q-title" onClose={onClose} title="Leave?" />}
        footer={<DialogFooter><DialogButton>Stay</DialogButton><FooterSpacer /><DialogButton variant="primary">Leave</DialogButton></DialogFooter>} />,
    );
    const dialog = screen.getByRole('dialog', { name: 'Leave?' });
    expect(dialog.className).toContain('max-w-[520px]');
    expect(document.querySelector('.trek-modal-backdrop')?.className).toContain('items-start');
    expect(dialog.querySelector('form')).toBeNull();
    expect(dialog.children).toHaveLength(2);
  });

  it('FE-COMP-DIALOGSHELL-003: a body class replaces the padded column, and a paste anywhere reaches the dialog', () => {
    const onPaste = vi.fn();
    render(
      <DialogShell onClose={onClose} labelledBy="p-title" width="xwide" bodyClassName="preview-body" onPaste={onPaste}
        header={<DialogHeader tile={null} tint={NEUTRAL_TINT} labelId="p-title" onClose={onClose} title="Preview" />}>
        <p>Document</p>
      </DialogShell>,
    );
    expect(screen.getByText('Document').parentElement?.className).toBe('preview-body');
    fireEvent.paste(screen.getByRole('dialog', { name: 'Preview' }));
    expect(onPaste).toHaveBeenCalledTimes(1);
  });
});

describe('DialogShell unsaved-changes question (#2253)', () => {
  function Editor() {
    const [name, setName] = useState('');
    return (
      <DialogShell onClose={onClose} labelledBy="e-title" discardGuard={{ name }}
        header={<DialogHeader tile={null} tint={NEUTRAL_TINT} labelId="e-title" onClose={onClose} title="Place" />}>
        <input aria-label="Name" value={name} onChange={e => setName(e.target.value)} />
      </DialogShell>
    );
  }
  const backdrop = () => document.querySelector('.trek-modal-backdrop') as HTMLElement;
  const clickBackdrop = () => { fireEvent.mouseDown(backdrop()); fireEvent.click(backdrop()); };

  it('FE-COMP-DIALOGSHELL-2253-1: an untouched editor closes on the backdrop straight away', () => {
    render(<Editor />);
    clickBackdrop();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-DIALOGSHELL-2253-2: after typing, the backdrop asks; keep editing stays, discard closes', async () => {
    const user = userEvent.setup();
    render(<Editor />);
    await user.type(screen.getByLabelText('Name'), 'Cafe');
    clickBackdrop();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Discard your changes?');
    await user.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Cafe');

    await user.keyboard('{Escape}');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    // Escape on the question only takes the question away.
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    clickBackdrop();
    await user.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-DIALOGSHELL-2253-3: typing back to where it started closes without asking', async () => {
    const user = userEvent.setup();
    render(<Editor />);
    await user.type(screen.getByLabelText('Name'), 'a');
    await user.clear(screen.getByLabelText('Name'));
    clickBackdrop();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('DialogHeader', () => {
  it('FE-COMP-DIALOGSHELL-004: a plain title is the heading the dialog is named by', () => {
    render(<DialogHeader tile={<DialogTile><span data-testid="tile-icon" /></DialogTile>} tint={NEUTRAL_TINT} labelId="t1" onClose={onClose} title="Export" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Export' })).toHaveAttribute('id', 't1');
    expect(screen.getByTestId('tile-icon')).toBeInTheDocument();
  });

  it('FE-COMP-DIALOGSHELL-005: a title with a click is a rename button, the eyebrow then names the dialog', async () => {
    const onTitleClick = vi.fn();
    render(<DialogHeader tile={null} tint={NEUTRAL_TINT} labelId="t2" onClose={onClose} eyebrow="Booking" title="Hotel Sakura" onTitleClick={onTitleClick} titleTooltip="Rename" />);
    expect(screen.getByRole('heading', { name: 'Booking' })).toHaveAttribute('id', 't2');
    const rename = screen.getByRole('button', { name: 'Hotel Sakura' });
    expect(rename).not.toHaveAttribute('id');
    await userEvent.click(rename);
    expect(onTitleClick).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-DIALOGSHELL-006: a rename button without a tooltip still works', async () => {
    const onTitleClick = vi.fn();
    render(<DialogHeader tile={null} tint={NEUTRAL_TINT} labelId="t3" onClose={onClose} title="Dinner" onTitleClick={onTitleClick} />);
    const rename = screen.getByRole('button', { name: 'Dinner' });
    expect(rename).toHaveAttribute('id', 't3');
    await userEvent.click(rename);
    expect(onTitleClick).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-DIALOGSHELL-007: Enter in the title field is spent there, other keys and the blur reach the caller', () => {
    const onKeyDown = vi.fn();
    const onBlur = vi.fn();
    const onChange = vi.fn();
    render(
      <DialogHeader tile={null} tint={NEUTRAL_TINT} labelId="t4" onClose={onClose}
        titleInput={{ value: 'Old', onChange, label: 'Title', required: true, maxLength: 40, onKeyDown, onBlur }} />,
    );
    const input = screen.getByRole('textbox', { name: 'Title' });
    expect(input).toHaveAttribute('id', 't4');
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('maxLength', '40');
    const enter = fireEvent.keyDown(input, { key: 'Enter' });
    expect(enter).toBe(false);
    const other = fireEvent.keyDown(input, { key: 'a' });
    expect(other).toBe(true);
    expect(onKeyDown).toHaveBeenCalledTimes(2);
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-DIALOGSHELL-008: the title field works without a key handler', () => {
    render(<DialogHeader tile={null} tint={NEUTRAL_TINT} labelId="t5" onClose={onClose} titleInput={{ value: '', onChange: vi.fn(), label: 'Name' }} />);
    expect(fireEvent.keyDown(screen.getByRole('textbox', { name: 'Name' }), { key: 'Enter' })).toBe(false);
  });

  it('FE-COMP-DIALOGSHELL-009: Close calls onClose, and the pills sit under the title', async () => {
    render(<DialogHeader tile={null} tint={NEUTRAL_TINT} labelId="t6" onClose={onClose} title="Stay" sub="Kyoto" pills={<span>3 nights</span>} />);
    expect(screen.getByText('Kyoto')).toBeInTheDocument();
    expect(screen.getByText('3 nights')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('body and footer parts', () => {
  it('FE-COMP-DIALOGSHELL-010: a section is labelled and can carry an action', async () => {
    const onAdd = vi.fn();
    render(
      <>
        <DialogSection label="Travelers" action={<button type="button" onClick={onAdd}>Add</button>} className="own"><p>Maria</p></DialogSection>
        <DialogSection label="Notes"><p>None</p></DialogSection>
      </>,
    );
    expect(screen.getByText('Travelers')).toBeInTheDocument();
    expect(screen.getByText('Maria').closest('section')?.className).toBe('own');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('FE-COMP-DIALOGSHELL-011: footer buttons are plain buttons by default, the primary one can submit', async () => {
    const onSave = vi.fn();
    render(
      <DialogFooter>
        <DialogButton icon={<span data-testid="btn-icon" />}>Cancel</DialogButton>
        <DialogButton active>On map</DialogButton>
        <DialogButton variant="primary" type="submit" onClick={onSave} disabled={false}>Save</DialogButton>
        <DialogButton disabled>Later</DialogButton>
      </DialogFooter>,
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('type', 'button');
    expect(screen.getByTestId('btn-icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'On map' }).className).toContain('bg-accent');
    expect(screen.getByRole('button', { name: 'Cancel' }).className).not.toContain('bg-accent');
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toHaveAttribute('type', 'submit');
    await userEvent.click(save);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Later' })).toBeDisabled();
  });

  it('FE-COMP-DIALOGSHELL-012: the delete button is named "Delete" unless told otherwise', async () => {
    const onDelete = vi.fn();
    const { rerender } = render(<DeleteButton onClick={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    rerender(<DeleteButton onClick={onDelete} label="Delete note" disabled />);
    expect(screen.getByRole('button', { name: 'Delete note' })).toBeDisabled();
  });

  it('FE-COMP-DIALOGSHELL-013: the neutral tint is a faint wash of the accent', () => {
    expect(NEUTRAL_TINT).toContain('var(--accent)');
  });
});

// #1303: Ctrl/Cmd+Enter saves a dialog from the keyboard.
describe('DialogShell Ctrl/Cmd+Enter', () => {
  /** Lets the deferred press run, so an assertion that nothing was pressed means it. */
  const settle = () => new Promise(resolve => setTimeout(resolve, 0));

  /** A note field that takes its value on blur, like a typed time, and a save that reads it. */
  function Editor({ onSave, onTitleKey, primaries = 1, saveDisabled = false, blocked = false, keepsCtrlEnter = false }: {
    onSave: (note: string) => void;
    onTitleKey?: () => void;
    primaries?: number;
    saveDisabled?: boolean;
    blocked?: boolean;
    keepsCtrlEnter?: boolean;
  }) {
    const [note, setNote] = useState('');
    const [draft, setDraft] = useState('');
    const [title, setTitle] = useState('');
    return (
      <DialogShell onClose={onClose} labelledBy="e-title" blocked={blocked}
        header={<DialogHeader tile={null} tint={NEUTRAL_TINT} labelId="e-title" onClose={onClose}
          titleInput={{ value: title, onChange: setTitle, label: 'Title', onKeyDown: e => { if (e.key === 'Enter') onTitleKey?.(); } }} />}
        footer={
          <DialogFooter>
            <DialogButton onClick={onClose}>Cancel</DialogButton>
            {Array.from({ length: primaries }, (_, i) => (
              <DialogButton key={i} variant="primary" disabled={saveDisabled} onClick={() => onSave(note)}>Save {i}</DialogButton>
            ))}
          </DialogFooter>
        }>
        <textarea aria-label="Note" value={draft} onChange={e => setDraft(e.target.value)} onBlur={() => setNote(draft)}
          data-keeps-ctrl-enter={keepsCtrlEnter || undefined} />
      </DialogShell>
    );
  }

  it('FE-COMP-DIALOGSHELL-014: the primary button is marked, the others are not', () => {
    render(
      <DialogFooter>
        <DialogButton>Cancel</DialogButton>
        <DialogButton variant="primary">Save</DialogButton>
      </DialogFooter>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('data-dialog-primary');
    expect(screen.getByRole('button', { name: 'Cancel' })).not.toHaveAttribute('data-dialog-primary');
  });

  it('FE-COMP-DIALOGSHELL-015: Ctrl+Enter in a field saves once, with the value the field commits on blur', async () => {
    const onSave = vi.fn();
    render(<Editor onSave={onSave} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Note' }), 'Bring the passports');
    await userEvent.keyboard('{Control>}{Enter}{/Control}');

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('Bring the passports'));
    await settle();
    expect(onSave).toHaveBeenCalledTimes(1);
    // Spent on the save: the textarea did not get a line break.
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveValue('Bring the passports');
  });

  it('FE-COMP-DIALOGSHELL-016: Cmd+Enter does the same, Enter alone and with Shift or Alt do not', async () => {
    const onSave = vi.fn();
    render(<Editor onSave={onSave} />);
    const note = screen.getByRole('textbox', { name: 'Note' });
    await userEvent.click(note);
    await userEvent.keyboard('{Enter}{Shift>}{Control>}{Enter}{/Control}{/Shift}{Alt>}{Control>}{Enter}{/Control}{/Alt}');
    await settle();
    expect(onSave).not.toHaveBeenCalled();

    await userEvent.click(note);
    await userEvent.keyboard('{Meta>}{Enter}{/Meta}');
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  });

  it('FE-COMP-DIALOGSHELL-017: a title that saves on Enter does not save a second time', async () => {
    const onSave = vi.fn();
    const onTitleKey = vi.fn();
    render(<Editor onSave={onSave} onTitleKey={onTitleKey} />);
    await userEvent.click(screen.getByRole('textbox', { name: 'Title' }));
    await userEvent.keyboard('{Control>}{Enter}{/Control}');

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onTitleKey).not.toHaveBeenCalled();
  });

  it('FE-COMP-DIALOGSHELL-018: a disabled primary saves nothing, and the field does not save in its place', async () => {
    const onSave = vi.fn();
    const onTitleKey = vi.fn();
    render(<Editor onSave={onSave} onTitleKey={onTitleKey} saveDisabled />);
    await userEvent.click(screen.getByRole('textbox', { name: 'Title' }));
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    await settle();

    expect(onSave).not.toHaveBeenCalled();
    expect(onTitleKey).not.toHaveBeenCalled();
  });

  it('FE-COMP-DIALOGSHELL-019: with no primary or two of them, the keys stay with the field', async () => {
    const onSave = vi.fn();
    const onTitleKey = vi.fn();
    const { rerender } = render(<Editor onSave={onSave} onTitleKey={onTitleKey} primaries={0} />);
    await userEvent.click(screen.getByRole('textbox', { name: 'Title' }));
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    rerender(<Editor onSave={onSave} onTitleKey={onTitleKey} primaries={2} />);
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    await settle();

    expect(onSave).not.toHaveBeenCalled();
    expect(onTitleKey).toHaveBeenCalledTimes(2);
  });

  it('FE-COMP-DIALOGSHELL-020: a field that keeps Ctrl+Enter, or a question open over the dialog, saves nothing', async () => {
    const onSave = vi.fn();
    const { rerender } = render(<Editor onSave={onSave} keepsCtrlEnter />);
    await userEvent.click(screen.getByRole('textbox', { name: 'Note' }));
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    rerender(<Editor onSave={onSave} blocked />);
    await userEvent.click(screen.getByRole('textbox', { name: 'Note' }));
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    await settle();

    expect(onSave).not.toHaveBeenCalled();
  });
});
