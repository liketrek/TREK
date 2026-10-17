// PSF-001 to PSF-006: the safety note of a paddle tour: the quiet row and the dialog it opens, which never asks for
// a confirmation, never stands in the way and closes on Escape without taking the tour detail with it.
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import { PaddleSafetyDialog, PaddleSafetyRow } from './PaddleSafety';

/** The note as shared/src/i18n/en/tours.ts words it. */
const SHORT = 'Paddling has risks. Check water, rules and weather yourself.';
const TITLE = 'Safety on the water';
const TEXT =
  'Paddling carries risks. Maps, route suggestions and notes can be incomplete or out of date. Before the tour, check the current local conditions, the rules for using the water and the weather. Take suitable safety measures. TREK supports your planning and does not replace your own check and responsible decision.';

/** The footer's Close, told apart from the round close of the head band by its words. */
function footerClose(dialog: HTMLElement): HTMLElement {
  const button = within(dialog).getByText('Close').closest('button');
  if (!button) throw new Error('no Close button in the footer');
  return button;
}

/** The round close of the head band, named by its label alone. */
function headClose(dialog: HTMLElement): HTMLElement {
  const button = within(dialog)
    .getAllByRole('button', { name: 'Close' })
    .find((candidate) => candidate.textContent === '');
  if (!button) throw new Error('no close button in the head band');
  return button;
}

describe('PaddleSafetyRow', () => {
  it('PSF-001: is a quiet button saying paddling has risks that opens a dialog, closed at first', () => {
    render(<PaddleSafetyRow />);

    const row = screen.getByRole('button', { name: SHORT });
    expect(row).toHaveAttribute('type', 'button');
    expect(row).toHaveAttribute('aria-haspopup', 'dialog');
    expect(row.querySelector('svg.lucide-life-buoy')).not.toBeNull();
    expect(row.querySelector('svg.lucide-chevron-right')).not.toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('PSF-002: opens the full note, closes on Close and opens again', () => {
    render(<PaddleSafetyRow />);
    const row = screen.getByRole('button', { name: SHORT });

    fireEvent.click(row);
    const dialog = screen.getByRole('dialog', { name: TITLE });
    expect(within(dialog).getByText(TEXT)).toBeInTheDocument();

    fireEvent.click(footerClose(dialog));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(row);
    expect(screen.getByRole('dialog', { name: TITLE })).toBeInTheDocument();
  });

  it('PSF-003: the round close, Escape and the backdrop close it as well', () => {
    render(<PaddleSafetyRow />);
    const row = screen.getByRole('button', { name: SHORT });

    fireEvent.click(row);
    fireEvent.click(headClose(screen.getByRole('dialog', { name: TITLE })));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(row);
    fireEvent.keyDown(screen.getByRole('dialog', { name: TITLE }), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(row);
    const backdrop = screen.getByRole('dialog', { name: TITLE }).parentElement;
    if (!backdrop) throw new Error('no backdrop around the dialog');
    fireEvent.mouseDown(backdrop);
    fireEvent.click(backdrop);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('PSF-004: Escape closes the note alone; the tour detail listening on the page does not see it', () => {
    // The tour detail closes on an Escape nobody handled, from a listener it registered before the note opened.
    const detailEscape = vi.fn();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) detailEscape();
    };
    document.addEventListener('keydown', onKey);
    try {
      render(<PaddleSafetyRow />);
      fireEvent.click(screen.getByRole('button', { name: SHORT }));

      fireEvent.keyDown(screen.getByRole('dialog', { name: TITLE }), { key: 'Escape' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(detailEscape).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', onKey);
    }
  });

  it('PSF-005: inside a form the row and its dialog submit nothing', () => {
    const onSubmit = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <PaddleSafetyRow />
      </form>
    );

    fireEvent.click(screen.getByRole('button', { name: SHORT }));
    fireEvent.click(footerClose(screen.getByRole('dialog', { name: TITLE })));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('PaddleSafetyDialog', () => {
  it('PSF-006: shows nothing while closed; open it is narrow, its one action closes it and nothing asks to confirm', () => {
    const onClose = vi.fn();
    const { rerender } = render(<PaddleSafetyDialog open={false} onClose={onClose} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<PaddleSafetyDialog open onClose={onClose} />);
    const dialog = screen.getByRole('dialog', { name: TITLE });
    expect(dialog.className).toContain('max-w-[520px]');
    expect(within(dialog).getAllByRole('button')).toHaveLength(2);
    expect(within(dialog).queryByRole('checkbox')).not.toBeInTheDocument();

    fireEvent.click(footerClose(dialog));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
