import { paddleObstaclesQuerySchema, paddleRegionCatalogQuerySchema, paddleRegionRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class PaddleObstaclesQueryDto extends createZodDto(paddleObstaclesQuerySchema) {}
export class PaddleRegionCatalogQueryDto extends createZodDto(paddleRegionCatalogQuerySchema) {}
export class PaddleRegionRequestDto extends createZodDto(paddleRegionRequestSchema) {}
