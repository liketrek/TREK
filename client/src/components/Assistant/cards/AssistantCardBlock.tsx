import type { AssistantMessage } from '@trek/shared';

import type { CardsBlock } from '../assistantParts';
import { viewOf } from './cardViews';
import CardBoundary from './parts/CardBoundary';

/**
 * The answer cards of one group, drawn by their kind's `Block`. A kind with
 * no view yet draws nothing, and a card that throws is left out with the rest
 * of the answer still in place.
 */
export default function AssistantCardBlock({ block, message }: { block: CardsBlock; message: AssistantMessage }) {
  const first = block.entries[0];
  const Block = first ? viewOf(first.card).Block : undefined;
  if (!Block) return null;
  return (
    <CardBoundary>
      <Block cards={block.entries} message={message} />
    </CardBoundary>
  );
}
