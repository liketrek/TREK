import { type ComponentProps, Suspense } from 'react';

import { lazyWithRetry } from '../../../utils/lazyWithRetry';
import CardBoundary from '../cards/parts/CardBoundary';

/**
 * The phone's route peek, loaded the first time a route is shown over the
 * map, so the trip screen does not carry the route cards' code before the
 * chat ever draws one. A peek that fails to load or to draw shows nothing:
 * the map and the chat's pill stay as they are.
 */
const RoutePeek = lazyWithRetry(() => import('./RoutePeek'));

export default function RoutePeekLazy(props: ComponentProps<typeof RoutePeek>) {
  return (
    <CardBoundary>
      <Suspense fallback={null}>
        <RoutePeek {...props} />
      </Suspense>
    </CardBoundary>
  );
}
