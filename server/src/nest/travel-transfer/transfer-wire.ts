import { DomainError } from '../common/domain-error';
import { travelTransfer } from '@trek/shared';

import { createHash } from 'node:crypto';
import type { z } from 'zod';

export const {
  FORMAT,
  CHUNK,
  MAX_GRAPH,
  MAX_ORIGINAL,
  MAX_RECORDS,
  recordSchema,
  originalSchema,
  graphSchema,
  targetSchema,
  operationSchema,
  chunkSchema,
  listSchema,
  snapshotSchema,
  readSchema,
  writeSchema,
  stageSchema,
  receiptSchema,
  applySchema,
} = travelTransfer;
export type Graph = z.infer<typeof graphSchema>;
export type TransferRecord = Graph['records'][number];
export function fail(message: string, status = 409): never {
  throw new DomainError(status, message);
}
export const sha = (data: string | Buffer): string => createHash('sha256').update(data).digest('hex');
/** Sorted UTF-8 keys; source quantities requiring exact decimals are strings. */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map((k) => JSON.stringify(k) + ':' + canonical((value as Record<string, unknown>)[k]))
        .join(',') +
      '}'
    );
  return JSON.stringify(value);
}
function validJson(value: unknown, depth = 0): void {
  if (depth > 30) fail('Transfer nesting exceeds limit', 422);
  if (typeof value === 'string' && (value.includes('\0') || value.length > CHUNK))
    fail('Transfer text exceeds limit', 422);
  if (typeof value === 'number' && !Number.isFinite(value)) fail('Non-finite transfer value', 422);
  if (value && typeof value === 'object') {
    if (
      !Array.isArray(value) &&
      Object.keys(value).length === 1 &&
      (value as Record<string, unknown>)['$transfer'] === 'absent'
    )
      fail('Reserved transfer marker', 422);
    for (const [key, item] of Object.entries(value)) {
      if (!Array.isArray(value) && (!key || key.length > 512 || [...key].some((c) => c.charCodeAt(0) < 32)))
        fail('Invalid field name', 422);
      validJson(item, depth + 1);
    }
  }
}
export function validateGraph(input: unknown): Graph {
  const parsed = graphSchema.safeParse(input);
  if (!parsed.success) fail('Invalid transfer graph', 422);
  const graph = parsed.data;
  validJson(graph);
  if (Buffer.byteLength(canonical(graph)) > MAX_GRAPH) fail('Graph exceeds limit', 413);
  const ids = new Set(graph.records.map((r) => r.id));
  if (ids.size !== graph.records.length) fail('Duplicate record identity', 422);
  for (const r of graph.records) {
    // A graph must be readable after apply; records are indivisible on paginated snapshots.
    if (Buffer.byteLength(canonical(r)) > CHUNK - 4096) fail('Record exceeds snapshot page limit', 413);
    if (canonical(Object.keys(r.fields).sort()) !== canonical(Object.keys(r.source.fields).sort()))
      fail('Incomplete field manifest', 422);
    if (['private', 'trip'].includes(String(r.fields.audience)) && r.fields.audience !== r.visibility)
      fail('Audience mismatch', 422);
    for (const ref of Object.values(r.references)) if (ref !== null && !ids.has(ref)) fail('Missing relationship', 422);
  }
  const files = new Set<string>();
  for (const o of graph.originals) {
    if (files.has(o.id) || !ids.has(o.record)) fail('Invalid original identity', 422);
    files.add(o.id);
  }
  if (!graph.records.some((r) => r.id === 'trip' && r.kind === 'trip' && r.visibility === 'trip'))
    fail('A shared trip root is required', 422);
  return graph;
}
export function selected(graph: Graph, includePrivate: boolean): Graph {
  const records = graph.records.filter((r) => includePrivate || r.visibility === 'trip');
  const ids = new Set(records.map((r) => r.id));
  // Do not silently sever a shared-to-private relationship.
  return validateGraph({ ...graph, records, originals: graph.originals.filter((o) => ids.has(o.record)) });
}
export function scopedMerge(previous: Graph, incoming: Graph, includePrivate: boolean): Graph {
  if (includePrivate) return incoming;
  if (incoming.records.some((r) => r.visibility !== 'trip')) fail('Private records require explicit selection');
  const keep = previous.records.filter((r) => r.visibility === 'private');
  const privateIds = new Set(keep.map((r) => r.id));
  if (incoming.records.some((r) => privateIds.has(r.id))) fail('Record collides with an unselected identity');
  const keepFiles = previous.originals.filter((o) => privateIds.has(o.record));
  if (incoming.originals.some((o) => keepFiles.some((old) => old.id === o.id)))
    fail('Original collides with an unselected identity');
  return validateGraph({
    ...incoming,
    records: [...incoming.records, ...keep],
    originals: [...incoming.originals, ...keepFiles],
  });
}
export type OperationInput = z.infer<typeof receiptSchema>;
export type ChunkInput = z.infer<typeof writeSchema>;
export type ApplyInput = z.infer<typeof applySchema>;

export type ListInput = z.infer<typeof listSchema>;
export type SnapshotInput = z.infer<typeof snapshotSchema>;
export type ReadInput = z.infer<typeof readSchema>;
export type StageInput = z.infer<typeof stageSchema>;
