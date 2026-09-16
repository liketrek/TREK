import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Container management UIs let you edit a running container's command, and they
// do it by rendering Config.Cmd back into a text field and re-splitting it with a
// quote-aware tokenizer on submit. Embedded quotes never survive that round-trip:
// an inline `sh -c "… echo 'FATAL: …' …"` comes back truncated and the container
// dies with a shell syntax error before Node starts (#2374). The image therefore
// keeps its start-up logic in server/scripts/entrypoint.sh and every ENTRYPOINT
// and CMD element is a single bare token. Pin that shape so it cannot drift back.
const repoRoot = path.resolve(__dirname, '../../..');

const dockerfile = fs.readFileSync(path.join(repoRoot, 'Dockerfile'), 'utf8');
const entrypointPath = path.join(repoRoot, 'server', 'scripts', 'entrypoint.sh');

// Anchored at column 0 and requiring the JSON exec form, so the HEALTHCHECK's
// indented shell-form `CMD wget -qO- … || exit 1` is not picked up.
const readExecForms = (): string[][] =>
  [...dockerfile.matchAll(/^(?:ENTRYPOINT|CMD)[ \t]+(\[[^\n]*\])$/gm)].map((m) => JSON.parse(m[1]));

describe('container start-up shape', () => {
  const execForms = readExecForms();

  it('finds both exec-form lines (guards against matching nothing or the healthcheck)', () => {
    expect(execForms).toHaveLength(2);
  });

  it('keeps every ENTRYPOINT and CMD element a single token free of quotes and spaces', () => {
    for (const argv of execForms) {
      expect(argv.length).toBeGreaterThan(0);
      for (const element of argv) expect(element).toMatch(/^[^\s'"]+$/);
    }
  });
});

describe('entrypoint script', () => {
  const source = fs.readFileSync(entrypointPath, 'utf8');

  it('exists and is copied into the image by the Dockerfile', () => {
    expect(fs.existsSync(entrypointPath)).toBe(true);
    expect(dockerfile).toContain('COPY server/scripts/entrypoint.sh /usr/local/bin/trek-entrypoint');
  });

  it('has LF line endings (a CRLF shebang kills the container with "no such file or directory")', () => {
    expect(source).not.toContain('\r');
  });

  it('keeps the volume-over-/app preflight wording the wiki quotes', () => {
    expect(source).toContain('FATAL: TREK application files are missing from the image.');
  });
});
