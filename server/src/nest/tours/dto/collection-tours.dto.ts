import { collectionTourSaveRequestSchema, collectionTourTakeOverRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class CollectionTourSaveDto extends createZodDto(collectionTourSaveRequestSchema) {}
export class CollectionTourTakeOverDto extends createZodDto(collectionTourTakeOverRequestSchema) {}
