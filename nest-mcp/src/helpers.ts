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
