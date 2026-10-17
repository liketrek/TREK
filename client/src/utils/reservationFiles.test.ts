// FE-UTIL-RESFILES-001 to -002: the files a booking shows, on the desktop booking
// cards and details and on the phone's booking and transport tabs and sheet.
import { describe, expect, it } from 'vitest';

import { buildTripFile } from '../../tests/helpers/factories';
import { filesFor } from './reservationFiles';

describe('filesFor', () => {
  it('FE-UTIL-RESFILES-001: a booking keeps its own files and the ones linked to it', () => {
    const own = buildTripFile({ id: 1, reservation_id: 5 });
    const linked = buildTripFile({ id: 2, reservation_id: null, linked_reservation_ids: [9, 5] });
    const other = buildTripFile({ id: 3, reservation_id: 6, linked_reservation_ids: [7] });
    const loose = buildTripFile({ id: 4, reservation_id: null });
    expect(filesFor({ id: 5 }, [own, linked, other, loose]).map((f) => f.id)).toEqual([1, 2]);
  });

  it('FE-UTIL-RESFILES-002: a trashed file is left out', () => {
    const trashed = buildTripFile({ id: 1, reservation_id: 5, deleted_at: '2026-01-01T00:00:00Z' });
    const trashedLink = buildTripFile({ id: 2, linked_reservation_ids: [5], deleted_at: '2026-01-01T00:00:00Z' });
    expect(filesFor({ id: 5 }, [trashed, trashedLink])).toEqual([]);
  });
});
