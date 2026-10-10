import { googleQuotaUpdateRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class GoogleQuotaUpdateDto extends createZodDto(googleQuotaUpdateRequestSchema) {}
