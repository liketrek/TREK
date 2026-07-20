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

/**
 * External backup target (admin-only) for /api/backup/target.
 *
 * A single target, stored in the `app_settings` key/value table the same way
 * the SMTP settings are. `type` selects the storage backend:
 *
 *   none  — backups stay in data/backups only (the default).
 *   local — copy the archive to a second directory. On the Docker image that is
 *           a path inside the container, which the operator maps to wherever
 *           the copy should really live; on a source install it is just a
 *           filesystem path. The mapping is outside TREK's control.
 *   s3    — any S3-compatible bucket (AWS S3, MinIO, Garage, Supabase Storage,
 *           Backblaze B2, Wasabi…).
 *
 * A discriminator rather than an on/off flag so a further backend is a value
 * here plus a `BackupTarget` implementation — no settings migration, and
 * nothing at the two backup builders changes.
 *
 * The S3 secret access key is encrypted at rest and is NEVER returned to the
 * client: reads echo `secret_access_key_set` instead, and a write that sends
 * the mask back means "keep the stored secret".
 */
export const MASKED_SECRET = '••••••••';

export const BACKUP_TARGET_TYPES = ['none', 'local', 's3'] as const;
export const backupTargetTypeSchema = z.enum(BACKUP_TARGET_TYPES);
export type BackupTargetType = z.infer<typeof backupTargetTypeSchema>;

export const backupTargetRequestSchema = z.object({
  type: backupTargetTypeSchema.optional(),
  /** `local`: absolute directory the archive is copied to. */
  local_path: z.string().optional(),
  endpoint: z.string().optional(),
  region: z.string().optional(),
  bucket: z.string().optional(),
  prefix: z.string().optional(),
  access_key_id: z.string().optional(),
  /** Plaintext secret, or MASKED_SECRET to leave the stored one untouched. */
  secret_access_key: z.string().optional(),
  /** MinIO/Garage and most self-hosted gateways need path-style addressing. */
  force_path_style: z.boolean().optional(),
  /** Refuse a plain-http endpoint. On by default. */
  require_tls: z.boolean().optional(),
});
export type BackupTargetRequest = z.infer<typeof backupTargetRequestSchema>;

export const backupTargetResponseSchema = z.object({
  type: backupTargetTypeSchema,
  local_path: z.string(),
  endpoint: z.string(),
  region: z.string(),
  bucket: z.string(),
  prefix: z.string(),
  access_key_id: z.string(),
  /** Whether a secret is stored — the secret itself is never sent. */
  secret_access_key_set: z.boolean(),
  force_path_style: z.boolean(),
  require_tls: z.boolean(),
  /**
   * True when the target is configured through BACKUP_TARGET_TYPE and its
   * companion environment variables, which take precedence over the stored
   * values. The admin UI disables the form in that case rather than pretending
   * an edit would apply.
   */
  managed_by_env: z.boolean(),
});
export type BackupTargetResponse = z.infer<typeof backupTargetResponseSchema>;

/**
 * Result of mirroring the backups already on disk to the target — the
 * "upload all existing backups" action. Archives already present at the target
 * are counted as `skipped` rather than re-transferred.
 */
export const backupTargetBackfillResultSchema = z.object({
  total: z.number(),
  uploaded: z.number(),
  skipped: z.number(),
  failed: z.number(),
  errors: z.array(z.string()),
});
export type BackupTargetBackfillResult = z.infer<typeof backupTargetBackfillResultSchema>;

/**
 * A backup as shown in the admin list, merged across storage locations.
 * `local` and `remote` are independent: an archive can be on this server, at
 * the external target, or both. A remote-only entry is still restorable — it is
 * what survives losing the machine.
 */
export const mergedBackupSchema = z.object({
  filename: z.string(),
  size: z.number(),
  sizeText: z.string(),
  created_at: z.string(),
  local: z.boolean(),
  remote: z.boolean(),
});
export type MergedBackup = z.infer<typeof mergedBackupSchema>;
