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

/** The `required` names a normalised schema declares. */
function requiredKeys(schema: Record<string, unknown> | undefined): string[] {
  const req = schema?.required;
  return Array.isArray(req) ? req.filter((k): k is string => typeof k === 'string') : [];
}

/**
 * The Zod schema handed to registerTool.
 *
 * A loose object rather than a converted one: Zod merges registry metadata into
 * the toJSONSchema output the SDK renders tools/list from, so `.meta()`
 * advertises the plugin's own schema byte for byte, including the `pattern`,
 * `oneOf` and `format` keywords any hand-rolled converter would flatten away.
 *
 * The `.check()` is what keeps `required` real. Without it the loose object
 * accepts anything and the handler receives a call missing the arguments its
 * own schema said were mandatory. Extra keys still pass through, which is what
 * "loose" buys: a plugin may accept more than it advertises.
 */
export function buildToolInputSchema(normalised: Record<string, unknown> | undefined): McpZodSchema {
  const required = requiredKeys(normalised);
  const base = z.looseObject({}).check((ctx) => {
    for (const key of required) {
      if (!(key in (ctx.value as Record<string, unknown>))) {
        ctx.issues.push({
          code: 'custom',
          input: ctx.value,
          path: [key],
          message: `Required property "${key}" is missing`,
        });
      }
    }
  });
  return (normalised ? base.meta(normalised) : base) as unknown as McpZodSchema;
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

/** Grants that mean the plugin can change something outside its own sandbox. */
const SIDE_EFFECT_EXACT = new Set([
  'db:meta',
  'notify:send',
  'ai:invoke',
  'oauth:client',
  'ws:broadcast:trip',
  'ws:broadcast:user',
  'http:outbound',
]);
const SIDE_EFFECT_PREFIXES = ['db:write:', 'http:outbound:'];

/**
 * Reconcile a plugin's declared annotations with what its grants actually allow.
 *
 * The asymmetry is the point. `readOnlyHint` is what clients gate auto-approval
 * on, so a plugin may lower its own danger level but never raise it: a plugin
 * holding db:write:trips does not get to call itself read-only and be run
 * without a prompt. `openWorldHint` goes the other way, since a plugin that can
 * reach the internet is open-world whether it says so or not.
 *
 * `db:own` is deliberately NOT a side effect. It is the plugin's private SQLite,
 * invisible to TREK; counting it would make nearly every plugin non-read-only
 * and kill auto-approval for legitimate read tools.
 */
export function clampToolAnnotations(declared: unknown, grants: ReadonlySet<string>): McpToolAnnotations {
  const d = isPlainObject(declared) ? declared : {};
  const writes = [...grants].some(
    (g) => SIDE_EFFECT_EXACT.has(g) || SIDE_EFFECT_PREFIXES.some((p) => g.startsWith(p)),
  );
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
