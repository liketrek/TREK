import type { BookingImportPreviewItem } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { parsedItemToDraft } from './parsedItemToDraft';

const item = (metadata?: Record<string, unknown>): BookingImportPreviewItem => ({
  type: 'flight',
  title: 'Kuala Lumpur to Bangkok',
  metadata,
  source: { fileName: 'airasia.eml', index: 0 },
});

describe('parsedItemToDraft', () => {
  // #3238: the review form opens with the status the document states.
  it('FE-PARSED-DRAFT-001: a booking the document calls confirmed opens confirmed, anything else pending', () => {
    expect(parsedItemToDraft(item({ reservationStatus: 'confirmed' })).status).toBe('confirmed');
    expect(parsedItemToDraft(item({ reservationStatus: 'cancelled' })).status).toBe('pending');
    expect(parsedItemToDraft(item({ reservationStatus: 'pending' })).status).toBe('pending');
    expect(parsedItemToDraft(item()).status).toBe('pending');
  });
});
