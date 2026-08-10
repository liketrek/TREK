import { createZodDto } from 'nestjs-zod';
import { autoBackupSettingsRequestSchema } from '@trek/shared';

/**
 * Server-side createZodDto wrapper over the @trek/shared backup contract.
 *
 * The schema is a passthrough that pins only the well-known toggles: the body is
 * normalised server-side by parseAutoBackupBody, which coerces strings and
 * clamps ranges, and the handler maps its throw to the 400. Tightening here
 * would take that answer away from the service.
 */
export class AutoBackupSettingsDto extends createZodDto(autoBackupSettingsRequestSchema) {}
