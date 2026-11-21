/**
 * Result-shape helpers and tool-annotation presets shared by MCP handlers.
 * App-agnostic on purpose — host-specific canned errors (permission wording,
 * RBAC lookups, broadcasts) belong in the host, built on `errorResult`.
 */
import type { McpToolGate } from './types';

/** The text-content result shape MCP tool handlers return. */
export interface McpTextResult {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}

/** Success result: `data` pretty-printed as a single JSON text block. */
export function ok(data: unknown): McpTextResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

/** Success result: `data` as one line of JSON, for an answer whose size matters more than how it reads (a page of a long list). */
export function okCompact(data: unknown): McpTextResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
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

/**
 * One tool gate out of several, asked in order: the first refusal answers
 * the call, and the handler runs only when every gate let it through.
 */
export function combineToolGates(...gates: readonly McpToolGate[]): McpToolGate {
  // Chained rather than run side by side: a later gate is not asked once an earlier one refused.
  return (tool, ctx, args) =>
    gates.reduce<Promise<unknown>>(async (earlier, gate) => {
      const refusal = await earlier;
      return refusal !== undefined ? refusal : gate(tool, ctx, args);
    }, Promise.resolve(undefined));
}
