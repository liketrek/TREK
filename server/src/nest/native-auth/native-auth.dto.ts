import { createZodDto } from 'nestjs-zod';
import { nativeExchangeRequestSchema, nativeHandoffRequestSchema } from '@trek/shared';

export class NativeHandoffDto extends createZodDto(nativeHandoffRequestSchema) {}
export class NativeExchangeDto extends createZodDto(nativeExchangeRequestSchema) {}
