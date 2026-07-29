/**
 * The MCP tool declarations a plugin reports at load, and the caps the host puts on
 * them (#plugins).
 *
 * A child reports whatever its `mcpTools` array says — untrusted, unvalidated, and
 * destined for a tools/list response that a model reads and acts on. So everything
 * lands here first: names are shape-checked, text is capped and emoji-stripped like
 * every other string TREK renders in its own chrome, and anything that fails is
 * DROPPED WHOLE rather than truncated into a tool whose description no longer matches
 * what it does. Pure (no imports with side effects) so the supervisor and the tests
 * can both use it.
 */

import { stripEmoji } from './text-sanitize';

/** The MCP behaviour hints, exactly as the protocol defines them. Advisory: TREK
 *  passes them through to the client and enforces none of them. */
export interface McpToolAnnotationHints {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

/** One tool a plugin advertises. The handler stays in the child — this is the
 *  declarative half, cached host-side and served from memory at session start. */
export interface PluginMcpToolReport {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: McpToolAnnotationHints;
}

/** Tools one plugin may advertise. A model's tool list is finite attention — a plugin
 *  that wants 50 tools is a plugin that should want fewer. */
export const MAX_MCP_TOOLS_PER_PLUGIN = 16;
/** snake_case, and short enough that `plugin_<id>_<name>` stays inside MAX_PUBLIC_NAME. */
export const MCP_TOOL_NAME_RE = /^[a-z][a-z0-9_]{0,47}$/;
/** MCP clients (Claude among them) reject a tool name longer than this. */
export const MAX_PUBLIC_TOOL_NAME = 64;
const MAX_TITLE = 80;
const MAX_DESCRIPTION = 4096;
/** Serialized schema ceiling — a schema is sent to the model on every request. */
const MAX_INPUT_SCHEMA_BYTES = 16 * 1024;

/** The four MCP behaviour hints. Anything else a plugin invents is dropped. */
const ANNOTATION_KEYS = ['readOnlyHint', 'destructiveHint', 'idempotentHint', 'openWorldHint'] as const;

/**
 * The name an MCP client sees. Namespaced by plugin id, which makes a collision
 * between two plugins impossible: ids match /^[a-z][a-z0-9-]{2,39}$/ (no underscore)
 * and tool names carry no dash, so the first `_` after the id always terminates it.
 */
export function publicMcpToolName(pluginId: string, name: string): string {
  return `plugin_${pluginId}_${name}`;
}

function cappedText(v: unknown, max: number): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = stripEmoji(v).trim();
  return s.length > 0 && s.length <= max ? s : undefined;
}

function normalizeSchema(v: unknown): Record<string, unknown> | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  let serialized: string;
  try {
    serialized = JSON.stringify(v);
  } catch {
    return undefined; // circular / non-serialisable — it could never cross the wire anyway
  }
  if (serialized.length > MAX_INPUT_SCHEMA_BYTES) return undefined;
  return v as Record<string, unknown>;
}

function normalizeAnnotations(v: unknown): McpToolAnnotationHints | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const src = v as Record<string, unknown>;
  const out: McpToolAnnotationHints = {};
  for (const k of ANNOTATION_KEYS) if (typeof src[k] === 'boolean') out[k] = src[k];
  return Object.keys(out).length ? out : undefined;
}

/**
 * Validate + cap what a child reported. Invalid entries are dropped (never repaired):
 * a tool with a 5000-character description truncated to 4096 would be advertised to a
 * model with its instructions cut mid-sentence, which is worse than not existing.
 * First-wins on a duplicate name, matching how the supervisor treats provider order.
 */
export function normalizeMcpToolReports(raw: unknown, pluginId: string): PluginMcpToolReport[] {
  if (!Array.isArray(raw)) return [];
  const out: PluginMcpToolReport[] = [];
  const seen = new Set<string>();
  for (const entry of raw.slice(0, MAX_MCP_TOOLS_PER_PLUGIN)) {
    if (!entry || typeof entry !== 'object') continue;
    const t = entry as Record<string, unknown>;
    const name = typeof t.name === 'string' ? t.name : '';
    if (!MCP_TOOL_NAME_RE.test(name) || seen.has(name)) continue;
    if (publicMcpToolName(pluginId, name).length > MAX_PUBLIC_TOOL_NAME) continue;
    // The description is the only thing a model reads to decide whether to call —
    // a tool without one is not advertisable.
    const description = cappedText(t.description, MAX_DESCRIPTION);
    if (!description) continue;
    seen.add(name);
    out.push({
      name,
      title: cappedText(t.title, MAX_TITLE),
      description,
      inputSchema: normalizeSchema(t.inputSchema),
      annotations: normalizeAnnotations(t.annotations),
    });
  }
  return out;
}
