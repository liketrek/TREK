import { z } from 'zod';

/**
 * Storage admin contract (spec: docs/superpowers/specs/2026-08-19-storage-admin-config-design.md).
 *
 * STORAGE_BACKEND_TYPES is the single schema-driven registry: each backend
 * type declares its fields once, and both the Zod options schema (generated
 * below) and the admin form's field metadata render from that one definition.
 * Adding a backend type = one entry here + one driver class + one registry
 * construction line. The registry is deliberately consumer-agnostic — the
 * admin panel is its first renderer and a standalone seed-file generator is
 * the planned second; do not specialize it toward either.
 *
 * Shared Zod validates SHAPE only. Semantics (name references, mirror
 * composition, mirror-only-on-backups, no nesting, key rules) stay in the
 * server registry's validators — the settled two-layer pattern.
 */

/**
 * Canonical CONFIGURABLE category list — relocated here from server
 * storage.types.ts (which re-exports it) because the wire schema needs it and
 * a second copy is forbidden. The legacy `photos` directory is served and
 * backed up but not configurable — the server's SERVED_CATEGORIES extension
 * (storage.types.ts) carries it.
 */
export const STORAGE_CATEGORIES = [
  'files',
  'journey',
  'covers',
  'avatars',
  'places',
  'photos-google',
  'photos-trek',
  'backups',
] as const;
export type StorageCategory = (typeof STORAGE_CATEGORIES)[number];
export const storageCategorySchema = z.enum(STORAGE_CATEGORIES);

export const STORAGE_BACKEND_TYPE_IDS = ['local', 's3', 'mirror'] as const;
export type StorageBackendTypeId = (typeof STORAGE_BACKEND_TYPE_IDS)[number];

export interface StorageBackendFieldDef {
  key: string;
  kind: 'text' | 'path' | 'secret' | 'number' | 'backend-ref' | 'backend-ref-list';
  /** i18n key under the `storage` domain (locale files land with the client slice). */
  labelKey: string;
  helpKey?: string;
  required: boolean;
  defaultValue?: string | number;
  /** Optional per-field refinement piped onto the kind's base Zod type. */
  refine?: { schema: z.ZodTypeAny };
}

function fieldSchema(field: StorageBackendFieldDef): z.ZodTypeAny {
  let base: z.ZodTypeAny;
  switch (field.kind) {
    case 'number':
      base = z.number();
      break;
    case 'backend-ref':
      base = z.string().min(1);
      break;
    case 'backend-ref-list':
      base = z.array(z.string().min(1));
      break;
    default: // text | path | secret
      base = field.required ? z.string().min(1) : z.string();
  }
  if (field.defaultValue !== undefined) base = base.default(field.defaultValue);
  if (field.refine) base = base.pipe(field.refine.schema);
  return base;
}

type FieldValue<F extends StorageBackendFieldDef> = F['kind'] extends 'number'
  ? number
  : F['kind'] extends 'backend-ref-list'
    ? string[]
    : string;
/** Parsed options are total: non-required fields must declare a defaultValue (spec pin). */
export type StorageOptionsOf<Fs extends readonly StorageBackendFieldDef[]> = {
  [F in Fs[number] as F['key']]: FieldValue<F>;
};

function optionsSchemaFor<const Fs extends readonly StorageBackendFieldDef[]>(
  fields: Fs,
): z.ZodType<StorageOptionsOf<Fs>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) shape[field.key] = fieldSchema(field);
  // The one sanctioned cast: the runtime schema is generated from the same
  // field defs the mapped type reads, and the parity spec pins the two.
  return z.strictObject(shape) as unknown as z.ZodType<StorageOptionsOf<Fs>>;
}

const LOCAL_FIELDS = [
  {
    key: 'root',
    kind: 'path',
    labelKey: 'storage.field.root',
    helpKey: 'storage.help.root',
    required: true,
  },
] as const satisfies readonly StorageBackendFieldDef[];

