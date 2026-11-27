// FE-SETTINGS-TRIPOFFLINE-001: where a trip stands on this device, for its menu (#1580).
import { describe, expect, it } from 'vitest';

import { tripOfflineState } from './useTripOfflineStatus';

describe('tripOfflineState', () => {
  it('FE-SETTINGS-TRIPOFFLINE-001: off when switched off or not kept, saved as of the last sync, else pending', () => {
    expect(tripOfflineState(false, true, 1000)).toEqual({ kind: 'off' });
    expect(tripOfflineState(true, false, 1000)).toEqual({ kind: 'off' });
    expect(tripOfflineState(true, true, 1000)).toEqual({ kind: 'saved', at: 1000 });
    expect(tripOfflineState(true, true, null)).toEqual({ kind: 'pending' });
    expect(tripOfflineState(true, true, undefined)).toEqual({ kind: 'pending' });
  });
});
