import { z } from 'zod';

export const FORMAT = 'travel-transfer/1';
export const CHUNK = 1024 * 1024;
export const MAX_GRAPH = 64 * CHUNK;
export const MAX_ORIGINAL = 512 * CHUNK;
export const MAX_RECORDS = 20000;
export const token = z
  .string()
  .min(1)
  .max(200)
  .refine((value) => [...value].every((char) => char.charCodeAt(0) >= 32), 'Control characters are not allowed');
export const digest = z.string().regex(/^[a-f0-9]{64}$/);
const manifest = z.enum(['present', 'empty', 'unknown', 'unavailable', 'extension']);
export const recordSchema = z.strictObject({
  id: token,
  kind: token.max(100),
  visibility: z.enum(['trip', 'private']),
  fields: z.record(z.string(), z.unknown()),
  references: z.record(z.string(), token.nullable()),
  source: z.looseObject({ fields: z.record(z.string(), manifest) }),
});
export const originalSchema = z.strictObject({
  id: token,
  record: token,
  sha256: digest,
  size: z.number().int().min(0).max(MAX_ORIGINAL),
});
export const graphSchema = z.strictObject({
  format: z.literal(FORMAT),
  trip: token,
  revision: token,
  complete: z.literal(true),
  records: z.array(recordSchema).max(MAX_RECORDS),
  originals: z.array(originalSchema).max(MAX_RECORDS),
});

export const targetSchema = { trip_id: token.nullable(), include_private: z.boolean().default(false) };
export const operationSchema = { ...targetSchema, operation_id: token };
export const chunkSchema = {
  offset: z.number().int().min(0).max(MAX_ORIGINAL),
  total: z.number().int().min(0).max(MAX_ORIGINAL),
  chunk_sha256: digest,
  data: z.string().max(4 * Math.ceil(CHUNK / 3)),
};
export const listSchema = z.strictObject({
  cursor: token.nullable().default(null),
  limit: z.number().int().min(1).max(100).default(100),
});
export const snapshotSchema = z.strictObject({
  ...targetSchema,
  trip_id: token,
  revision: token.nullable().default(null),
  cursor: token.nullable().default(null),
});
export const readSchema = z.strictObject({
  trip_id: token,
  revision: token,
  id: token,
  offset: chunkSchema.offset,
  limit: z.number().int().min(1).max(CHUNK),
});
export const writeSchema = z.strictObject({ ...operationSchema, ...chunkSchema, id: token, sha256: digest });
export const stageSchema = z.strictObject({
  ...operationSchema,
  ...chunkSchema,
  total: z.number().int().min(1).max(MAX_GRAPH),
  payload_digest: digest,
});
export const receiptSchema = z.strictObject({ ...operationSchema, payload_digest: digest });
export const applySchema = z.strictObject({
  ...receiptSchema.shape,
  expected_revision: token.nullable(),
  original_ids: z.array(token).max(MAX_RECORDS),
});