const S3_FIELDS = [
  {
    key: 'endpoint',
    kind: 'text',
    labelKey: 'storage.field.endpoint',
    helpKey: 'storage.help.endpoint',
    required: true,
    refine: { schema: z.url() },
  },
  { key: 'bucket', kind: 'text', labelKey: 'storage.field.bucket', required: true },
  { key: 'accessKeyId', kind: 'text', labelKey: 'storage.field.accessKeyId', required: true },
  { key: 'secretAccessKey', kind: 'secret', labelKey: 'storage.field.secretAccessKey', required: true },
  {
    key: 'region',
    kind: 'text',
    labelKey: 'storage.field.region',
    helpKey: 'storage.help.region',
    required: false,
    defaultValue: 'us-east-1',
  },
  {
    key: 'keyPrefix',
    kind: 'text',
    labelKey: 'storage.field.keyPrefix',
    helpKey: 'storage.help.keyPrefix',
    required: false,
    defaultValue: '',
  },
  {
    key: 'retries',
    kind: 'number',
    labelKey: 'storage.field.retries',
    required: false,
    defaultValue: 1,
    refine: { schema: z.number().int().min(0) },
  },
  {
    key: 'timeoutMs',
    kind: 'number',
    labelKey: 'storage.field.timeoutMs',
    required: false,
    defaultValue: 30000,
    refine: { schema: z.number().int().positive() },
  },
] as const satisfies readonly StorageBackendFieldDef[];

const MIRROR_FIELDS = [
  { key: 'primary', kind: 'backend-ref', labelKey: 'storage.field.primary', required: true },
  { key: 'replicas', kind: 'backend-ref-list', labelKey: 'storage.field.replicas', required: true },
] as const satisfies readonly StorageBackendFieldDef[];

export const STORAGE_BACKEND_TYPES = {
  local: { fields: LOCAL_FIELDS, optionsSchema: optionsSchemaFor(LOCAL_FIELDS) },
  s3: { fields: S3_FIELDS, optionsSchema: optionsSchemaFor(S3_FIELDS) },
  mirror: { fields: MIRROR_FIELDS, optionsSchema: optionsSchemaFor(MIRROR_FIELDS) },
} as const;

export type StorageLocalOptions = z.infer<(typeof STORAGE_BACKEND_TYPES)['local']['optionsSchema']>;
export type StorageS3Options = z.infer<(typeof STORAGE_BACKEND_TYPES)['s3']['optionsSchema']>;
export type StorageMirrorOptions = z.infer<(typeof STORAGE_BACKEND_TYPES)['mirror']['optionsSchema']>;

/** Field keys the type marks `secret` — the exact set encrypted at rest and masked on GET. */
export function storageSecretFields(type: StorageBackendTypeId): readonly string[] {
  return STORAGE_BACKEND_TYPES[type].fields.filter((f) => f.kind === 'secret').map((f) => f.key);
}

export const storageBackendSchema = z.discriminatedUnion('type', [
  z.strictObject({
    name: z.string().min(1),
    type: z.literal('local'),
    options: STORAGE_BACKEND_TYPES.local.optionsSchema,
  }),
  z.strictObject({
    name: z.string().min(1),
    type: z.literal('s3'),
    options: STORAGE_BACKEND_TYPES.s3.optionsSchema,
  }),
  z.strictObject({
    name: z.string().min(1),
    type: z.literal('mirror'),
    options: STORAGE_BACKEND_TYPES.mirror.optionsSchema,
  }),
]);
export type StorageBackend = z.infer<typeof storageBackendSchema>;

/**
 * The two app_settings rows as one document — the PUT body and the seed-file
 * shape. `.strict()` at every level: unknown keys are rejected, including the
 * reserved top-level `readOnly` seed key (loud until a standing file-override
 * mode is actually implemented). Byte-compatible with rows hand-written
 * during the S3 slice (pinned in the sibling spec file).
 */
export const storageConfigSchema = z.strictObject({
  backends: z.array(storageBackendSchema),
  categories: z.partialRecord(storageCategorySchema, z.string().min(1)),
});
export type StorageConfig = z.infer<typeof storageConfigSchema>;

/**
 * The PUT wire shape: the config document plus the optimistic-concurrency
 * version the client read it at (audit #7 — a stale PUT can otherwise silently
 * undo a category migration's just-flipped assignment). `storageConfigSchema`
 * itself stays untouched — it doubles as the seed-file shape, which has no
 * version to compare against.
 */
export const storageConfigPutSchema = storageConfigSchema.extend({
  version: z.number().int().nonnegative(),
});
export type StorageConfigPut = z.infer<typeof storageConfigPutSchema>;

// ── GET /api/admin/storage state + POST /test wire shapes ─────────────────────

export const storageBackendSourceSchema = z.enum(['built-in', 'env', 'settings']);
export const storageCategorySourceSchema = z.enum(['default', 'settings']);

