import { createZodDto } from 'nestjs-zod';
import {
  preferencesUpdateRequestSchema,
  testSmtpRequestSchema,
  testWebhookRequestSchema,
  testNtfyRequestSchema,
  notificationRespondRequestSchema,
} from '@trek/shared';

/**
 * Server-side createZodDto wrappers over the @trek/shared notification
 * contracts. The global ZodValidationPipe (APP_PIPE in app.module.ts)
 * validates any @Body() parameter typed with one of these classes by
 * metatype — the Zod schemas in shared/ remain the single source of truth
 * for the wire contract.
 */
export class PreferencesUpdateDto extends createZodDto(preferencesUpdateRequestSchema) {}
export class TestSmtpDto extends createZodDto(testSmtpRequestSchema) {}
export class TestWebhookDto extends createZodDto(testWebhookRequestSchema) {}
export class TestNtfyDto extends createZodDto(testNtfyRequestSchema) {}
export class NotificationRespondDto extends createZodDto(notificationRespondRequestSchema) {}
