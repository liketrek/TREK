#!/usr/bin/env node
// Checks a registration dialect the issuer handed out, before a release ships it.
//
// docker.yml (through registration-dialect.yml) asks the TREK services issuer
// for the dialect of the version it releases and commits the answer as
// server/src/nest/service-identity/registration-dialect.ts, without a person
// reading it first. That file then runs inside every TREK server, so it is
// held to what a dialect is: a few hashes over the inputs it is given, and
// nothing that reaches past them.
//
//   1. Statically, before anything of it runs. The size, the header comment,
//      no backslash (so no escape can spell a name), imports from node:crypto,
//      node:zlib and the types module only, and the version and id it must
//      carry. Then the code is read token by token against what it may hold,
//      not against what it may not: the few keywords the generator writes,
//      names it declares itself or imports, a handful of globals (Buffer,
//      Math, String, BigInt, Array, parseInt), and after a dot only the Buffer,
//      array, string, hash and Math members the generator uses. It may assign
//      to its own names only, never to a property (no Math.random = ...,
//      Buffer.from = ..., no defineProperty at all), read no property by a
//      computed name and hold no regular expression. A list of names that reach
//      the process, the network, timers or code from strings is checked on top.
//   2. Then it is imported (Node strips the types) and run on the fixed inputs
//      in its SELF_CHECK: the password, the salt, scrypt over them and the
//      request must be what the issuer computed, and the request must pass
//      the rules the issuer client applies (issuer.client.ts holds the same).
//
// A new construct in the issuer's generator needs its name added here first,
// in a release before the first dialect that uses it.
//
// Usage:
//   node scripts/ci/check-registration-dialect.mjs <file.ts> <version>
//
// Prints what it found and exits 0 only when the dialect may ship. The release
// job runs it without any secret in its environment.
import { createHash, scryptSync } from 'node:crypto';
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MAX_BYTES = 64 * 1024;
const MAX_LINES = 1000;
const TYPES_MODULE = './registration-dialect.types';
const RUNTIME_MODULES = new Set(['node:crypto', 'node:zlib']);
const IMPORT_LINE = /^import (type )?\{[\w\s,]+\} from '([^']+)';$/;

