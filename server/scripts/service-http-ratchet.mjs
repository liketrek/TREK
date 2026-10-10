#!/usr/bin/env node
/*
 * lint:service-http: the result-envelope idioms may only shrink.
 *
 * A service refuses by throwing a DomainError (src/nest/common/domain-error.ts)
 * with the status and the exact text the client sees. The global filter turns it
 * into REST's `{ error }` and the MCP registry into the tool's errorResult, so no
 * caller translates it. What this counts is the older way, where every caller did:
 *
 *   - in a *.service.ts: a `status: 4xx` or `status: 5xx` literal (the
 *     `return { error, status }` result) and `new HttpException(` (HTTP in the
 *     domain layer);
 *   - in a *.controller.ts or *.mcp.ts: a branch on a returned error,
 *     `if (result.error)`, `if ('error' in result)`.
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
const RESULT_ERROR_BRANCH =
  /\bif\s*\(\s*(?:'error'\s+in\s+[\w$.]+|"error"\s+in\s+[\w$.]+|[\w$]+(?:\.[\w$]+)*\.error\s*\))/g;

const hits = (text, pattern) => text.match(pattern)?.length ?? 0;

/** The envelope idioms in one service file. */
export function countServiceIdioms(text) {
  return hits(text, STATUS_LITERAL) + hits(text, HTTP_EXCEPTION);
}

/** The branches on a returned error in one controller or MCP file. */
export function countResultBranches(text) {
  return hits(text, RESULT_ERROR_BRANCH);
}

export const check = {
  name: 'service-http',
  script: 'lint:service-http',
  root: 'src/nest',
  baseline: 'scripts/service-http-baseline.json',
  unit: 'error-envelope idiom(s)',
  advice: 'Throw a DomainError from the service (src/nest/common/domain-error.ts) and let REST and MCP answer it.',
  include: (file) => /\.(service|controller|mcp)\.ts$/.test(file),
  count: (text, file) => (file.endsWith('.service.ts') ? countServiceIdioms(text) : countResultBranches(text)),
};

cliMain(check, import.meta.url);
