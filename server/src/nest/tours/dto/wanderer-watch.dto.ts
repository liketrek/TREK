/** createZodDto wrapper over the @trek/shared contract of the wanderer watch switch (WAN-02). */
import { wandererWatchRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class WandererWatchDto extends createZodDto(wandererWatchRequestSchema) {}
