/**
 * Result-shape helpers and tool-annotation presets shared by MCP handlers.
 * App-agnostic on purpose — host-specific canned errors (permission wording,
 * RBAC lookups, broadcasts) belong in the host, built on `errorResult`.
 */

/** The text-content result shape MCP tool handlers return. */
export interface McpTextResult {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}

/** Success result: `data` pretty-printed as a single JSON text block. */
export function ok(data: unknown): McpTextResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

/** A success result that also carries `data` as `structuredContent`; see `okStructured`. */
export interface McpStructuredResult<T extends Record<string, unknown>> extends McpTextResult {
  structuredContent: T;
}

/**
 * Success result for a tool that declares an `outputSchema`: the same text block
 * `ok()` writes, so a host that reads text sees nothing new, plus `data` as
 * `structuredContent`, which the SDK validates against the schema on every call
 * and which a widget (an MCP App) renders from. Claude Code hands the model the
 * structured value instead of the text, so it has to be the whole payload.
 */
export function okStructured<T extends Record<string, unknown>>(data: T): McpStructuredResult<T> {
  return { ...ok(data), structuredContent: data };
}

/**
 * The same result with a `_meta` of its own: what a host hands an MCP App beside
 * the result (a link back into TREK, say) without touching the text a host
 * without views reads, nor the `structuredContent` the output schema checks.
 */
export function withResultMeta<T extends McpTextResult>(
  result: T,
  meta: Record<string, unknown>,
): T & { _meta: Record<string, unknown> } {
  return { ...result, _meta: meta };
}

/** Error result with a verbatim message (no formatting, no prefix). */
export function errorResult(text: string): McpTextResult {
  return { content: [{ type: 'text' as const, text }], isError: true };
}

/** Canned refusal for write tools when the acting user is a demo account. */
export function demoDenied(): McpTextResult {
  return errorResult('Write operations are disabled in demo mode.');
}

export const TOOL_ANNOTATIONS_READONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export const TOOL_ANNOTATIONS_OPEN_WORLD_READONLY = {
  ...TOOL_ANNOTATIONS_READONLY,
  openWorldHint: true,
} as const;

export const TOOL_ANNOTATIONS_WRITE = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export const TOOL_ANNOTATIONS_OPEN_WORLD_WRITE = {
  ...TOOL_ANNOTATIONS_WRITE,
  openWorldHint: true,
} as const;

export const TOOL_ANNOTATIONS_DELETE = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export const TOOL_ANNOTATIONS_NON_IDEMPOTENT = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const;

export const TOOL_ANNOTATIONS_OPEN_WORLD_NON_IDEMPOTENT = {
  ...TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  openWorldHint: true,
} as const;

/** Takes something away (a stop, a via point) and running it twice takes two. */
export const TOOL_ANNOTATIONS_DELETE_NON_IDEMPOTENT = {
  ...TOOL_ANNOTATIONS_DELETE,
  idempotentHint: false,
} as const;
