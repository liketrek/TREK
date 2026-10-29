import { nativeExchangeRequestSchema, nativeHandoffRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

/** Body of POST /api/auth/native/handoff: the challenge the app sent into the browser. */
export class NativeHandoffDto extends createZodDto(nativeHandoffRequestSchema) {}
/** Body of POST /api/auth/native/exchange: the one-time code and the verifier behind its challenge. */
export class NativeExchangeDto extends createZodDto(nativeExchangeRequestSchema) {}
