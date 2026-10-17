import {
  paddleObstaclesQuerySchema,
  paddleRegionCatalogQuerySchema,
  paddleRegionLoadRequestSchema,
  paddleRegionRequestSchema,
  paddleRegionSettingsSchema,
} from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class PaddleObstaclesQueryDto extends createZodDto(paddleObstaclesQuerySchema) {}
export class PaddleRegionCatalogQueryDto extends createZodDto(paddleRegionCatalogQuerySchema) {}
export class PaddleRegionRequestDto extends createZodDto(paddleRegionRequestSchema) {}
export class PaddleRegionLoadRequestDto extends createZodDto(paddleRegionLoadRequestSchema) {}
export class PaddleRegionSettingsDto extends createZodDto(paddleRegionSettingsSchema) {}
