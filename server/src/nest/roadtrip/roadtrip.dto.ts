import { createZodDto } from 'nestjs-zod';
import { roadtripViaBatchRequestSchema, roadtripViaCreateRequestSchema, roadtripViaReanchorRequestSchema, roadtripViaUpdateRequestSchema } from '@trek/shared';

/**
 * createZodDto wrappers over the @trek/shared road-trip contracts. The global
 * ZodValidationPipe validates any @Body() typed with one of these by metatype, so the
 * schemas in shared/ stay the single source of truth for the wire contract.
 */
export class RoadtripViaCreateDto extends createZodDto(roadtripViaCreateRequestSchema) {}
export class RoadtripViaUpdateDto extends createZodDto(roadtripViaUpdateRequestSchema) {}
export class RoadtripViaReanchorDto extends createZodDto(roadtripViaReanchorRequestSchema) {}
export class RoadtripViaBatchDto extends createZodDto(roadtripViaBatchRequestSchema) {}
