import { createZodDto } from 'nestjs-zod';
import { oauthClientCreateRequestSchema, oauthConsentRequestSchema } from '@trek/shared';

/**
 * Server-side createZodDto wrappers over the @trek/shared OAuth contracts.
 *
 * Both schemas already described these two bodies exactly; they were written
 * with the contracts and then never wired to the handlers, which declared the
 * same shape inline as an anonymous type. The inline types are gone now, so the
 * wire shape has one definition instead of two that could drift.
 *
 * Neither handler owns a bespoke required-field message: consent redirects with
 * `error=access_denied` on a rejection, and client creation surfaces whatever
 * the service returns. So nothing user-visible moves in front of the pipe here.
 */
export class OauthConsentDto extends createZodDto(oauthConsentRequestSchema) {}
export class OauthClientCreateDto extends createZodDto(oauthClientCreateRequestSchema) {}