// Checked on every line, on top of the allowlist below: each of these reaches
// past the hashes, into the process and its environment, modules, the
// network, timers, the globals' definitions, or a way to run a string as code.
const FORBIDDEN = [
  /\bprocess\b/,
  /\brequire\b/,
  /\bimport\s*\(/,
  /\bimport\s*\.\s*meta\b/,
  /\beval\b/,
  /\bFunction\b/,
  /\bglobalThis\b/,
  /\bglobal\b/,
  /\bmodule\s*\./,
  /\bexports\s*\./,
  /\bfetch\b/,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\b/,
  /\bEventSource\b/,
  /\bWorker\b/,
  /\bWebAssembly\b/,
  /\bchild_process\b/,
  /node:(?!crypto'|zlib')/,
  /\bset(Timeout|Interval|Immediate)\b/,
  /\bqueueMicrotask\b/,
  /\bconstructor\b/,
  /\bprototype\b/,
  /\b__proto__\b/,
  /\bReflect\b/,
  /\bProxy\b/,
  /\bObject\b/,
  /\bJSON\b/,
  /\bSymbol\b/,
  /\bdefineProperty\b/,
  /\bsetPrototypeOf\b/,
  /\bexport\s+default\b/,
];

// The keywords a dialect is written with.
const KEYWORDS = new Set([
  'const',
  'let',
  'function',
  'return',
  'for',
  'do',
  'while',
  'export',
  'import',
  'type',
  'from',
]);
// Globals and type names it may name without declaring them.
const GLOBALS = new Set(['Buffer', 'Math', 'String', 'BigInt', 'Array', 'parseInt', 'number', 'string']);
// What it may read after a dot: the challenge's c, and the members of Buffer,
// arrays, strings, hashes and Math the generator writes.
const PROPERTIES = new Set([
  'c',
  'length',
  'from',
  'alloc',
  'concat',
  'subarray',
  'slice',
  'copy',
  'reverse',
  'map',
  'forEach',
  'push',
  'join',
  'padStart',
  'padEnd',
  'charAt',
  'toString',
  'toUpperCase',
  'update',
  'digest',
  'readUInt8',
  'writeUInt8',
  'readUInt32BE',
  'readUInt32LE',
  'writeUInt16BE',
  'writeUInt16LE',
  'writeUInt32BE',
  'writeUInt32LE',
  'writeBigUInt64BE',
  'writeBigUInt64LE',
  'floor',
  'sign',
  'max',
  'min',
]);
// Every punctuator the generator writes, longest first. `?`, `?.`, `??`, `#`
// and `@` are not among them.
const PUNCTUATORS = [
  '>>>=',
  '...',
  '===',
  '!==',
  '**=',
  '<<=',
  '>>=',
  '>>>',
  '=>',
  '==',
  '!=',
  '<=',
  '>=',
  '&&',
  '||',
  '++',
  '--',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '&=',
  '|=',
  '^=',
  '**',
  '<<',
  '>>',
  '{',
  '}',
  '(',
  ')',
  '[',
  ']',
  ';',
  ',',
  '.',
  '<',
  '>',
  '+',
  '-',
  '*',
  '/',
  '%',
  '&',
  '|',
  '^',
  '!',
  '~',
  '=',
  ':',
];
const ASSIGNMENTS = new Set(['=', '+=', '-=', '*=', '/=', '%=', '**=', '<<=', '>>=', '>>>=', '&=', '|=', '^=']);
// After one of these (or at the start) a `/` would open a regular expression.
const BEFORE_EXPRESSION = new Set([...PUNCTUATORS.filter((p) => p !== ')' && p !== ']'), 'return']);

const CHALLENGE_PATH = /^\/v1\/register(\/[A-Za-z0-9_-]{12})?\/challenge$/;
const REGISTER_PATH = /^\/v1\/register(\/[A-Za-z0-9_-]{12})?$/;
const DIALECT_HEADER = /^X-TREK-[A-Za-z0-9-]{1,40}$/;
const RESERVED_HEADER = /^X-TREK-(Install|Tier|Legacy|Quota|Instance|Notice)(-|$)/i;
const HEADER_VALUE = /^[\x20-\x7e]{1,256}$/;
const MAX_REGISTRATION_BYTES = 2048;
const LARGEST_NONCE = 2 ** 40;

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The source as tokens: { kind: 'name' | 'number' | 'string' | 'punct', value, line }.
// Comments go, a template literal becomes a string token around the tokens of
// each ${...} in it. Throws on anything else, a regular expression included.
export function tokenize(source) {
  const tokens = [];
  const braces = [];
  let i = 0;
  let line = 1;
  const push = (kind, value) => tokens.push({ kind, value, line });
  const fail = (what) => {
    throw new Error(`line ${line} holds ${what}`);
  };
  const template = () => {
    // From just after a ` or a }, up to the closing ` or the next ${.
    while (i < source.length && source[i] !== '`' && !source.startsWith('${', i)) {
      if (source[i] === '\n') line += 1;
      i += 1;
    }
    if (i >= source.length) fail('a template literal that does not end');
    push('string', '`');
    if (source[i] === '`') {
      i += 1;
    } else {
      i += 2;
      braces.push('template');
    }
  };
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\n') {
      line += 1;
      i += 1;
    } else if (ch === ' ') {
      i += 1;
    } else if (source.startsWith('//', i)) {
      while (i < source.length && source[i] !== '\n') i += 1;
    } else if (source.startsWith('/*', i)) {
      const end = source.indexOf('*/', i + 2);
      if (end < 0) fail('a comment that does not end');
      line += source.slice(i, end).split('\n').length - 1;
      i = end + 2;
    } else if (ch === "'" || ch === '"') {
      const end = source.indexOf(ch, i + 1);
      if (end < 0 || source.slice(i, end).includes('\n')) fail('a string that does not end');
      push('string', source.slice(i + 1, end));
      i = end + 1;
    } else if (ch === '`') {
      i += 1;
      template();
    } else if (/[A-Za-z_$]/.test(ch)) {
      const name = /^[A-Za-z_$][\w$]*/.exec(source.slice(i))[0];
      push('name', name);
      i += name.length;
    } else if (/[0-9]/.test(ch)) {
      const number = /^(0x[0-9a-fA-F]+|[0-9]+)/.exec(source.slice(i))[0];
      push('number', number);
      i += number.length;
    } else if (ch === '}' && braces.at(-1) === 'template') {
      braces.pop();
      i += 1;
      template();
    } else {
      const punct = PUNCTUATORS.find((p) => source.startsWith(p, i));
      if (!punct) fail(`the character ${JSON.stringify(ch)}`);
      if (punct === '/') {
        const before = tokens.at(-1);
        if (!before || BEFORE_EXPRESSION.has(before.value)) fail('a regular expression');
      }
      if (punct === '{') braces.push('brace');
      if (punct === '}') braces.pop();
      push('punct', punct);
      i += punct.length;
    }
  }
  return tokens;
}

// The index of the ) that closes the ( at `open`.
function closing(tokens, open) {
  let depth = 0;
  for (let i = open; i < tokens.length; i += 1) {
    if (tokens[i].value === '(') depth += 1;
    if (tokens[i].value === ')') depth -= 1;
    if (depth === 0) return i;
  }
  return tokens.length;
}

