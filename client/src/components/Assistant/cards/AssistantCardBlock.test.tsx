/**
 * FE-AI-CARDBLOCK-001 to FE-AI-CARDBLOCK-003
 *
 * A block of answer cards is drawn by its kind's view; a kind not drawn yet
 * shows nothing, and a card that throws is left out without the answer
 * around it.
 */
import type { AssistantMessage, TrekCard } from '@trek/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { render, screen } from '../../../../tests/helpers/render';
import type { CardsBlock } from '../assistantParts';
import AssistantCardBlock from './AssistantCardBlock';

vi.mock('./cardViews', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./cardViews')>();
  const { createElement } = await import('react');
  const views = {
    ...actual.CARD_VIEWS,
    // A kind left without a view, whatever its package draws.
    vacay: {},
    tourList: {
      Block: function Block({ cards }: { cards: readonly { toolCallId: string }[] }) {
        return createElement('p', null, `${cards.length} tour lists`);
      },
    },
    tourRoute: {
      Block: function Broken(): never {
        throw new Error('broken card');
      },
    },
  };
  return { ...actual, CARD_VIEWS: views, viewOf: (card: TrekCard) => views[card.kind] };
});

const MESSAGE: AssistantMessage = {
  id: 'm1',
  role: 'assistant',
  status: 'complete',
  createdAt: '2026-10-22T08:00:00.000Z',
  parts: [],
};

const block = (card: TrekCard, count = 1): CardsBlock => ({
  kind: 'cards',
  key: 'cards-r1',
  group: card.kind,
  entries: Array.from({ length: count }, (_, i) => ({ toolCallId: `r${i}`, card })),
});

afterEach(() => vi.restoreAllMocks());

describe('AssistantCardBlock', () => {
  it('FE-AI-CARDBLOCK-001: the kind draws the whole block', () => {
    render(<AssistantCardBlock block={block({ kind: 'tourList' } as TrekCard, 2)} message={MESSAGE} />);
    expect(screen.getByText('2 tour lists')).toBeInTheDocument();
  });

  it('FE-AI-CARDBLOCK-002: a kind not drawn yet shows nothing', () => {
    const { container } = render(<AssistantCardBlock block={block({ kind: 'vacay' } as TrekCard)} message={MESSAGE} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-AI-CARDBLOCK-003: a card that throws is logged and left out', () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(
      <div>
        <AssistantCardBlock block={block({ kind: 'tourRoute' } as TrekCard)} message={MESSAGE} />
        <span>the answer</span>
      </div>
    );
    expect(screen.getByText('the answer')).toBeInTheDocument();
    expect(container.querySelector('p')).toBeNull();
    expect(logged).toHaveBeenCalled();
  });
});
