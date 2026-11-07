#!/usr/bin/env node
import { cliMain } from './lib/count-ratchet.mjs';

/**
 * Read tools that answer without an `outputSchema`, per `*.mcp.ts` file.
 *
 * A read tool's result is data a host can render and a client can check, so it
 * declares the shape it returns (`outputSchema`, from `@trek/shared`'s
 * `mcp-apps/`) and answers with `okStructured`. Write tools answer with a
 * confirmation and are not counted. A tool reads when its annotations are one of
 * the read-only presets or say `readOnlyHint: true`.
 */
const TOOL_OPEN = '@Tool(';
const READ_ONLY = /TOOL_ANNOTATIONS_(?:OPEN_WORLD_)?READONLY\b|readOnlyHint:\s*true/;
const OUTPUT_SCHEMA = /\boutputSchema\s*:/;

/** The text of one decorator's argument, from its opening parenthesis to the one that closes it. */
function decoratorArgument(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    if (text[i] === '(') depth += 1;
    else if (text[i] === ')') {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return text.slice(start);
}

/** The `@Tool` decorators in one file's text that read and declare no output schema. */
export function countReadToolsWithoutOutput(text) {
  let count = 0;
  for (let at = text.indexOf(TOOL_OPEN); at !== -1; at = text.indexOf(TOOL_OPEN, at + TOOL_OPEN.length)) {
    const options = decoratorArgument(text, at + TOOL_OPEN.length - 1);
    if (READ_ONLY.test(options) && !OUTPUT_SCHEMA.test(options)) count += 1;
  }
  return count;
}

export const check = {
  name: 'mcp-output-schema',
  script: 'lint:mcp-output-schema',
  root: 'src/nest',
  baseline: 'scripts/mcp-output-schema-baseline.json',
  unit: 'read tool(s) without an outputSchema',
  advice:
    'Declare the result shape in shared/src/mcp-apps/mcp-tool-output.schema.ts, pass it as outputSchema and answer with okStructured.',
  include: (file) => file.endsWith('.mcp.ts'),
  count: (text) => countReadToolsWithoutOutput(text),
};

cliMain(check, import.meta.url);
