import { serviceIdentityStatusSchema, type ServiceIdentityStatus } from '@trek/shared';
import { serviceIdentityApi } from '../api/serviceIdentity';
import { requireOnline } from './onlineOnly';

/**
 * The installation's identity towards the TREK services, as the admin card
 * shows it. **Deliberately online-only, and no Dexie table:** it is live
 * server state, and a cached copy would show an allowance that is long gone.
 */
export const serviceIdentityRepo = {
  async status(signal?: AbortSignal): Promise<ServiceIdentityStatus> {
    requireOnline();
    return serviceIdentityStatusSchema.parse(await serviceIdentityApi.status(signal));
  },

  async regenerate(): Promise<ServiceIdentityStatus> {
    requireOnline();
    return serviceIdentityStatusSchema.parse(await serviceIdentityApi.regenerate());
  },
};
