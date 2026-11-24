import { render, screen, fireEvent } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';
import ConfirmDialog from './ConfirmDialog';
import Modal from './Modal';
import { askNatively, canAskNatively } from '../../native/nativeDialogs';

vi.mock('../../native/nativeDialogs', () => ({ canAskNatively: vi.fn(() => false), askNatively: vi.fn() }));

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

  describe('on a phone', () => {
    const desktopWidth = window.innerWidth;
    beforeEach(() => { Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 }); });
    afterEach(() => { Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: desktopWidth }); });

    it('FE-COMP-CONFIRM-014: the phone card answers like the desktop one, and a tap on it does not close it', async () => {
      const user = userEvent.setup();
      render(<ConfirmDialog isOpen onClose={onClose} onConfirm={onConfirm} title="Delete note?" message="It is gone for good." confirmLabel="Remove" />);
      await user.click(screen.getByText('It is gone for good.'));
      expect(onClose).not.toHaveBeenCalled();
      await user.click(screen.getByRole('button', { name: 'Remove' }));
      expect(onConfirm).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('FE-COMP-CONFIRM-015: the phone card without danger uses the accent and the default labels', async () => {
      const user = userEvent.setup();
      render(<ConfirmDialog isOpen onClose={onClose} onConfirm={onConfirm} message="Leave?" danger={false}><p>More</p></ConfirmDialog>);
      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('More')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('bg-accent');
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onClose).toHaveBeenCalledOnce();
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('in the app, the system asks', () => {
    afterEach(() => {
      vi.mocked(canAskNatively).mockReturnValue(false);
      vi.mocked(askNatively).mockReset();
    });

    it('FE-COMP-CONFIRM-NATIVE-001: asks once through the system, with the action in red, and confirms on yes', async () => {
      vi.mocked(canAskNatively).mockReturnValue(true);
      vi.mocked(askNatively).mockResolvedValue(true);
      render(<ConfirmDialog isOpen onClose={onClose} onConfirm={onConfirm} title="Delete place" message="Gone for good." />);
      await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
      expect(onConfirm).toHaveBeenCalledOnce();
      expect(askNatively).toHaveBeenCalledTimes(1);
      expect(askNatively).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Delete place', message: 'Gone for good.', danger: true }),
      );
      expect(screen.queryByText('Gone for good.')).toBeNull();
    });

    it('FE-COMP-CONFIRM-NATIVE-002: a no only closes', async () => {
      vi.mocked(canAskNatively).mockReturnValue(true);
      vi.mocked(askNatively).mockResolvedValue(false);
      render(<ConfirmDialog isOpen onClose={onClose} onConfirm={onConfirm} message="Sure?" />);
      await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('FE-COMP-CONFIRM-NATIVE-003: falls back to the HTML card when the system cannot ask', async () => {
      vi.mocked(canAskNatively).mockReturnValue(true);
      vi.mocked(askNatively).mockResolvedValue(null);
      render(<ConfirmDialog isOpen onClose={onClose} onConfirm={onConfirm} message="Sure?" />);
      expect(await screen.findByText('Sure?')).toBeTruthy();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('FE-COMP-CONFIRM-NATIVE-004: keeps a question with a list under it in HTML', () => {
      vi.mocked(canAskNatively).mockReturnValue(true);
      render(
        <ConfirmDialog isOpen onClose={onClose} onConfirm={onConfirm} message="Sure?">
          <ul><li>three places</li></ul>
        </ConfirmDialog>,
      );
      expect(screen.getByText('three places')).toBeTruthy();
      expect(askNatively).not.toHaveBeenCalled();
    });
  });
});
