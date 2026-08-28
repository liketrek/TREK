/**
 * Everything a plugin-authored MCP tool has to survive before it reaches an
 * assistant: the advertised name, the bounded text, the JSON Schema, and the
 * annotations a client gates auto-approval on.
 *
 * Pure and Nest-free on purpose. This is the security control for the whole
 * feature, so it is testable without a container, a DB or a running plugin.
 *
 * The threat is not a plugin crashing. It is a plugin writing instructions into
 * every user's assistant context, invisibly to the admin who granted it, and
 * being obeyed. TREK's own code is the proof that the channel works: the
 * static-token deprecation notice is delivered in a tool RESULT precisely
 * because that is what an assistant reliably surfaces.
 */
import { sanitiseAssistantText } from './text-sanitize';

import { z } from 'zod';

import type { McpZodSchema } from '../../nest-mcp';

/** Tools one plugin may advertise. A long list crowds out the built-ins. */
export const MCP_TOOLS_MAX = 8;

/**
 * Tools all plugins together may advertise.
 *
 * Not in the spec, added here: at 8 each, twenty installed plugins would put 160
 * tools in front of a model that already chooses from ~200, and tool selection
 * degrades long before that. Truncation is logged, never silent.
 */
export const MCP_TOOLS_TOTAL_MAX = 32;

/** Plugin-local tool name. No dot or dash, so the advertised name parses apart. */
export const TOOL_NAME_RE = /^[a-z0-9_]{1,48}$/;

export const TOOL_TITLE_MAX = 80;
export const TOOL_DESCRIPTION_MAX = 1024;

/** Nested strings get their own, tighter caps; there can be many of them. */
export const SCHEMA_TITLE_MAX = 80;
export const SCHEMA_DESCRIPTION_MAX = 512;
export const SCHEMA_ENUM_VALUE_MAX = 64;

export const SCHEMA_BYTES_MAX = 8 * 1024;
export const SCHEMA_PROPERTIES_MAX = 64;
export const SCHEMA_ENUM_MAX = 32;
export const SCHEMA_DEPTH_MAX = 5;

/** Raised for a declaration the host will not advertise. */
export class McpToolSchemaError extends Error {}

/**
 * The name a plugin tool is advertised under.
 *
 * A plugin id matches /^[a-z][a-z0-9-]{2,39}$/, so it can never contain `_`,
 * and a local name can never contain `-`. The prefix therefore parses apart
 * unambiguously at the first `_` after `plugin_`. The prefix also makes an
 * Object.prototype key like `constructor` impossible to advertise.
 *
 * Worst case is 7 + 40 + 1 + 48 = 96 characters, inside the SDK's 128 limit.
 */
