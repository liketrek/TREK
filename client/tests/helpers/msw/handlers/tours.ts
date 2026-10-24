import {
  tourPackingLinkResponseSchema,
  tourSourceHintResponseSchema,
  tourVisitListResponseSchema,
  wandererWatchSchema,
} from '@trek/shared';
import { contractHandler } from '../contract';

export const toursHandlers = [
  // CW-03: a trip opened with Tours on reads the visits of its city walks; none is checked off unless a test says so.
  contractHandler('get', '/api/trips/:id/tour-visits', { response: tourVisitListResponseSchema }, () => ({
    visits: [],
  })),
  // P2D-XD-01: a tour's detail reads its packing link; a tour points at none unless a test says so.
  contractHandler(
    'get',
    '/api/trips/:id/tours/:placeId/packing-link',
    { response: tourPackingLinkResponseSchema },
    () => ({
      packing_link: null,
    })
  ),
  // WAN-02: the wanderer watch is off and leaves no hint on a tour unless a test says so.
  contractHandler('get', '/api/integrations/wanderer/watch', { response: wandererWatchSchema }, () => ({
    enabled: false,
    connected: false,
    lastRunAt: null,
    pausedUntil: null,
    blocked: false,
    hints: [],
  })),
  contractHandler(
    'get',
    '/api/trips/:id/tours/wanderer/sources/:placeId/hint',
    { response: tourSourceHintResponseSchema },
    () => ({ hint: null })
  ),
];
