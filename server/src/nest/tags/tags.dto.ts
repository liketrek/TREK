import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { updateTagRequestSchema } from '@trek/shared';

/**
 * Server-side createZodDto wrappers over the @trek/shared tag contracts.
 *
 * Create deliberately does NOT use `createTagRequestSchema` as written. That
 * schema declares `name: z.string().min(1)`, and the pipe reports a rejection as
 * `field: message` — so adopting it verbatim would replace the endpoint's
 * `{ error: 'Tag name is required' }` with `name: ...`. Two tests pin that
 * string, and more to the point it is what a client shows the user.
 *
 * So the DTO accepts the shape and leaves `name` optional, and the handler keeps
 * the check that owns the message. The endpoint's actual contract is unchanged:
 * a request without a name still gets 400, with the same body it always had.
 * What the DTO does add is type and shape validation on everything else, which
 * is what took this route off the allow-list.
 */
export class TagCreateDto extends createZodDto(
  z.object({ name: z.string().optional(), color: z.string().optional() }),
) {}

export class TagUpdateDto extends createZodDto(updateTagRequestSchema) {}