export function mcpToolName(pluginId: string, name: string): string {
  return `plugin_${pluginId}_${name}`;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Keys that must not survive into the advertisement, each for its own reason. */
const STRIPPED_ROOT_KEYS = [
  // Consumed by Zod's registry rather than advertised, and pinned into
  // z.globalRegistry._idmap — a strong Map, unlike the WeakMap holding the rest.
  'id',
  // Re-emitted by the SDK itself; a plugin-supplied one only ever disagrees.
  '$id',
  '$schema',
];

/** Rejected at any depth: the host cannot resolve them and clients disagree on them. */
const FORBIDDEN_KEYS = ['$ref', '$defs', 'definitions'];

interface Counters {
  properties: number;
}

function sanitiseNode(node: unknown, depth: number, counters: Counters): unknown {
  if (Array.isArray(node)) return node.map((item) => sanitiseNode(item, depth, counters));
  if (!isPlainObject(node)) return node;
  if (depth > SCHEMA_DEPTH_MAX) {
    throw new McpToolSchemaError(`schema nests deeper than ${SCHEMA_DEPTH_MAX} levels`);
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (FORBIDDEN_KEYS.includes(key)) {
      throw new McpToolSchemaError(`schema uses "${key}", which is not supported`);
    }
    if (key === 'description') {
      out[key] = sanitiseAssistantText(value, SCHEMA_DESCRIPTION_MAX);
      continue;
    }
    if (key === 'title') {
      out[key] = sanitiseAssistantText(value, SCHEMA_TITLE_MAX);
      continue;
    }
    if (key === 'const' && typeof value === 'string') {
      out[key] = sanitiseAssistantText(value, SCHEMA_ENUM_VALUE_MAX);
      continue;
    }
    if (key === 'enum' && Array.isArray(value)) {
      if (value.length > SCHEMA_ENUM_MAX) {
        throw new McpToolSchemaError(`an enum lists more than ${SCHEMA_ENUM_MAX} values`);
      }
      // Only the string members: a number or boolean carries no instructions.
      out[key] = value.map((m) => (typeof m === 'string' ? sanitiseAssistantText(m, SCHEMA_ENUM_VALUE_MAX) : m));
      continue;
    }
    if (key === 'properties' && isPlainObject(value)) {
      const props: Record<string, unknown> = {};
      for (const [propName, propSchema] of Object.entries(value)) {
        counters.properties += 1;
        if (counters.properties > SCHEMA_PROPERTIES_MAX) {
          throw new McpToolSchemaError(`schema declares more than ${SCHEMA_PROPERTIES_MAX} properties`);
        }
        props[propName] = sanitiseNode(propSchema, depth + 1, counters);
      }
      out[key] = props;
      continue;
    }
    out[key] = sanitiseNode(value, depth + 1, counters);
  }
  return out;
}

/**
 * Validate and clean a plugin's JSON Schema so it can be advertised verbatim.
 *
 * `.meta()` is a passthrough straight into the assistant's context, which is
 * what makes this function the control rather than a convenience. Returns
 * undefined for an absent schema, meaning a tool that takes no arguments.
 */
export function normaliseToolSchema(raw: unknown): Record<string, unknown> | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (!isPlainObject(raw)) throw new McpToolSchemaError('schema must be an object');

  // A root `type` of anything but object advertises a non-object inputSchema
  // while the runtime still hands the handler an object. The advertisement
  // would simply be a lie, and the model would act on it.
  if (raw.type !== undefined && raw.type !== 'object') {
    throw new McpToolSchemaError(`schema root type must be "object", got ${JSON.stringify(raw.type)}`);
  }

  const bytes = Buffer.byteLength(JSON.stringify(raw) ?? '', 'utf8');
  if (bytes > SCHEMA_BYTES_MAX) {
    throw new McpToolSchemaError(`schema is ${bytes} bytes, over the ${SCHEMA_BYTES_MAX} limit`);
  }

  const cleaned = sanitiseNode(raw, 0, { properties: 0 }) as Record<string, unknown>;
  for (const key of STRIPPED_ROOT_KEYS) delete cleaned[key];
  cleaned.type = 'object';
  return cleaned;
}

/**
 * JSON Schema keywords the validator below can actually enforce.
 *
 * Anything outside this set is REJECTED at parse time rather than advertised.
 * A keyword that reaches the model but not the runtime is the worst of both:
 * the model is told `additionalProperties: false` and an enum, formats its call
 * accordingly, and the handler then receives whatever a caller actually sent.
 */
const SUPPORTED_KEYWORDS = new Set([
  'type', 'properties', 'required', 'additionalProperties', 'items',
  'enum', 'const', 'description', 'title', 'default', 'examples',
  'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf',
  'minLength', 'maxLength', 'pattern', 'format',
  'minItems', 'maxItems', 'uniqueItems',
  'nullable',
]);

const SUPPORTED_TYPES = new Set(['object', 'string', 'number', 'integer', 'boolean', 'array', 'null']);

/** Formats worth enforcing. An unlisted one would be advertised and never checked. */
const FORMAT_CHECKS: Record<string, (v: string) => boolean> = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  uuid: (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
  uri: (v) => /^[a-z][a-z0-9+.-]*:/i.test(v),
  'date-time': (v) => !Number.isNaN(Date.parse(v)),
  date: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),
};

/** The `required` names a normalised schema declares. */
function requiredKeys(schema: Record<string, unknown> | undefined): string[] {
  const req = schema?.required;
  return Array.isArray(req) ? req.filter((k): k is string => typeof k === 'string') : [];
}

/**
 * A Zod schema matching exactly these values, and representable as JSON Schema.
 *
 * Only the JSON primitives are allowed: an object or array member could not be
 * expressed as a literal, and silently widening it would advertise a closed set
 * while accepting an open one.
 */
function literalUnion(values: readonly unknown[], path: string): z.ZodType {
  const parts = values.map((v) => {
    if (v === null) return z.null();
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return z.literal(v);
    throw new McpToolSchemaError(`${path}: enum and const members must be primitives`);
  });
  return parts.length === 1 ? parts[0] : z.union(parts as unknown as [z.ZodType, z.ZodType, ...z.ZodType[]]);
}

/**
 * Turn one normalised JSON Schema node into a Zod schema that enforces it.
 *
 * Throws McpToolSchemaError for anything it cannot express, so parseManifest
 * refuses the declaration instead of advertising a constraint nothing checks.
 */
