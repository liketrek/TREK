import { z } from 'zod';

/**
 * Backup API contract (admin-only) for /api/backup.
 *
 * The auto-backup settings body is normalised server-side by the backup
 * service (parseAutoBackupBody), so this schema only pins the well-known toggle
 * fields and stays permissive (passthrough) for the rest. Create/restore/delete
 * carry no JSON body; their inputs are the :filename path param + the upload.
 */
export const autoBackupSettingsRequestSchema = z
  .object({
    enabled: z.boolean().optional(),
    interval: z.string().optional(),
    keep_days: z.union([z.string(), z.number()]).optional(),
    time: z.string().optional(),
  })
  .passthrough();
export type AutoBackupSettingsRequest = z.infer<typeof autoBackupSettingsRequestSchema>;
