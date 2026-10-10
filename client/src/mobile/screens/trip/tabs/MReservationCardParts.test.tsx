// FE-COMP-MRESCARD-001 to FE-COMP-MRESCARD-007
import { fireEvent, render, screen } from '@testing-library/react';
import { Hotel, Plane } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import type { useReservationCard } from '../../../../components/Planner/bookings/useReservationCard';
import type { Reservation } from '../../../../types';
import { CardActions, CardDeleteSheet, CardFiles, CardTitleButton, CardWhenAndCode } from './MReservationCardParts';

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${Object.values(params).join(',')}` : key;

function reservation(overrides: Partial<Reservation> = {}): Reservation {
  return { id: 1, trip_id: 7, type: 'flight', title: 'LH 400', status: 'confirmed', ...overrides } as Reservation;
}

function cardState(overrides: Partial<ReturnType<typeof useReservationCard>> = {}) {
  return {
    codeBlurred: false,
    toggleCode: undefined,
    confirmingDelete: false,
    askDelete: vi.fn(),
    cancelDelete: vi.fn(),
    confirmDelete: vi.fn(),
    fileChip: () => ({ onClick: vi.fn(), onKeyDown: vi.fn() }),
    ...overrides,
  } as unknown as ReturnType<typeof useReservationCard>;
}

describe('MReservationCardParts', () => {
  it('FE-COMP-MRESCARD-001: the title button shows the type pill and title, and opens the card (transport variant)', () => {
    const onOpen = vi.fn();
    render(<CardTitleButton res={reservation()} TypeIcon={Plane} typeColor="#123456" onOpen={onOpen} t={t} />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('reservations.type.flight');
    expect(button).toHaveTextContent('LH 400');
    expect(screen.queryByText('reservations.needsReview')).toBeNull();
    expect(button.querySelector('.lucide-plane')).toHaveStyle({ color: '#123456' });
    fireEvent.click(button);
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('FE-COMP-MRESCARD-002: the title button flags a booking that needs review (booking variant)', () => {
    render(
      <CardTitleButton
        res={reservation({ type: 'hotel', title: 'Ryokan', needs_review: 1 } as Partial<Reservation>)}
        TypeIcon={Hotel}
        typeColor="#654321"
        onOpen={vi.fn()}
        t={t}
      />
    );

    expect(screen.getByText('reservations.type.hotel')).toBeInTheDocument();
    expect(screen.getByText('reservations.needsReview')).toBeInTheDocument();
  });

  it('FE-COMP-MRESCARD-003: the actions call edit and delete', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<CardActions onEdit={onEdit} onDelete={onDelete} t={t} />);

    fireEvent.click(screen.getByRole('button', { name: 'common.edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('FE-COMP-MRESCARD-004: date and time open the card, and a missing code draws no code box', () => {
    const onOpen = vi.fn();
    render(<CardWhenAndCode dayValue="Mon 3" timeValue="09:00" code={null} card={cardState()} onOpen={onOpen} t={t} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledOnce();
    expect(screen.getByText('Mon 3')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.queryByText('reservations.confirmationCode')).toBeNull();
  });

  it('FE-COMP-MRESCARD-005: a blurred code is its own reveal control', () => {
    const toggleCode = vi.fn();
    render(
      <CardWhenAndCode
        dayValue="Mon 3"
        timeValue="09:00"
        code="ABC123"
        card={cardState({ codeBlurred: true, toggleCode })}
        onOpen={vi.fn()}
        t={t}
      />
    );

    const reveal = screen.getByRole('button', { name: 'ABC123' });
    expect(reveal).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(reveal);
    expect(toggleCode).toHaveBeenCalledOnce();
  });

  it('FE-COMP-MRESCARD-006: files render as button-role chips, and no files render nothing', () => {
    const { container, rerender } = render(<CardFiles files={[]} card={cardState()} t={t} />);
    expect(container).toBeEmptyDOMElement();

    const files = [{ id: 5, original_name: 'ticket.pdf', url: '/uploads/f/5' }] as Parameters<
      typeof CardFiles
    >[0]['files'];
    rerender(<CardFiles files={files} card={cardState()} t={t} />);
    expect(screen.getByText('files.title')).toBeInTheDocument();
    const chip = screen.getByRole('button', { name: 'ticket.pdf' });
    expect(chip.tagName).toBe('SPAN');
    expect(chip).toHaveAttribute('tabindex', '0');
  });

  it('FE-COMP-MRESCARD-007: the delete sheet names the reservation and confirms through the card', () => {
    const card = cardState({ confirmingDelete: true });
    render(<CardDeleteSheet title="LH 400" card={card} t={t} />);

    expect(screen.getByText('reservations.confirm.deleteBody:LH 400')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
    expect(card.confirmDelete).toHaveBeenCalledOnce();
  });
});
