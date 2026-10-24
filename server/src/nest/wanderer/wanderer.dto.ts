/**
 * createZodDto wrappers over the @trek/shared wanderer contracts, so the global
 * ZodValidationPipe validates the bodies by metatype and the shared schemas
 * stay the one source of truth.
 */
import { wandererSettingsRequestSchema, wandererTestRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class WandererSettingsDto extends createZodDto(wandererSettingsRequestSchema) {}
export class WandererTestDto extends createZodDto(wandererTestRequestSchema) {}
