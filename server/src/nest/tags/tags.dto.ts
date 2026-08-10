import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Server-side createZodDto wrappers over the @trek/shared tag contracts.
 *
 * Neither uses the shared schema as written. `createTagRequestSchema` declares
 * `name: z.string().min(1)`, and the pipe reports a rejection as
 * `field: message` — so adopting it verbatim would replace the endpoint's
 * `{ error: 'Tag name is required' }`, which two tests pin and which is what a
 * client shows the user. The handler keeps the check that owns the message.
 */
/**
 * Both fields are `unknown`, not `string`.
 *
 * The handlers read them off `@Body('name')` / `@Body('color')` and passed
 * whatever arrived to the service, which binds them into SQLite: a numeric name
 * created a tag. Typing them as strings turns those requests into a 400 from the
 * pipe, which is a contract change for anything already sending one. The service
 * is where the value is interpreted, and it stays there.
 */
const tagBody = z.looseObject({ name: z.unknown().optional(), color: z.unknown().optional() });

export class TagCreateDto extends createZodDto(tagBody) {}
export class TagUpdateDto extends createZodDto(tagBody) {}
