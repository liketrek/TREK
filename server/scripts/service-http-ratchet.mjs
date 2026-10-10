#!/usr/bin/env node
/*
 * lint:service-http: the result-envelope idioms may only shrink.
 *
 * A service refuses by throwing a DomainError (src/nest/common/domain-error.ts)
 * with the status and the exact text the client sees. The global filter turns it
 * into REST's `{ error }` and the MCP registry into the tool's errorResult, so no
 * caller translates it. What this counts is the older way, where every caller did:
 *
 *   - in any file under src/nest outside the HTTP and adapter layers (services,
 *     helpers, impl files, providers): a `status: 4xx` or `status: 5xx` literal
 *     (the `return { error, status }` result) and `new HttpException(` (HTTP in
 *     the domain layer). Controllers, guards, pipes, filters, interceptors and
 *     DTOs speak HTTP by design, and src/nest/common/domain-error.ts defines the
 *     status a refusal carries, so those are left out by name;
 *   - in a *.controller.ts, *.mcp.ts or *.rpc.ts: a branch on a returned error,
 *     `if (result.error)`, `if (!r.error)`, `'error' in result`,
 *     `result.error === 'not_found'`, `r?.error && ...`, `x.error ? a : b`.
 *
 * Each file is held to its entry in scripts/service-http-baseline.json, and a
 * file without an entry holds none (scripts/lib/count-ratchet.mjs has the rules).
 *
 *   npm run lint:service-http              check against the baseline (CI)
 *   npm run lint:service-http -- --update  lower the counts; never raises or adds an entry
 */
import { cliMain } from './lib/count-ratchet.mjs';

const STATUS_LITERAL = /\bstatus:\s*[45]\d\d\b/g;
const HTTP_EXCEPTION = /\bnew HttpException\(/g;
// A property path such as result, res.body or this.state?.last.
const PATH = String.raw`[\w$]+(?:\??\.[\w$]+)*`;
const RESULT_ERROR_BRANCH = new RegExp(
  [
    String.raw`['"]error['"]\s+in\s+[\w$.]+`,
    String.raw`\bif\s*\(\s*!?\s*${PATH}\??\.error\s*\)`,
    String.raw`${PATH}\??\.error\b\s*(?:===|!==|==|!=|&&|\|\||\?(?![.?]))`,
  ].join('|'),
  'g',
);

/** Files that speak HTTP by design: the status literals in them are not an envelope. */
const HTTP_LAYER = /\.(?:controller|guard|pipe|filter|interceptor|dto)\.ts$/;
const DEFINES_THE_STATUS = new Set(['src/nest/common/domain-error.ts']);
/** The adapters over a service, where a branch on its returned error is the caller translating it. */
const ADAPTER = /\.(?:controller|mcp|rpc)\.ts$/;

const hits = (text, pattern) => text.match(pattern)?.length ?? 0;

/** The envelope idioms in one domain-layer file. */
export function countServiceIdioms(text) {
  return hits(text, STATUS_LITERAL) + hits(text, HTTP_EXCEPTION);
}

/** The branches on a returned error in one controller, MCP or RPC file. */
export function countResultBranches(text) {
  return hits(text, RESULT_ERROR_BRANCH);
}

/** What one file under src/nest holds, by the layer its name puts it in. */
export function countFile(text, file) {
  let n = ADAPTER.test(file) ? countResultBranches(text) : 0;
  if (!HTTP_LAYER.test(file) && !DEFINES_THE_STATUS.has(file)) n += countServiceIdioms(text);
  return n;
}

export const check = {
  name: 'service-http',
  script: 'lint:service-http',
  root: 'src/nest',
  baseline: 'scripts/service-http-baseline.json',
  unit: 'error-envelope idiom(s)',
  advice: 'Throw a DomainError from the service (src/nest/common/domain-error.ts) and let REST and MCP answer it.',
  include: (file) => file.endsWith('.ts') && !file.endsWith('.d.ts'),
  count: countFile,
};

cliMain(check, import.meta.url);
