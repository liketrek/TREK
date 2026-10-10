#!/usr/bin/env node
/*
 * lint:mcp-zod: inline zod in the MCP tool files may only shrink.
 *
 * An MCP tool's input is meant to derive from the request contract in
 * @trek/shared (`xRequestSchema.shape.field`, `.pick()`, `.extend()`,
 * `.describe()`), or from a shared primitive such as idSchema, so a bound that
 * changes on the REST side changes on the tool too. Every `z.` written in a
 * `*.mcp.ts` under src/nest is a field spelled by hand instead. Where REST is
 * deliberately looser (an open body, a field without a length) the tool keeps
 * its own bound, and its count says so.
 *
 * Each file is held to its entry in scripts/mcp-inline-zod-baseline.json, and a
 * new tool file holds none (scripts/lib/count-ratchet.mjs has the rules).
 *
 *   npm run lint:mcp-zod              check against the baseline (CI)
 *   npm run lint:mcp-zod -- --update  lower the counts; never raises or adds an entry
 */
import { cliMain } from './lib/count-ratchet.mjs';

// Whitespace before the dot counts too: Prettier breaks a long chain into `z`
// on one line and `.object(` on the next.
const ZOD_CALL = /\bz\s*\./g;

/** The inline zod calls in one file's text, comments included. */
export function countInlineZod(text) {
  return text.match(ZOD_CALL)?.length ?? 0;
}

export const check = {
  name: 'mcp-zod',
  script: 'lint:mcp-zod',
  root: 'src/nest',
  baseline: 'scripts/mcp-inline-zod-baseline.json',
  unit: 'inline z. call(s)',
  advice: 'Derive the field from the request schema in @trek/shared or a shared primitive (idSchema) instead.',
  include: (file) => file.endsWith('.mcp.ts'),
  count: (text) => countInlineZod(text),
};

cliMain(check, import.meta.url);
