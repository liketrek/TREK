import { createZodDto } from 'nestjs-zod';
import { adminDefaultUserSettingsRequestSchema, settingUpsertRequestSchema, settingsBulkRequestSchema } from '@trek/shared';

/**
 * Server-side createZodDto wrappers over the @trek/shared settings contracts.
 * The global ZodValidationPipe (APP_PIPE in app.module.ts) validates any
 * @Body() parameter typed with one of these classes by metatype — the Zod
 * schemas in shared/ remain the single source of truth for the wire contract.
 */
export class SettingUpsertDto extends createZodDto(settingUpsertRequestSchema) {}
export class SettingsBulkDto extends createZodDto(settingsBulkRequestSchema) {}

/** The admin route for the instance-wide user-setting defaults. */
export class AdminDefaultUserSettingsDto extends createZodDto(adminDefaultUserSettingsRequestSchema) {}
