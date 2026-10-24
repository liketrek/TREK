import type { GoogleQuotaService } from '../../src/nest/google-quota/google-quota.service';

/** A Google quota that never runs out and counts nothing, for tests that build MapsService by hand (#1582). */
export const noGoogleQuota = { exhausted: async () => false, record: async () => {} } as unknown as GoogleQuotaService;
