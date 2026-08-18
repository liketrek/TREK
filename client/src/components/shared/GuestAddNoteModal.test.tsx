import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { shareApi } from '../../api/client';
import GuestAddNoteModal, { GuestAddNoteModalProps } from './GuestAddNoteModal';

const mockT = (key: string) => {
  const map: Record<string, string> = {
    'share.addNote': 'Add note',
    'share.guestNoteSuccess': 'Note sent successfully!',
    'share.guestName': 'Your name',
    'share.noteTitle': 'Note title',
    'share.noteContent': 'Note details (optional)',
    'share.noteCategory': 'Category',
    'share.attachFile': 'Attach file / photo',
    'share.fileTooLarge': 'File size exceeds 50MB limit',
    'share.sendNote': 'Send Note',
  };
  return map[key] || key;
};

const defaultProps: GuestAddNoteModalProps = {
  isOpen: true,
  onClose: vi.fn(),
  token: 'test-token',
  categories: ['Food', 'Activity', 'General'],
  t: mockT,
};

describe('GuestAddNoteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('FE-COMP-GUEST-NOTE-001: does not render anything when isOpen is false', () => {
    render(<GuestAddNoteModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Add note')).toBeNull();
  });

  it('FE-COMP-GUEST-NOTE-002: renders all fields when open', () => {
    render(<GuestAddNoteModal {...defaultProps} />);

    expect(screen.getByRole('heading', { name: 'Add note' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Note title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Note details (optional)')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /attach file/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Note' })).toBeInTheDocument();
  });

  it('FE-COMP-GUEST-NOTE-003: populates categories dropdown and defaults to first item', () => {
    render(<GuestAddNoteModal {...defaultProps} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('Food');

    const options = screen.getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['Food', 'Activity', 'General']);
  });

  it('FE-COMP-GUEST-NOTE-004: defaults category to General if categories prop is empty', () => {
    render(<GuestAddNoteModal {...defaultProps} categories={[]} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('General');
  });

  it('FE-COMP-GUEST-NOTE-005: submit button is disabled when name or title is empty', () => {
    render(<GuestAddNoteModal {...defaultProps} />);

    const submitBtn = screen.getByRole('button', { name: 'Send Note' });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Alice' } });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('Note title'), { target: { value: 'Great Cafe' } });
    expect(submitBtn).not.toBeDisabled();
  });

  it('FE-COMP-GUEST-NOTE-006: successfully submits form and closes modal', async () => {
    const addGuestNoteSpy = vi.spyOn(shareApi, 'addGuestNote').mockResolvedValue({
      success: true,
      note: { id: 1, title: 'Great Cafe' },
    });
    const onClose = vi.fn();

    render(<GuestAddNoteModal {...defaultProps} onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByPlaceholderText('Note title'), { target: { value: 'Great Cafe' } });
    fireEvent.change(screen.getByPlaceholderText('Note details (optional)'), {
      target: { value: 'Best coffee in town' },
    });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Food' } });

    const submitBtn = screen.getByRole('button', { name: 'Send Note' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(addGuestNoteSpy).toHaveBeenCalledTimes(1);
    });

    const [tokenArg, formDataArg] = addGuestNoteSpy.mock.calls[0];
    expect(tokenArg).toBe('test-token');
    expect(formDataArg instanceof FormData).toBe(true);
    expect(formDataArg.get('guest_name')).toBe('Alice');
    expect(formDataArg.get('title')).toBe('Great Cafe');
    expect(formDataArg.get('content')).toBe('Best coffee in town');
    expect(formDataArg.get('category')).toBe('Food');

    expect(onClose).toHaveBeenCalled();
  });

  it('FE-COMP-GUEST-NOTE-007: allows attaching a valid file and removing it', async () => {
    const user = userEvent.setup();
    render(<GuestAddNoteModal {...defaultProps} />);

    const file = new File(['dummy content'], 'photo.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByTestId('guest-note-file-input') as HTMLInputElement;

    await user.upload(fileInput, file);

    expect(screen.getByText('photo.jpg')).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', { name: 'Remove attachment' });
    fireEvent.click(removeBtn);

    expect(screen.queryByText('photo.jpg')).toBeNull();
    expect(screen.getByRole('button', { name: /attach file/i })).toBeInTheDocument();
  });

  it('FE-COMP-GUEST-NOTE-008: validates file size <= 50MB and rejects oversized files', async () => {
    const user = userEvent.setup();
    render(<GuestAddNoteModal {...defaultProps} />);

    // Create a 51MB file
    const oversizedFile = new File([''], 'huge-video.mp4', { type: 'video/mp4' });
    Object.defineProperty(oversizedFile, 'size', { value: 55 * 1024 * 1024 });

    const fileInput = screen.getByTestId('guest-note-file-input') as HTMLInputElement;
    await user.upload(fileInput, oversizedFile);

    expect(screen.getByText('File size exceeds 50MB limit')).toBeInTheDocument();
    expect(screen.queryByText('huge-video.mp4')).toBeNull();
  });

  it('FE-COMP-GUEST-NOTE-009: handles submission API error gracefully', async () => {
    vi.spyOn(shareApi, 'addGuestNote').mockRejectedValue(new Error('Network error'));
    const onClose = vi.fn();

    render(<GuestAddNoteModal {...defaultProps} onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByPlaceholderText('Note title'), { target: { value: 'Great Cafe' } });

    const submitBtn = screen.getByRole('button', { name: 'Send Note' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled();
    });

    // Should NOT close modal on error
    expect(onClose).not.toHaveBeenCalled();
  });
});