// The names the module declares: consts, lets, functions, imports and the
// parameters of its functions, arrows and methods.
function declaredNames(tokens) {
  const names = new Set();
  tokens.forEach((token, i) => {
    const before = tokens[i - 1];
    if (token.kind !== 'name') return;
    if (before && ['const', 'let', 'function'].includes(before.value)) names.add(token.value);
  });
  let inImport = false;
  for (const token of tokens) {
    if (token.value === 'import') inImport = true;
    else if (token.value === 'from') inImport = false;
    else if (inImport && token.kind === 'name' && token.value !== 'type') names.add(token.value);
  }
  tokens.forEach((token, open) => {
    if (token.value !== '(') return;
    const end = closing(tokens, open);
    if (!['=>', '{', ':'].includes(tokens[end + 1]?.value)) return;
    for (let i = open + 1; i < end; i += 1) {
      const isParameter =
        tokens[i].kind === 'name' &&
        ['(', ',', '{'].includes(tokens[i - 1].value) &&
        [',', ')', ':', '}', '='].includes(tokens[i + 1].value);
      if (isParameter) names.add(tokens[i].value);
    }
  });
  return names;
}

// What the tokens hold that a dialect may not; empty when nothing.
export function tokenProblems(tokens) {
  const problems = [];
  const declared = declaredNames(tokens);
  const isLocal = (i) => tokens[i]?.kind === 'name' && tokens[i - 1]?.value !== '.';
  tokens.forEach((token, i) => {
    const before = tokens[i - 1];
    const after = tokens[i + 1];
    const at = `line ${token.line}`;
    if (token.kind === 'name') {
      if (before?.value === '.') {
        if (!PROPERTIES.has(token.value)) problems.push(`${at} reads .${token.value}, which a dialect does not`);
        return;
      }
      // A key of an object literal or a parameter with its type.
      if (after?.value === ':') return;
      // A method of an object literal: name(params) { ... }.
      if (
        after?.value === '(' &&
        ['{', ','].includes(before?.value) &&
        tokens[closing(tokens, i + 1) + 1]?.value === '{'
      ) {
        return;
      }
      if (!KEYWORDS.has(token.value) && !GLOBALS.has(token.value) && !declared.has(token.value)) {
        problems.push(`${at} names ${token.value}, which it neither declares nor may use`);
      }
      return;
    }
    if (token.kind !== 'punct') return;
    if (ASSIGNMENTS.has(token.value)) {
      // const out: number[] = [] has a type before the =, not a property.
      const typed = before?.value === ']' && tokens[i - 2]?.value === '[';
      if (!typed && !isLocal(i - 1)) problems.push(`${at} assigns to something other than a name of its own`);
    } else if (token.value === '++' || token.value === '--') {
      const postfix = before && (before.kind === 'name' || [')', ']'].includes(before.value));
      const target = postfix ? isLocal(i - 1) : isLocal(i + 1) && tokens[i + 2]?.value !== '.';
      if (!target) problems.push(`${at} counts something other than a name of its own`);
    } else if (token.value === '[') {
      const reads = before && (before.kind !== 'punct' || [')', ']'].includes(before.value));
      if (reads && after?.value !== ']') problems.push(`${at} reads a property by a computed name`);
    }
  });
  return [...new Set(problems)];
}

