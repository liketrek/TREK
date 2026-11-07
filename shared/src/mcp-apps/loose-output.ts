import { z } from 'zod';

/**
 * The same schema with every object open, all the way down.
 *
 * An MCP client validates a tool's `structuredContent` against the JSON Schema
 * the tool advertises, and Zod renders an output-side `z.object` as
 * `additionalProperties: false`. The row schemas the routes share are plain
 * objects that describe the wire without listing every column, so a client
 * would refuse a result for a column the schema leaves out. An output schema
 * is therefore declared once with the shared rows and opened here: a declared
 * key of another type still fails, an extra one passes, as on the REST side.
 *
 * Covers the kinds the output schemas are built from (objects, arrays,
 * optionals, nullables, defaults, records, unions) and carries each one's
 * checks (`.min`, `.max`, `.length`) over to the rebuilt schema; anything else
 * is returned as it is. It reads Zod's definition object (`_zod.def`), so
 * `loose-output.spec.ts` pins the kinds and the checks against the installed
 * Zod, and `mcp-tool-output.schema.spec.ts` holds every output schema to
 * rendering without a closed object.
 */
interface DefView {
  type: string;
  shape?: Record<string, z.ZodType>;
  innerType?: z.ZodType;
  element?: z.ZodType;
  keyType?: z.ZodType;
  valueType?: z.ZodType;
  options?: readonly z.ZodType[];
  defaultValue?: unknown;
  checks?: z.core.$ZodCheck<unknown>[];
}

export function looseOutput<T extends z.ZodType>(schema: T): T {
  return open(schema) as T;
}

function open(schema: z.ZodType): z.ZodType {
  const def = (schema as unknown as { _zod: { def: DefView } })._zod.def;
  const fresh = rebuild(def);
  if (!fresh) return schema;
  const checked = def.checks?.length ? fresh.check(...def.checks) : fresh;
  return schema.description ? checked.describe(schema.description) : checked;
}

function rebuild(def: DefView): z.ZodType | null {
  switch (def.type) {
    case 'object':
      return z.looseObject(Object.fromEntries(Object.entries(def.shape ?? {}).map(([k, v]) => [k, open(v)])));
    case 'array':
      return def.element ? z.array(open(def.element)) : null;
    case 'optional':
      return def.innerType ? open(def.innerType).optional() : null;
    case 'nullable':
      return def.innerType ? open(def.innerType).nullable() : null;
    case 'default':
      return def.innerType ? open(def.innerType).default(def.defaultValue as never) : null;
    case 'record':
      return def.keyType && def.valueType ? z.record(def.keyType as z.ZodType<string>, open(def.valueType)) : null;
    case 'union':
      return def.options && def.options.length >= 2
        ? z.union(def.options.map(open) as unknown as [z.ZodType, z.ZodType, ...z.ZodType[]])
        : null;
    default:
      return null;
  }
}
