/**
 * FE-AI-TRIPCHAT-001 to FE-AI-TRIPCHAT-004
 *
 * The home chat's card that offers a trip's own chat: the trip under its head
 * with its dates, where it stands and its places, the question waiting there,
 * and the button that goes on in that chat, shown only where a chat can be
 * switched to.
 */
import type { TripChatCard } from '@trek/shared';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import type { CardEntry } from '../cardTypes';
import { TripChatBlock } from './TripChatBlock';

const CARD: TripChatCard = {
  kind: 'tripChat',
  trip: { id: 5, title: 'Kyoto', startDate: '2026-11-02', endDate: '2026-11-09', phase: 'next', placeCount: 12 },
  question: 'What is still missing?',
};

function entry(card: TripChatCard, toolCallId = 'c1'): CardEntry {
  return { toolCallId, card };
}

function show(cards: CardEntry[], view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: 0, variant: 'window', ...view };
  return render(
    <AssistantViewContext.Provider value={value}>
      <TripChatBlock cards={cards} />
    </AssistantViewContext.Provider>
  );
}

describe('TripChatBlock', () => {
  it('FE-AI-TRIPCHAT-001: shows the trip, where it stands, its places and the question', () => {
    show([entry(CARD)]);
    expect(screen.getByRole('region', { name: 'Continue in a trip chat' })).toBeInTheDocument();
    expect(screen.getByText('Kyoto')).toBeInTheDocument();
    expect(screen.getByText('Trip chat')).toBeInTheDocument();
    // The dates, not the hidden label of the question, which has a "to" of its own.
    expect(screen.getByText(/\d to \w/)).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('12 places')).toBeInTheDocument();
    expect(screen.getByText('What is still missing?')).toBeInTheDocument();
  });

  it("FE-AI-TRIPCHAT-002: the button goes on in the trip's chat with the question", () => {
    const onOpenTripChat = vi.fn();
    show([entry(CARD)], { onOpenTripChat });
    fireEvent.click(screen.getByRole('button', { name: "Continue in this trip's chat" }));
    expect(onOpenTripChat).toHaveBeenCalledWith({ id: 5, title: 'Kyoto' }, 'What is still missing?');
  });

  it('FE-AI-TRIPCHAT-003: no button where no chat can be switched to, and a trip without dates says so', () => {
    const bare: TripChatCard = {
      kind: 'tripChat',
      trip: { id: 6, title: 'Someday', startDate: null, endDate: null, phase: 'undated', placeCount: null },
      question: null,
    };
    show([entry(bare)]);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('No dates yet')).toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('FE-AI-TRIPCHAT-004: two trips sit in one card, each with its own button; nothing to show draws nothing', () => {
    const onOpenTripChat = vi.fn();
    const other: TripChatCard = {
      ...CARD,
      trip: { ...CARD.trip, id: 7, title: 'Oslo', phase: 'now', startDate: '2026-10-20', endDate: '2026-10-20' },
      question: null,
    };
    show([entry(CARD), entry(other, 'c2')], { onOpenTripChat, variant: 'fullscreen' });
    const buttons = screen.getAllByRole('button', { name: "Continue in this trip's chat" });
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[1]);
    expect(onOpenTripChat).toHaveBeenCalledWith({ id: 7, title: 'Oslo' }, null);
    expect(screen.getByText('Under way')).toBeInTheDocument();

    const { container } = render(<TripChatBlock cards={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