export const storageReplicaFailureSchema = z.object({
  backend: z.string(),
  key: z.string(),
  /** 'list' is the backfill sweep phase's replica.list() failing. */
  op: z.enum(['put', 'delete', 'stat', 'list']),
  error: z.string(),
  at: z.number(),
});

// ── Backfill + usage (backfill/stats/notifications spec) ─────────────────────

export const storageBackfillStatusSchema = z.object({
  /** The mirror's wire name — user-facing copy says "Sync", never this. */
  backend: z.string(),
  status: z.enum(['running', 'done', 'error', 'cancelled']),
  /** Objects examined in the copy phase; total is 0 while enumerating. */
  done: z.number(),
  total: z.number(),
  copied: z.number(),
  skipped: z.number(),
  failed: z.number(),
  /** Replica objects removed by the sweep phase — absent from the primary and not raced back. */
  deleted: z.number(),
  startedAt: z.number(),
  finishedAt: z.number().optional(),
  /** status 'error' only: the aborting (primary-side) error. */
  error: z.string().optional(),
});
export type StorageBackfillStatus = z.infer<typeof storageBackfillStatusSchema>;

// ── Category migration (copy → flip → delta sweep) ────────────────────────────

export const storageMigrationStatusSchema = z.object({
  category: storageCategorySchema,
  from: z.string(),
  to: z.string(),
  status: z.enum(['running', 'done', 'failed', 'cancelled']),
  /** Keys examined in the copy phase; total is 0 while enumerating. */
  done: z.number(),
  total: z.number(),
  copied: z.number(),
  skipped: z.number(),
  failed: z.number(),
  startedAt: z.number(),
  finishedAt: z.number().optional(),
  /** status 'failed' only: the aborting error (copy failures also set counts). */
  error: z.string().optional(),
  /** Terminal 'done' only: objects/bytes left on the old backend. */
  reclaimable: z.object({ objects: z.number(), bytes: z.number() }).optional(),
});
export type StorageMigrationStatus = z.infer<typeof storageMigrationStatusSchema>;

export const storageUsageSchema = z.object({
  computedAt: z.number(),
  categories: z.record(storageCategorySchema, z.object({ objects: z.number(), bytes: z.number() })),
  /** The served-legacy photos directory — attributed to whatever backend `photos` resolves to. */
  legacyPhotos: z.object({ objects: z.number(), bytes: z.number() }),
});
export type StorageUsage = z.infer<typeof storageUsageSchema>;

export const storageAdminStateSchema = z.object({
  backends: z.array(
    z.object({
      name: z.string(),
      type: z.enum(STORAGE_BACKEND_TYPE_IDS),
      source: storageBackendSourceSchema,
      /** Secret-kind fields carry MASKED_SETTING_VALUE — never a stored value. */
      options: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.string())])),
      categories: z.array(storageCategorySchema),
    }),
  ),
  // Exhaustive record: the effective world always maps all eight configurable categories.
  categories: z.record(
    storageCategorySchema,
    z.object({ backend: z.string().min(1), source: storageCategorySourceSchema }),
  ),
  health: z.object({ replicaFailures: z.array(storageReplicaFailureSchema) }),
  seedFilePresent: z.boolean(),
  usage: storageUsageSchema.nullable(),
  backfills: z.array(storageBackfillStatusSchema),
  migrations: z.array(storageMigrationStatusSchema),
  /** Optimistic-concurrency counter for the two settings rows (audit #7) — echo it back on the next PUT. */
  version: z.number().int().nonnegative(),
  /**
   * Non-null when the stored storage settings failed to parse/validate and
   * the registry fell back to the last-good config (or built-in defaults) —
   * the admin panel renders this as a warning banner so a save is never a
   * silent replacement of a config the operator never actually saw (audit
   * minor). Null once the stored settings load cleanly.
   */
  configError: z.string().nullable(),
});
export type StorageAdminState = z.infer<typeof storageAdminStateSchema>;

export const storageTestRequestSchema = z.strictObject({ backend: storageBackendSchema });
export type StorageTestRequest = z.infer<typeof storageTestRequestSchema>;

export const storageMigrationRequestSchema = z.strictObject({
  category: storageCategorySchema,
  to: z.string().min(1),
});
export type StorageMigrationRequest = z.infer<typeof storageMigrationRequestSchema>;

export const storageTestResponseSchema = z.object({
  ok: z.boolean(),
  targets: z.array(z.object({ name: z.string(), ok: z.boolean(), error: z.string().optional() })),
});
export type StorageTestResponse = z.infer<typeof storageTestResponseSchema>;
