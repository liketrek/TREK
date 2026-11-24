import { destinationIdeaRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

/** A few loose wishes; every field is optional. */
export class DestinationIdeasDto extends createZodDto(destinationIdeaRequestSchema) {}
