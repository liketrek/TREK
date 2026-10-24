import { bookDesignSelectionRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

/** PUT /api/journeys/:journeyId/book-designs/:designId/selection: the pages a design's apply writes. */
export class BookDesignSelectionDto extends createZodDto(bookDesignSelectionRequestSchema) {}
