import { skiAreaNearQuerySchema, skiRouteRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class SkiRouteRequestDto extends createZodDto(skiRouteRequestSchema) {}

export class SkiAreaNearQueryDto extends createZodDto(skiAreaNearQuerySchema) {}
