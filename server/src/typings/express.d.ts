// Augments Express's `Request` with the fields TREK middleware + Nest guards
// attach after authentication. Replaces the per-site casts
// (`(req as AuthRequest).user`, `getRequest<Request & { user?: User }>()`) with
// a single source of truth so downstream code can read `req.user` directly.

import type { PublicApiGrant } from '@trek/shared';
import type { User } from '../types';

declare module 'express-serve-static-core' {
  interface Request {
    /**
     * Set by `authenticate` middleware (Express) and `JwtAuthGuard` (Nest).
     * Present on every route mounted behind those guards. `null` is used by
     * `optionalAuthenticate` to signal "checked, but unauthenticated".
     */
    user?: User | null;
    /**
     * What the `/api/v1` integration key presented on this request may read.
     * Set by `ApiTokenGuard`, and only there.
     *
     * Its own field rather than something folded into `user`: the grant belongs
     * to the credential, not to the person, and a cookie session has no grant at
     * all. Putting it on `user` would leak a token's restrictions into every
     * other auth path that happens to read the same object.
     */
    apiToken?: PublicApiGrant;
  }
}

// This file has imports, so TS treats it as a module. The empty export keeps
// the `declare module` augmentation visible project-wide.
export {};
