import { walkImportPreviewRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class WalkImportPreviewDto extends createZodDto(walkImportPreviewRequestSchema) {}
