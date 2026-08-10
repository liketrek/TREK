import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { oauthConsentRequestSchema } from '@trek/shared';

/**
 * Server-side createZodDto wrappers for the OAuth bodies.
 *
 * Consent takes the shared schema unchanged: every field it requires is one the
 * handler dereferences immediately (redirect_uri is parsed as a URL, the PKCE
 * pair goes straight into the stored code), so a body missing them had no
 * meaningful old behaviour to preserve.
 *
 * Client creation does NOT, and the difference is deliberate. The shared schema
 * declares `name: z.string().min(1)` and `allowed_scopes` as required, but the
 * handler answers 403 `{ error: 'MCP is not enabled' }` before it looks at the
 * body at all, and the service owns `Name is required` and
 * `At least one redirect URI is required`. The pipe runs first, so adopting the
 * schema verbatim turned a 403 into a 400 on an instance with the addon off, and
 * replaced two error strings a client shows the user. Describing the shape
 * without demanding it keeps every one of those answers where it was.
 */
export class OauthConsentDto extends createZodDto(oauthConsentRequestSchema) {}

export class OauthClientCreateDto extends createZodDto(
  z.looseObject({
    name: z.string().optional(),
    redirect_uris: z.array(z.string()).optional(),
    allowed_scopes: z.array(z.string()).optional(),
    allows_client_credentials: z.boolean().optional(),
  }),
) {}
