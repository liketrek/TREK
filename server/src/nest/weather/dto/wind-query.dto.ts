import { windQuerySchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class WindQueryDto extends createZodDto(windQuerySchema) {}
