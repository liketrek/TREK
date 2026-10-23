/**
 * createZodDto wrappers over the @trek/shared AI connection contracts, so the
 * global ZodValidationPipe validates the bodies by metatype and the shared
 * schemas stay the one source of truth.
 */
import {
  aiAdminSettingsSchema,
  aiApiKeyConnectRequestSchema,
  aiChatgptFinishRequestSchema,
  aiInstanceConnectionRequestSchema,
  aiModelUpdateRequestSchema,
  aiOpenrouterFinishRequestSchema,
  aiOpenrouterStartRequestSchema,
  aiPrivacyAckRequestSchema,
  type AiInstanceConnectionRequest,
} from '@trek/shared';

import { createZodDto } from 'nestjs-zod';
import type { z } from 'zod';

/**
 * The fields the instance connection's variants share. Its contract is a union
 * over `kind`, and a class cannot extend a union: the DTO is typed as this
 * common shape while the pipe validates against the full union.
 */
interface AiInstanceConnectionFields {
  kind: AiInstanceConnectionRequest['kind'];
  baseUrl?: string;
  apiKey?: string;
  model?: string;
}

export class AiApiKeyConnectDto extends createZodDto(aiApiKeyConnectRequestSchema) {}
export class AiModelUpdateDto extends createZodDto(aiModelUpdateRequestSchema) {}
export class AiChatgptFinishDto extends createZodDto(aiChatgptFinishRequestSchema) {}
export class AiOpenrouterStartDto extends createZodDto(aiOpenrouterStartRequestSchema) {}
export class AiOpenrouterFinishDto extends createZodDto(aiOpenrouterFinishRequestSchema) {}
export class AiPrivacyAckDto extends createZodDto(aiPrivacyAckRequestSchema) {}
export class AiAdminSettingsDto extends createZodDto(aiAdminSettingsSchema) {}
export class AiInstanceConnectionDto extends createZodDto(
  aiInstanceConnectionRequestSchema as z.ZodType<AiInstanceConnectionFields>,
) {}
