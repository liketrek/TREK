#!/usr/bin/env node
import { cliMain } from './lib/count-ratchet.mjs';

import { createRequire } from 'node:module';

/**
 * Read tools that answer without an `outputSchema`, per `*.mcp.ts` file.
 *
 * A read tool's result is data a host can render and a client can check, so it
 * declares the shape it returns (`outputSchema`, from `@trek/shared`'s
 * `mcp-apps/`) and answers with `okStructured`. Write tools answer with a
 * confirmation and are not counted. A tool reads when its annotations are one of
 * the read-only presets or say `readOnlyHint: true`.
 */
const require = createRequire(import.meta.url);
const ts = require('typescript');

/** The read-only annotation presets of src/nest-mcp/helpers.ts. */
const READ_ONLY_PRESETS = new Set(['TOOL_ANNOTATIONS_READONLY', 'TOOL_ANNOTATIONS_OPEN_WORLD_READONLY']);

/** A property of an object literal by its name, or undefined. */
function property(object, name) {
  return object.properties.find(
    (prop) => ts.isPropertyAssignment(prop) && prop.name && ts.isIdentifier(prop.name) && prop.name.text === name,
  );
}

/** Whether a tool's `annotations` value says it only reads: a read-only preset, or `readOnlyHint: true`. */
function readsOnly(annotations) {
  if (!annotations) return false;
  const value = annotations.initializer;
  if (ts.isIdentifier(value)) return READ_ONLY_PRESETS.has(value.text);
  if (ts.isObjectLiteralExpression(value)) {
    const hint = property(value, 'readOnlyHint');
    return hint?.initializer.kind === ts.SyntaxKind.TrueKeyword;
  }
  return false;
}

/**
 * The `@Tool({...})` decorators in one file's text that read and declare no
 * output schema. Parsed as TypeScript, so a parenthesis or the word
 * outputSchema inside a description cannot move or fake the match.
 */
export function countReadToolsWithoutOutput(text) {
  const source = ts.createSourceFile('tool.mcp.ts', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let count = 0;
  const visit = (node) => {
    if (ts.isDecorator(node) && ts.isCallExpression(node.expression)) {
      const { expression: callee, arguments: args } = node.expression;
      const options = args[0];
      if (ts.isIdentifier(callee) && callee.text === 'Tool' && options && ts.isObjectLiteralExpression(options)) {
        if (readsOnly(property(options, 'annotations')) && !property(options, 'outputSchema')) count += 1;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
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