function nodeToZod(node: unknown, path: string): z.ZodType {
  if (!isPlainObject(node)) throw new McpToolSchemaError(`${path}: schema node must be an object`);

  for (const key of Object.keys(node)) {
    if (!SUPPORTED_KEYWORDS.has(key)) {
      throw new McpToolSchemaError(`${path}: unsupported schema keyword "${key}"`);
    }
  }

  // An enum or const pins the value set outright, whatever `type` says.
  //
  // Built from real literal types rather than a predicate: z.custom() cannot be
  // represented in JSON Schema, and the SDK renders tools/list by walking this
  // schema, so a predicate here throws for the whole session the first time a
  // client lists tools.
  if (Array.isArray(node.enum)) {
    const values = node.enum;
    if (!values.length) throw new McpToolSchemaError(`${path}: enum is empty`);
    return literalUnion(values, path);
  }
  if ('const' in node) return literalUnion([node.const], path);

  const type = node.type;
  if (type === undefined) {
    // Nothing declared, so nothing to under-enforce. An open field is allowed.
    return z.unknown();
  }
  if (typeof type !== 'string' || !SUPPORTED_TYPES.has(type)) {
    throw new McpToolSchemaError(`${path}: unsupported type ${JSON.stringify(type)}`);
  }

  let out: z.ZodType;
  switch (type) {
    case 'string': {
      let sc = z.string();
      if (typeof node.minLength === 'number') sc = sc.min(node.minLength);
      if (typeof node.maxLength === 'number') sc = sc.max(node.maxLength);
      if (typeof node.pattern === 'string') {
        let re: RegExp;
        try {
          re = new RegExp(node.pattern);
        } catch {
          throw new McpToolSchemaError(`${path}: pattern is not a valid regular expression`);
        }
        sc = sc.regex(re);
      }
      if (typeof node.format === 'string') {
        const check = FORMAT_CHECKS[node.format];
        if (!check) throw new McpToolSchemaError(`${path}: unsupported format "${node.format}"`);
        out = sc.refine(check, { message: `must be a valid ${node.format}` });
        break;
      }
      out = sc;
      break;
    }
    case 'integer':
    case 'number': {
      let nc = z.number();
      if (type === 'integer') nc = nc.int();
      if (typeof node.minimum === 'number') nc = nc.min(node.minimum);
      if (typeof node.maximum === 'number') nc = nc.max(node.maximum);
      if (typeof node.exclusiveMinimum === 'number') nc = nc.gt(node.exclusiveMinimum);
      if (typeof node.exclusiveMaximum === 'number') nc = nc.lt(node.exclusiveMaximum);
      if (typeof node.multipleOf === 'number') nc = nc.multipleOf(node.multipleOf);
      out = nc;
      break;
    }
    case 'boolean':
      out = z.boolean();
      break;
    case 'null':
      out = z.null();
      break;
    case 'array': {
      const items = node.items === undefined ? z.unknown() : nodeToZod(node.items, `${path}.items`);
      let ac = z.array(items);
      if (typeof node.minItems === 'number') ac = ac.min(node.minItems);
      if (typeof node.maxItems === 'number') ac = ac.max(node.maxItems);
      out = node.uniqueItems === true
        ? ac.refine((v) => new Set(v.map((x) => JSON.stringify(x))).size === v.length, { message: 'items must be unique' })
        : ac;
      break;
    }
    default: {
      const props = isPlainObject(node.properties) ? node.properties : {};
      const required = new Set(requiredKeys(node));
      const shape: Record<string, z.ZodType> = {};
      for (const [name, child] of Object.entries(props)) {
        // Every field is optional in the SHAPE, with presence enforced by the
        // check below. A required field declared non-optional here would fail
        // its own type check on undefined and report "expected string, received
        // undefined", which reads to a model like a type problem rather than a
        // field it forgot to send.
        shape[name] = nodeToZod(child, `${path}.${name}`).optional();
      }
      // additionalProperties: false is the keyword a model actually acts on, so
      // it has to mean something at runtime too.
      const base = node.additionalProperties === false ? z.strictObject(shape) : z.looseObject(shape);
      out = required.size
        ? base.check((ctx) => {
            for (const name of required) {
              if (!(name in (ctx.value as Record<string, unknown>))) {
                ctx.issues.push({
                  code: 'custom',
                  input: ctx.value,
                  path: [name],
                  message: `Required property "${name}" is missing`,
                });
              }
            }
          })
        : base;
      break;
    }
  }

  return node.nullable === true ? out.nullable() : out;
}

