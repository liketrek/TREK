/**
 * TOCLIENTUSER-PARITY-001 — the three hand-mirrored `toClientUser` copies
 * stay byte-identical.
 *
 * `auth.service.ts`, `passkey.service.ts` and `oidc.service.ts` each carry a
 * file-local, unexported `function toClientUser(row: UserRow): User { ... }`
 * that maps the repository's full-row shape onto the client-facing `User`
 * contract (`role` narrowed to `'admin' | 'user'`, four nullable columns
 * coerced `T | null` -> `T | undefined` so `JSON.stringify` drops the key
 * instead of emitting `null`).
 *
 * Plan 3b Task 7 review, M3 (reversing the Task 6 review's recommendation):
 * a shared, exported helper would entrench that `?? undefined` coercion —
 * the real fix is widening `User`'s optional fields to `T | null |
 * undefined` and deleting all three copies, which is Plan 3c's own task
 * with its own boot diff. Until then, CLAUDE.md's "guard the copy with a
 * parity test that cannot silently skip" applies: this test reads the three
 * files directly (source-scanning, the `mcp-gated-addons.parity.test.ts`
 * precedent) and fails loudly the moment one copy drifts from the others.
 *
 * Exit condition for this test (delete it, not skip it): the `User`
 * contract's optional fields are widened to `T | null | undefined` and the
 * three `toClientUser` functions are deleted in favour of passing the
 * repository row straight through.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const SRC = join(__dirname, '../../../src');

const COPIES = [
  join(SRC, 'nest/auth/auth.service.ts'),
  join(SRC, 'nest/auth/passkey.service.ts'),
  join(SRC, 'nest/oidc/oidc.service.ts'),
];

/**
 * Extracts the body of the file-local `function toClientUser(...) { ... }`
 * declaration, brace-matched (not regex-greedy) so the extraction survives
 * unrelated formatting drift elsewhere in the file.
 */
function extractToClientUser(filePath: string): string {
  const text = readFileSync(filePath, 'utf8');
  const start = text.indexOf('function toClientUser(');
  if (start === -1) {
    throw new Error(`toClientUser not found in ${filePath} — has it been renamed, exported, or deleted?`);
  }
  const braceStart = text.indexOf('{', start);
  if (braceStart === -1) throw new Error(`toClientUser in ${filePath}: no opening brace found`);
  let depth = 0;
  let i = braceStart;
  for (; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  if (depth !== 0) throw new Error(`toClientUser in ${filePath}: unbalanced braces`);
  // The signature + body together, normalised of surrounding whitespace so a
  // trailing-newline-only diff between files doesn't fail this test.
  return text.slice(start, i + 1).trim();
}

describe('toClientUser parity', () => {
  it('TOCLIENTUSER-PARITY-001: all three copies are byte-identical', () => {
    const bodies = COPIES.map((f) => ({ file: f, body: extractToClientUser(f) }));
    const [first, ...rest] = bodies;
    const mismatched = rest.filter((b) => b.body !== first.body);
    expect(
      mismatched.map((m) => m.file),
      mismatched.length
        ? `toClientUser drifted between copies:\n${bodies.map((b) => `--- ${b.file} ---\n${b.body}`).join('\n\n')}`
        : undefined,
    ).toEqual([]);
  });

  it('TOCLIENTUSER-PARITY-002: the body maps exactly the four documented nullable-to-undefined columns plus role', () => {
    const body = extractToClientUser(COPIES[0]);
    expect(body).toContain("role: row.role === 'admin' ? 'admin' : 'user'");
    expect(body).toContain('mfa_enabled: row.mfa_enabled ?? undefined');
    expect(body).toContain('must_change_password: row.must_change_password ?? undefined');
    expect(body).toContain('created_at: row.created_at ?? undefined');
    expect(body).toContain('updated_at: row.updated_at ?? undefined');
  });
});
