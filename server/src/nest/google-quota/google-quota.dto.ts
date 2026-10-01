import { createZodDto } from 'nestjs-zod';
import { googleQuotaUpdateRequestSchema } from '@trek/shared';

export class GoogleQuotaUpdateDto extends createZodDto(googleQuotaUpdateRequestSchema) {}
