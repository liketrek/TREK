import { paddleRouteRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class PaddleRouteRequestDto extends createZodDto(paddleRouteRequestSchema) {}
