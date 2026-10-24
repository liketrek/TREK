// FE-PLANNER-NOTESFILESCOSTS-001 to FE-PLANNER-NOTESFILESCOSTS-003
import { createRef, type ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { BookingNotesFilesCosts } from './BookingNotesFilesCosts';

const linkAndFiles = vi.fn();
const costs = vi.fn();

vi.mock('./BookingLinkAndFiles', () => ({
  BookingLinkAndFiles: (props: Record<string, unknown>) => {
    linkAndFiles(props);
    return <div data-testid="link-and-files" />;
  },
}));

vi.mock('./BookingCostsSection', () => ({
  BookingCostsSection: (props: Record<string, unknown>) => {
    costs(props);
    return <div data-testid="costs" />;
  },
}));

type Props = ComponentProps<typeof BookingNotesFilesCosts>;

function setup(overrides: Partial<Props> = {}) {
  linkAndFiles.mockClear();
  costs.mockClear();
  const props: Props = {
    notes: 'Gate B',
    onNotesChange: vi.fn(),
    url: 'https://example.com',
    onUrlChange: vi.fn(),
    reservationId: 9,
    tripFiles: [],
    pendingFiles: [],
    fileInputRef: createRef<HTMLInputElement>(),
    attach: {
      uploadingFile: false,
      handleFileChange: vi.fn(),
      attachedFiles: [],
      removePending: vi.fn(),
      linkFile: vi.fn(),
      detachFile: vi.fn(),
    },
    canAttach: true,
    showCosts: true,
    pendingExpense: null,
    expense: { reset: vi.fn(), take: vi.fn(), create: vi.fn(), edit: vi.fn(), remove: vi.fn() },
    ...overrides,
  };
  render(<BookingNotesFilesCosts {...props} />);
  return props;
}

describe('BookingNotesFilesCosts', () => {
  it('FE-PLANNER-NOTESFILESCOSTS-001: shows the notes and reports an edit', () => {
    const props = setup();

    const area = screen.getByPlaceholderText('Additional notes...');
    expect(area).toHaveValue('Gate B');
    fireEvent.change(area, { target: { value: 'Gate C' } });
    expect(props.onNotesChange).toHaveBeenCalledWith('Gate C');
  });

  it('FE-PLANNER-NOTESFILESCOSTS-002: hands the link, the files and the costs their parts of the booking', () => {
    const props = setup();

    expect(linkAndFiles).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com',
        onUrlChange: props.onUrlChange,
        reservationId: 9,
        canAttach: true,
        uploading: false,
        onFileChange: props.attach.handleFileChange,
        onRemovePending: props.attach.removePending,
        onLinked: props.attach.linkFile,
        onDetached: props.attach.detachFile,
      })
    );
    expect(costs).toHaveBeenCalledWith(
      expect.objectContaining({
        reservationId: 9,
        pendingExpense: null,
        onCreate: props.expense.create,
        onEdit: props.expense.edit,
        onRemove: props.expense.remove,
        customTooltips: true,
      })
    );
  });

  it('FE-PLANNER-NOTESFILESCOSTS-003: leaves the costs out without the budget, and passes no id for a new booking', () => {
    setup({ showCosts: false, reservationId: undefined });

    expect(screen.getByTestId('link-and-files')).toBeInTheDocument();
    expect(screen.queryByTestId('costs')).toBeNull();
    expect(linkAndFiles).toHaveBeenCalledWith(expect.objectContaining({ reservationId: undefined }));
  });
});
