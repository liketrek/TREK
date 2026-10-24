import { tourGpxImportFieldsSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

/**
 * The fields beside the file of a Tours GPX import, validated by the global Zod
 * pipe. A refusal here depends on the fields alone, never on the trip, so it
 * tells a caller without access nothing the 404 would not.
 */
export class TourGpxImportFieldsDto extends createZodDto(tourGpxImportFieldsSchema) {}
