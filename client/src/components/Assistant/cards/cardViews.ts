import type { TrekCard, TrekCardKind } from '@trek/shared';

import { ATLAS_VIEWS } from './atlas/atlasViews';
import { BOOK_VIEWS } from './book/bookViews';
import { BOOK_DESIGN_VIEWS } from './bookDesign/bookDesignViews';
import { BOOKING_VIEWS } from './booking/bookingViews';
import { BUDGET_VIEWS } from './budget/budgetViews';
import type { CardView } from './cardTypes';
import { COLLAB_VIEWS } from './collab/collabViews';
import { COLLECTION_VIEWS } from './collection/collectionViews';
import { JOURNEY_VIEWS } from './journey/journeyViews';
import { PACKING_VIEWS } from './packing/packingViews';
import { ROADTRIP_VIEWS } from './roadtrip/roadtripViews';
import { TOUR_VIEWS } from './tour/tourViews';
import { VACAY_VIEWS } from './vacay/vacayViews';

/**
 * How every kind of card draws, merged from each part of TREK's views. A kind
 * without a view of its own yet has the pending one and draws nothing. This
 * module pulls in the card components, so only the chat's own chunk imports
 * it; the pure helpers, the layout rules among them, read the look instead.
 */
export const CARD_VIEWS: { readonly [K in TrekCardKind]: CardView<K> } = {
  ...TOUR_VIEWS,
  ...ROADTRIP_VIEWS,
  ...BUDGET_VIEWS,
  ...BOOKING_VIEWS,
  ...COLLAB_VIEWS,
  ...COLLECTION_VIEWS,
  ...ATLAS_VIEWS,
  ...VACAY_VIEWS,
  ...JOURNEY_VIEWS,
  ...PACKING_VIEWS,
  ...BOOK_VIEWS,
  ...BOOK_DESIGN_VIEWS,
};

/** The view of the card in hand, typed for any kind. */
export function viewOf(card: TrekCard): CardView<TrekCardKind> {
  return CARD_VIEWS[card.kind] as CardView<TrekCardKind>;
}