/**
 * The Zod schema handed to registerTool.
 *
 * Two jobs that used to be one. `.meta(normalised)` still advertises the
 * plugin's own schema byte for byte, which is why nothing is converted for
 * display. The schema underneath now ENFORCES that same declaration, built from
 * the same normalised object: advertising `additionalProperties: false` and an
 * enum while accepting anything is a contract the SDK and every client read as
 * "arguments are validated before the handler runs".
 *
 * The two cannot drift, because nodeToZod throws on any keyword it cannot
 * enforce and parseManifest then refuses the declaration outright.
 */
export function buildToolInputSchema(normalised: Record<string, unknown> | undefined): McpZodSchema {
  if (!normalised) return z.looseObject({}) as unknown as McpZodSchema;
  const validator = nodeToZod(normalised, 'inputSchema');
  return validator.meta(normalised) as unknown as McpZodSchema;
}

/**
 * The four hints the MCP spec defines. Anything else a plugin sends is dropped.
 *
 * A type alias rather than an interface so it keeps an implicit index signature
 * and stays assignable to ToolOptions.annotations (Record<string, unknown>).
 */
export type McpToolAnnotations = {
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
};

/**
 * Grants that let a plugin READ, and nothing more.
 *
 * Deliberately an allowlist, so the classification fails CLOSED: a permission
 * family nobody thought about here counts as a side effect and costs the plugin
 * its read-only hint, rather than silently letting it advertise a write tool as
 * safe to auto-approve. An earlier denylist spelled out `db:write:` and missed
 * `db:create:trips` entirely.
 *
 * `mcp-tool-annotations.test.ts` walks KNOWN_PERMISSIONS and pins every entry's
 * classification, so a new permission shows up as a failing test rather than as
 * a wrong hint in production.
 */
function isReadOnlyGrant(g: string): boolean {
  // Reads of TREK's own data.
  if (g.startsWith('db:read:')) return true;
  // Service reads: rates:read, weather:read, geolocation:read.
  if (g.endsWith(':read')) return true;
  // The plugin's private SQLite, invisible to TREK. Counting it would make
  // nearly every plugin non-read-only and kill auto-approval for legitimate
  // read tools, which is the whole thing the hint exists to allow.
  if (g === 'db:own') return true;
  // Host-to-plugin entry points. These grant the plugin nothing: they are the
  // host's permission to CALL it. A photo provider is not a writer.
  if (g.startsWith('hook:')) return true;
  // Receiving events is a read; acting on one needs a separate grant.
  if (g === 'events:subscribe') return true;
  return false;
}

/**
 * Reconcile a plugin's declared annotations with what its grants actually allow.
 *
 * The asymmetry is the point. `readOnlyHint` is what clients gate auto-approval
 * on, so a plugin may lower its own danger level but never raise it: a plugin
 * holding db:write:trips does not get to call itself read-only and be run
 * without a prompt. `openWorldHint` goes the other way, since a plugin that can
 * reach the internet is open-world whether it says so or not.
 *
 * What counts as read-only is isReadOnlyGrant above, which fails closed.
 */
export function clampToolAnnotations(declared: unknown, grants: ReadonlySet<string>): McpToolAnnotations {
  const d = isPlainObject(declared) ? declared : {};
  const writes = [...grants].some((g) => !isReadOnlyGrant(g));
  const egress = [...grants].some((g) => g === 'http:outbound' || g.startsWith('http:outbound:'));

  const readOnlyHint = d.readOnlyHint === true && !writes;
  return {
    readOnlyHint,
    // A read-only tool is not destructive; otherwise believe the plugin, and
    // default to destructive when it says nothing.
    destructiveHint: readOnlyHint ? false : d.destructiveHint !== false,
    idempotentHint: readOnlyHint ? true : d.idempotentHint === true,
    openWorldHint: d.openWorldHint === true || egress,
  };
}

/** A tool declaration after the host has bounded every string a model will read. */
export interface SanitisedToolText {
  title?: string;
  description: string;
}

/**
 * Bound the two free-text fields. Description is required because it is the only
 * thing the model reads to decide whether to call the tool; a tool with none is
 * invisible but still callable, which is worse than absent.
 */
export function sanitiseToolText(title: unknown, description: unknown): SanitisedToolText {
  const cleanTitle = sanitiseAssistantText(title, TOOL_TITLE_MAX);
  const cleanDescription = sanitiseAssistantText(description, TOOL_DESCRIPTION_MAX);
  if (!cleanDescription) throw new McpToolSchemaError('description is required');
  return { ...(cleanTitle ? { title: cleanTitle } : {}), description: cleanDescription };
}