// What is wrong with the source before it runs; empty when nothing is.
export function staticProblems(source, version) {
  const problems = [];
  if (Buffer.byteLength(source, 'utf8') > MAX_BYTES) problems.push(`it is larger than ${MAX_BYTES} bytes`);
  const lines = source.split('\n');
  if (lines.length > MAX_LINES) problems.push(`it is longer than ${MAX_LINES} lines`);
  if (!source.startsWith('/**\n')) problems.push('it does not start with its header comment');
  if (source.includes('\\')) problems.push('it holds a backslash');
  if (source.includes('\r')) problems.push('it holds a carriage return');
  if (source.includes('\t')) problems.push('it holds a tab');
  for (const [index, line] of lines.entries()) {
    if (!/^\s*(import|export\s+\*|export\s*\{)/.test(line) && !/\bfrom\s+'/.test(line)) continue;
    const match = IMPORT_LINE.exec(line);
    const allowed = match && (match[1] ? match[2] === TYPES_MODULE : RUNTIME_MODULES.has(match[2]));
    if (!allowed) problems.push(`line ${index + 1} imports or re-exports what a dialect does not: ${line.trim()}`);
  }
  for (const pattern of FORBIDDEN) {
    const line = lines.findIndex((text) => pattern.test(text));
    if (line >= 0) problems.push(`line ${line + 1} names what a dialect does not need (${pattern.source})`);
  }
  try {
    problems.push(...tokenProblems(tokenize(source)));
  } catch (err) {
    problems.push(err instanceof Error ? err.message : String(err));
  }
  if (!new RegExp(`^  releasedFor: '${escapeRegExp(version)}',$`, 'm').test(source)) {
    problems.push(`it is not written for ${version}`);
  }
  if (!/^const DIALECT = '[A-Za-z0-9_-]{12}';$/m.test(source)) problems.push('it does not name a dialect id');
  if (!/^export const registrationDialect: RegistrationDialect = \{$/m.test(source)) {
    problems.push('it does not export registrationDialect');
  }
  if (!/^export const SELF_CHECK: DialectSelfCheck = \{$/m.test(source)) problems.push('it does not export SELF_CHECK');
  return problems;
}

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

function requestProblems(path, request) {
  const problems = [];
  if (!REGISTER_PATH.test(path)) problems.push(`it registers at ${path}`);
  for (const [name, value] of Object.entries(request.headers ?? {})) {
    if (
      !DIALECT_HEADER.test(name) ||
      RESERVED_HEADER.test(name) ||
      typeof value !== 'string' ||
      !HEADER_VALUE.test(value)
    ) {
      problems.push(`it sends the header ${name}, which TREK does not send`);
    }
  }
  const body = JSON.stringify(request.body);
  if (typeof body !== 'string' || Buffer.byteLength(body, 'utf8') > MAX_REGISTRATION_BYTES) {
    problems.push('its body is no registration');
  }
  return problems;
}

// What is wrong with the imported module; empty when nothing is.
export function runtimeProblems(mod, version) {
  const dialect = mod.registrationDialect;
  const check = mod.SELF_CHECK;
  if (!dialect || !check) return ['it exports no registrationDialect or no SELF_CHECK'];
  const problems = [];
  if (dialect.releasedFor !== version) problems.push(`it is released for ${dialect.releasedFor}, not ${version}`);
  if (!/^[A-Za-z0-9_-]{12}$/.test(dialect.id)) problems.push(`its id ${dialect.id} is not an issuer's`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dialect.createdAt) || Number.isNaN(Date.parse(dialect.createdAt))) {
    problems.push(`its date ${dialect.createdAt} is no date`);
  }
  if (!CHALLENGE_PATH.test(dialect.challengePath) || dialect.challengePath !== `/v1/register/${dialect.id}/challenge`) {
    problems.push(`it asks for a challenge at ${dialect.challengePath}`);
  }
  if (dialect.registerPath !== `/v1/register/${dialect.id}`) problems.push(`it registers at ${dialect.registerPath}`);

  const inputs = {
    challenge: check.challenge,
    version: check.version,
    random: Buffer.from(check.random, 'hex'),
    nowSeconds: check.nowSeconds,
  };
  const attempt = dialect.begin(inputs);
  const { password, salt } = attempt.work(check.nonce);
  if (sha256(password) !== check.inputSha256) problems.push('its password is not the one the issuer computed');
  if (sha256(salt) !== check.saltSha256) problems.push('its salt is not the one the issuer computed');
  const { N, r, p } = check.challenge;
  if (scryptSync(password, salt, 32, { N, r, p }).toString('hex') !== check.scrypt) {
    problems.push('its proof of work is not the one the issuer computed');
  }
  const request = attempt.request(check.nonce);
  if (sha256(JSON.stringify({ body: request.body, headers: request.headers })) !== check.requestSha256) {
    problems.push('its request is not the one the issuer computed');
  }
  problems.push(...requestProblems(dialect.registerPath, request));
  problems.push(...requestProblems(dialect.registerPath, attempt.request(LARGEST_NONCE)));
  return [...new Set(problems)];
}

// Runs a checked source: Node strips the types of an .mts file and imports it.
async function importDialect(file) {
  const dir = mkdtempSync(join(tmpdir(), 'registration-dialect-'));
  try {
    const copy = join(dir, 'registration-dialect.mts');
    copyFileSync(file, copy);
    return await import(pathToFileURL(copy).href);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function checkDialect(file, version) {
  const source = readFileSync(file, 'utf8');
  const found = staticProblems(source, version);
  if (found.length > 0) return found;
  try {
    return runtimeProblems(await importDialect(file), version);
  } catch (err) {
    return [`it fails when run: ${err instanceof Error ? err.message : err}`];
  }
}

async function main() {
  const [file, version] = process.argv.slice(2);
  if (!file || !version) throw new Error('usage: check-registration-dialect.mjs <file.ts> <version>');
  const problems = await checkDialect(file, version);
  for (const problem of problems) console.log(`The dialect for ${version} is refused: ${problem}.`);
  if (problems.length > 0) process.exit(1);
  console.log(`The dialect for ${version} computes what the issuer computed.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(`::error::${err instanceof Error ? err.message : err}`);
    process.exit(1);
  });
}
