import { z } from 'zod';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat';

/**
 * Converts a plugin's declared JSON Schema into the Zod shape the MCP SDK needs.
 *
 * A plugin lives in another process, so it can only ship its tool schema as plain
 * JSON — but `McpServer.registerTool` takes Zod (it owns the JSON-Schema rendering in
 * tools/list, and the low-level alternative would mean re-implementing the SDK's own
 * tools/list + tools/call handlers). This bridges the two.
 *
 * PERMISSIVE BY DESIGN. The output is what the SDK validates incoming arguments
 * against before the plugin sees them, so a strict reading of a schema this converter
 * only half-understands would reject calls the plugin would have handled fine.
 * Anything unrecognized therefore becomes `z.unknown()` — advertised to the model as
 * an unconstrained value rather than dropped or guessed at. The plugin is documented
 * to validate its own input regardless; this is about advertising a useful schema,
 * not about enforcing one.
 *
 * The input is untrusted (a plugin can report any JSON at all), hence the depth and
 * property ceilings — a deeply nested or enormous schema is bounded, not trusted.
 */

const MAX_DEPTH = 8;
const MAX_PROPERTIES = 64;
const MAX_ENUM_VALUES = 64;

type JsonObject = Record<string, unknown>;

function isPlainObject(v: unknown): v is JsonObject {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function described(schema: z.ZodTypeAny, node: JsonObject): z.ZodTypeAny {
  // Property descriptions are half of what a model reads before it fills a tool call
  // in, so they have to survive the round-trip back out through tools/list.
  return typeof node.description === 'string' && node.description ? schema.describe(node.description) : schema;
}

function convertNode(node: unknown, depth: number): z.ZodTypeAny {
  if (depth > MAX_DEPTH || !isPlainObject(node)) return z.unknown();

  // An enum pins the value far more usefully than its type does, so it wins.
  if (Array.isArray(node.enum)) {
    const values = node.enum.slice(0, MAX_ENUM_VALUES);
    if (values.length && values.every((v): v is string => typeof v === 'string')) {
      return described(z.enum(values as [string, ...string[]]), node);
    }
    return described(z.unknown(), node);
  }

  switch (node.type) {
    case 'string':
      return described(z.string(), node);
    case 'number':
      return described(z.number(), node);
    case 'integer':
      return described(z.number().int(), node);
    case 'boolean':
      return described(z.boolean(), node);
    case 'array':
      return described(z.array(convertNode(node.items, depth + 1)), node);
    case 'object': {
      const shape = shapeOf(node, depth + 1);
      // An object with no usable `properties` is a free-form bag. z.object({}) would
      // STRIP every key on the way to the handler, so keep it open instead.
      return described(shape ? z.object(shape) : z.record(z.string(), z.unknown()), node);
    }
    default:
      // No type, a union of types, $ref, oneOf/anyOf, … — unconstrained.
      return described(z.unknown(), node);
  }
}

/** The property map of an object node, or undefined when it declares none. */
function shapeOf(node: JsonObject, depth: number): Record<string, z.ZodTypeAny> | undefined {
  if (!isPlainObject(node.properties)) return undefined;
  const required = new Set(
    Array.isArray(node.required) ? node.required.filter((r): r is string => typeof r === 'string') : [],
  );
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const [key, value] of Object.entries(node.properties).slice(0, MAX_PROPERTIES)) {
    const converted = convertNode(value, depth);
    shape[key] = required.has(key) ? converted : converted.optional();
  }
  return Object.keys(shape).length ? shape : undefined;
}

/**
 * The raw shape for a tool's arguments, or undefined for a tool that takes none.
 *
 * Undefined is also the answer for a schema that isn't a usable object schema at all
 * (MCP requires the top level to be an object): a zero-argument tool is the honest,
 * safe reading of "the plugin declared something we cannot interpret".
 */
export function jsonSchemaToZodShape(schema: unknown): ZodRawShapeCompat | undefined {
  if (!isPlainObject(schema)) return undefined;
  return shapeOf(schema, 1);
}
