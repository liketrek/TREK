import { checkDialect, staticProblems, tokenize, tokenProblems } from './check-registration-dialect.mjs';

import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

// A dialect written by hand for TREK's tests, for version 9.9.9. It is none of
// the issuer's; the issuer checks its own modules against these rules too.
const EXAMPLE = fileURLToPath(
  new URL('../../server/tests/fixtures/service-identity/registration-dialect.example.ts', import.meta.url),
);
const source = readFileSync(EXAMPLE, 'utf8');

const scratch = mkdtempSync(join(tmpdir(), 'registration-dialect-check-'));
after(() => rmSync(scratch, { recursive: true, force: true }));

let written = 0;
function variant(text) {
  written += 1;
  const file = join(scratch, `variant-${written}.ts`);
  writeFileSync(file, text);
  return file;
}

function replaced(from, to) {
  assert.ok(source.includes(from), `the example no longer holds ${from}`);
  return source.replace(from, to);
}

// The example with `line` added in front of its exports.
const withLine = (line) => replaced('export const registrationDialect', `${line}\nexport const registrationDialect`);

describe('check-registration-dialect', () => {
  it('passes the example for its own version', async () => {
    assert.deepEqual(await checkDialect(EXAMPLE, '9.9.9'), []);
  });

  it('refuses a dialect written for another version', async () => {
    const problems = await checkDialect(EXAMPLE, '9.9.10');
    assert.ok(problems.some((p) => p.includes('not written for 9.9.10')));
  });

  it('refuses an import from anywhere but node:crypto, node:zlib and the types', () => {
    const text = replaced(
      "import { crc32 } from 'node:zlib';",
      "import { crc32 } from 'node:zlib';\nimport { readFileSync } from 'node:fs';",
    );
    assert.ok(staticProblems(text, '9.9.9').some((p) => p.includes("from 'node:fs'")));
    const runtimeTypes = replaced('import type {', 'import {');
    assert.ok(staticProblems(runtimeTypes, '9.9.9').some((p) => p.includes('registration-dialect.types')));
  });

  it('refuses what reaches the process, the network or code from strings, before running any of it', async () => {
    for (const line of ['const env = process.env;', 'void fetch("https://example.org");', 'const run = eval;']) {
      const file = variant(withLine(line));
      const problems = await checkDialect(file, '9.9.9');
      assert.ok(
        problems.some((p) => p.includes('names what a dialect does not need')),
        line,
      );
    }
  });

  it('refuses changing a global or anything else that is not its own name', () => {
    for (const line of [
      'Math.random = () => 0;',
      'Buffer.from = Buffer.alloc;',
      'const m = Math;\nm.floor = Math.max;',
      'const b = Buffer;\nb.poolSize += 1;',
      '(Buffer).concat = Buffer.alloc;',
      'PEPPER.c++;',
      '++PEPPER.c;',
    ]) {
      const problems = staticProblems(withLine(line), '9.9.9');
      assert.ok(
        problems.some((p) => p.includes('other than a name of its own') || p.includes('reads .')),
        line,
      );
    }
  });

  it('refuses names and members it does not know, however they are reached', () => {
    const cases = [
      ['Object.defineProperty(JSON, "parse", {});', 'names what a dialect does not need'],
      ['const pick = Math.random();', 'reads .random'],
      ['const big = Buffer.alloc(4).buffer;', 'reads .buffer'],
      ['const own = Array.isArray;', 'reads .isArray'],
      ['const later = Promise.resolve(1);', 'names Promise'],
      ['const date = new Date();', 'names new'],
      ['delete PEPPER.c;', 'names delete'],
      ['const kind = typeof PEPPER;', 'names typeof'],
      ['const at = PEPPER?.length;', 'the character'],
    ];
    for (const [line, expected] of cases) {
      const problems = staticProblems(withLine(line), '9.9.9');
      assert.ok(
        problems.some((p) => p.includes(expected)),
        `${line}: ${problems.join('; ')}`,
      );
    }
  });

  it('refuses a computed property name, a regular expression and any escape that could spell a name', () => {
    const computed = withLine("const name = PEPPER['length'];");
    assert.ok(staticProblems(computed, '9.9.9').some((p) => p.includes('computed name')));
    const pattern = withLine('const test = /process/.source;');
    assert.ok(staticProblems(pattern, '9.9.9').some((p) => p.includes('regular expression')));
    const escaped = withLine("const name = 'pro\\u0063ess';");
    assert.ok(staticProblems(escaped, '9.9.9').some((p) => p.includes('backslash')));
  });

  it('reads the names in a template literal like any other', () => {
    assert.deepEqual(tokenProblems(tokenize('const a = 1;\nconst b = `x${a}y`;\n')), []);
    assert.ok(tokenProblems(tokenize('const b = `x${Date}y`;\n')).some((p) => p.includes('names Date')));
  });

  it('refuses a file without its header or without a dialect id', () => {
    assert.ok(staticProblems(source.slice(source.indexOf('import')), '9.9.9').some((p) => p.includes('header')));
    const noId = replaced("const DIALECT = 'HandWritten1';", "const DIALECT = 'short';");
    assert.ok(staticProblems(noId, '9.9.9').some((p) => p.includes('dialect id')));
  });

  it('refuses a dialect that does not compute what its SELF_CHECK says', async () => {
    const file = variant(replaced("seal.toString('hex')", "seal.toString('base64url')"));
    const problems = await checkDialect(file, '9.9.9');
    assert.deepEqual(problems, ['its request is not the one the issuer computed']);
  });

  it('refuses a dialect whose request TREK would not send', async () => {
    const file = variant(replaced("'X-TREK-Test-Seal'", "'X-TREK-Install'"));
    const problems = await checkDialect(file, '9.9.9');
    assert.ok(problems.some((p) => p.includes('X-TREK-Install')));
  });
});
