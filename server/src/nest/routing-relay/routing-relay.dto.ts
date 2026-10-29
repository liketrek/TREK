import { valhallaHeightRequestSchema, valhallaRouteRequestSchema, valhallaTraceRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

/** The bodies of the three Valhalla questions the relay takes, validated at the Zod pipe. */
export class ValhallaRouteDto extends createZodDto(valhallaRouteRequestSchema) {}
export class ValhallaTraceDto extends createZodDto(valhallaTraceRequestSchema) {}
export class ValhallaHeightDto extends createZodDto(valhallaHeightRequestSchema) {}
