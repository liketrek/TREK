import { render, screen, fireEvent } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog';
import Modal from './Modal';

describe('ConfirmDialog', () => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    onConfirm.mockClear();
  });

  it('FE-COMP-CONFIRM-001: does not render when isOpen is false', () => {
    render(
      <ConfirmDialog isOpen={false} onClose={onClose} onConfirm={onConfirm} message="Are you sure?" />
    );
    expect(screen.queryByText('Are you sure?')).toBeNull();
  });

  it('FE-COMP-CONFIRM-002: renders with default title "Confirm" and message', () => {
    render(
      <ConfirmDialog isOpen={true} onClose={onClose} onConfirm={onConfirm} message="Are you sure?" />
    );
    expect(screen.getByText('Confirm')).toBeTruthy();
    expect(screen.getByText('Are you sure?')).toBeTruthy();
  });

  it('FE-COMP-CONFIRM-003: renders custom title and message', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Remove item"
        message="This cannot be undone."
      />
    );
    expect(screen.getByText('Remove item')).toBeTruthy();
    expect(screen.getByText('This cannot be undone.')).toBeTruthy();
  });

  it('FE-COMP-CONFIRM-004: Cancel button calls onClose', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog isOpen={true} onClose={onClose} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('FE-COMP-CONFIRM-005: Confirm button calls onConfirm and onClose', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog isOpen={true} onClose={onClose} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('FE-COMP-CONFIRM-006: custom button labels render correctly', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        confirmLabel="Yes, remove"
        cancelLabel="Go back"
      />
    );
    expect(screen.getByRole('button', { name: 'Yes, remove' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy();
  });

  it('FE-COMP-CONFIRM-007: Escape key calls onClose', () => {
    render(<ConfirmDialog isOpen={true} onClose={onClose} onConfirm={onConfirm} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('FE-COMP-CONFIRM-009: a rejecting async onConfirm does not escape as an unhandled rejection', async () => {
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    const failing = vi.fn(() => Promise.reject(new Error('delete failed')));

    render(<ConfirmDialog isOpen={true} onClose={onClose} onConfirm={failing} />);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(failing).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
    expect(unhandled).not.toHaveBeenCalled();
    process.off('unhandledRejection', unhandled);
  });

  it('FE-COMP-CONFIRM-010: extra content renders under the message, and the card widens for it', () => {
    render(
      <ConfirmDialog isOpen={true} onClose={onClose} onConfirm={onConfirm} message="Delete it?">
        <ul aria-label="consequences"><li>Stay at Harbour Hotel</li></ul>
      </ConfirmDialog>
    );
    const list = screen.getByRole('list', { name: 'consequences' });
    expect(list).toHaveTextContent('Stay at Harbour Hotel');
    expect(screen.getByText('Delete it?').compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.querySelector('.max-w-md')).not.toBeNull();
  });

  it('FE-COMP-CONFIRM-011: Escape takes back the question only, not the dialog it was asked from', () => {
    const closeModal = vi.fn();
    render(
      <>
        <Modal isOpen={true} onClose={closeModal} title="Reorder days">rows</Modal>
        <ConfirmDialog isOpen={true} onClose={onClose} onConfirm={onConfirm} message="Delete it?" />
      </>
    );
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    expect(closeModal).not.toHaveBeenCalled();
    // Other keys pass through untouched.
    fireEvent.keyDown(document.body, { key: 'Enter' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('FE-COMP-CONFIRM-012: the danger look comes from the danger tokens, the plain one from the accent', () => {
    const { unmount } = render(<ConfirmDialog isOpen={true} onClose={onClose} onConfirm={onConfirm} />);
    expect(screen.getByRole('button', { name: /delete/i })).toHaveClass('bg-danger');
    expect(document.querySelector('.bg-danger-soft')).not.toBeNull();
    unmount();
    render(<ConfirmDialog isOpen={true} onClose={onClose} onConfirm={onConfirm} danger={false} confirmLabel="Keep" />);
    expect(screen.getByRole('button', { name: 'Keep' })).toHaveClass('bg-accent', 'text-accent-text');
    expect(document.querySelector('.bg-danger-soft')).toBeNull();
  });

  it('FE-COMP-CONFIRM-013: a long list scrolls inside the card, and the buttons stay outside it, always in reach', () => {
    render(
      <ConfirmDialog isOpen={true} onClose={onClose} onConfirm={onConfirm} message="Delete it?">
        <ul aria-label="consequences">{Array.from({ length: 40 }, (_, i) => <li key={i}>Row {i}</li>)}</ul>
      </ConfirmDialog>
    );
    const scroller = screen.getByRole('list', { name: 'consequences' }).closest('.overflow-y-auto') as HTMLElement;
    expect(scroller).not.toBeNull();
    expect(scroller.parentElement).toHaveClass('flex-col');
    expect(scroller.parentElement!.className).toMatch(/max-h-\[/);
    const confirm = screen.getByRole('button', { name: /delete/i });
    expect(scroller.contains(confirm)).toBe(false);
    expect(confirm.parentElement).toHaveClass('flex-none');
  });

  it('FE-COMP-CONFIRM-008: clicking backdrop calls onClose', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog isOpen={true} onClose={onClose} onConfirm={onConfirm} message="msg" />);
    // The outermost fixed div is the backdrop — click outside the card
    const backdrop = document.querySelector('.fixed') as HTMLElement;
    // fireEvent click on the backdrop element directly
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
