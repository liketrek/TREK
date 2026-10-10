// FE-PLANNER-BOOKINGSHELL-001 to FE-PLANNER-BOOKINGSHELL-016
import type { FormEvent, ReactNode } from 'react';
import { render, screen, fireEvent } from '../../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { resetBodyScrollLock } from '../../../utils/bodyScrollLock';
import { BookingDialogHeader, StatusPill } from './BookingDialogShell';
import { DialogShell, type DialogShellProps } from '../../shared/DialogShell';

const onClose = vi.fn();

function Shell(props: Partial<DialogShellProps>) {
  return (
    <DialogShell
      onClose={onClose}
      labelledBy="shell-title"
      header={<BookingDialogHeader tone="pending" type="flight" labelId="shell-title" onClose={onClose} title="LH 123" />}
      {...props}
    >
      {props.children ?? <p>inner content</p>}
    </DialogShell>
  );
}

// An opener in the page, and the dialog it opens.
function Page({ open, children }: { open: boolean; children?: ReactNode }) {
  return (
    <>
      <button type="button">Opener</button>
      <Shell open={open}>{children}</Shell>
    </>
  );
}

const backdrop = () => document.querySelector('.trek-modal-backdrop') as HTMLElement;

beforeEach(() => {
  onClose.mockClear();
  resetBodyScrollLock();
  document.body.style.overflow = '';
});

describe('BookingDialogShell', () => {
  it('FE-PLANNER-BOOKINGSHELL-001: renders nothing while open is false', () => {
    render(<Shell open={false} />);
    expect(screen.queryByText('inner content')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('FE-PLANNER-BOOKINGSHELL-002: is a dialog named by its header, without aria-modal so portaled lists stay reachable', () => {
    render(<Shell />);
    const dialog = screen.getByRole('dialog', { name: 'LH 123' });
    expect(dialog).not.toHaveAttribute('aria-modal');
    expect(dialog).toHaveTextContent('inner content');
  });

  it('FE-PLANNER-BOOKINGSHELL-003: Escape calls onClose', () => {
    render(<Shell />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('FE-PLANNER-BOOKINGSHELL-004: Escape leaves the dialog alone while blocked', () => {
    render(<Shell blocked />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-BOOKINGSHELL-005: an Escape a field inside already handled does not close', () => {
    render(<Shell><input aria-label="Field" onKeyDown={e => { if (e.key === 'Escape') e.preventDefault(); }} /></Shell>);
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Field' }), { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-BOOKINGSHELL-006: the header Close button calls onClose', async () => {
    render(<Shell />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('FE-PLANNER-BOOKINGSHELL-007: a press that starts and ends on the backdrop closes', () => {
    render(<Shell />);
    fireEvent.mouseDown(backdrop());
    fireEvent.click(backdrop());
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('FE-PLANNER-BOOKINGSHELL-008: a press that starts in the panel and ends on the backdrop does not close', () => {
    render(<Shell />);
    fireEvent.mouseDown(screen.getByText('inner content'));
    fireEvent.click(backdrop());
    expect(onClose).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-BOOKINGSHELL-009: a click inside the panel does not close', async () => {
    render(<Shell />);
    await userEvent.click(screen.getByText('inner content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-BOOKINGSHELL-010: the backdrop leaves the dialog alone while blocked', () => {
    render(<Shell blocked />);
    fireEvent.mouseDown(backdrop());
    fireEvent.click(backdrop());
    expect(onClose).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-BOOKINGSHELL-011: the panel takes the focus, and the opener gets it back on close', () => {
    const { rerender } = render(<Page open={false} />);
    const opener = screen.getByRole('button', { name: 'Opener' });
    opener.focus();

    rerender(<Page open />);
    expect(screen.getByRole('dialog')).toHaveFocus();

    rerender(<Page open={false} />);
    expect(opener).toHaveFocus();
  });

  it('FE-PLANNER-BOOKINGSHELL-012: a field with autoFocus keeps the focus, and the opener still gets it back', () => {
    const { rerender } = render(<Page open={false} />);
    const opener = screen.getByRole('button', { name: 'Opener' });
    opener.focus();

    rerender(<Page open><input aria-label="Title" autoFocus /></Page>);
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveFocus();

    rerender(<Page open={false} />);
    expect(opener).toHaveFocus();
  });

  it('FE-PLANNER-BOOKINGSHELL-013: locks the page scroll while open and releases it on close', () => {
    const { rerender } = render(<Shell />);
    expect(document.body.style.overflow).toBe('hidden');
    rerender(<Shell open={false} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('FE-PLANNER-BOOKINGSHELL-014: with onSubmit the body is a form', () => {
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
    render(<Shell onSubmit={onSubmit}><button type="submit">Send</button></Shell>);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});

describe('BookingDialogHeader', () => {
  it('FE-PLANNER-BOOKINGSHELL-015: a sub ends in an ellipsis unless it is allowed to wrap', () => {
    const { rerender } = render(<BookingDialogHeader tone="transit" type="transit" labelId="h" onClose={onClose} title="Public transit" sub="A long hint" />);
    expect(screen.getByText('A long hint')).toHaveClass('truncate');
    rerender(<BookingDialogHeader tone="transit" type="transit" labelId="h" onClose={onClose} title="Public transit" sub="A long hint" subWraps />);
    expect(screen.getByText('A long hint')).not.toHaveClass('truncate');
    expect(screen.getByText('A long hint')).toHaveClass('break-words');
  });

  it('FE-PLANNER-BOOKINGSHELL-016: the title input and the status pill report their changes', async () => {
    const onTitle = vi.fn();
    const onToggle = vi.fn();
    render(
      <BookingDialogHeader
        tone="pending" type="flight" labelId="h" onClose={onClose} eyebrow="Add transport"
        titleInput={{ value: '', onChange: onTitle, label: 'Title', placeholder: 'e.g. LH 123' }}
        pills={<StatusPill status="pending" onToggle={onToggle} />}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Add transport' })).toHaveAttribute('id', 'h');
    fireEvent.change(screen.getByRole('textbox', { name: 'Title' }), { target: { value: 'LH 9' } });
    expect(onTitle).toHaveBeenCalledWith('LH 9');
    await userEvent.click(screen.getByRole('button', { name: 'Set to Confirmed' }));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
