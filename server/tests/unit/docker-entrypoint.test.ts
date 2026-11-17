import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

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

  // A blanket `chown -R` over the volumes rewrote every inode on every start; on a
  // large or network-backed PVC the container sat there for minutes without a log
  // line, which looked like gosu hanging (#2918).
  // Only the commands count; the comments are free to talk about the old chown.
  const code = source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n');

  it('never walks the volumes on a start where they already belong to node', () => {
    // Only the dir and its direct entries are looked at, never the whole tree.
    expect(code).toContain('find "$dir" -maxdepth 1 \\( ! -user node -o -group 0 \\) -print -quit');
    expect(code).not.toMatch(/find "\$dir" \\\(/);
    // The recursive hand-over sits behind that check and behind a chown of the dir that worked.
    const check = code.indexOf('-maxdepth 1');
    const dirChown = code.indexOf('if chown node "$dir"');
    expect(dirChown).toBeGreaterThan(check);
    expect(code.indexOf('chown -R')).toBeGreaterThan(dirChown);
    expect(code.indexOf('find "$dir" -group 0 -exec chgrp -h node {} +')).toBeGreaterThan(code.indexOf('chown -R'));
    expect(code).toContain('Correcting ownership of $dir for the node user...');
  });

  // A Kubernetes fsGroup other than 1000 gives every file that gid. Handing the
  // group back to node would leave the kubelet's OnRootMismatch with a mismatched
  // root on the next start, and the two recursive walks would undo each other on
  // every start (#2918 again). So only the user is taken over, plus a root group.
  it('takes over the owning user and a root group, never a foreign fsGroup', () => {
    expect(code).not.toContain('-group node');
    expect(code).not.toContain('node:node');
    expect(code).toContain('chown -R -h node "$dir"');
  });

  it('says so once instead of walking a volume that refuses chown', () => {
    expect(code).toContain('cannot be handed to the node user (chown refused); run the container as uid 1000 instead.');
  });

  // Under runAsUser: 1000 there is no privilege to drop and gosu cannot switch
  // users, so the non-root branch has to exec Node itself before any chown or gosu.
  it('starts Node directly, without chown or gosu, when not running as root', () => {
    const nonRootCheck = code.indexOf('if [ "$(id -u)" != "0" ]; then');
    expect(nonRootCheck).toBeGreaterThan(-1);
    const branchEnd = code.indexOf('\nfi\n', nonRootCheck);
    expect(branchEnd).toBeGreaterThan(nonRootCheck);
    const branch = code.slice(nonRootCheck, branchEnd);
    expect(branch).toContain('exec node --require tsconfig-paths/register dist/index.js');
    expect(branch).not.toContain('gosu');
    expect(code.indexOf('chown')).toBeGreaterThan(branchEnd);
    expect(code.indexOf('gosu')).toBeGreaterThan(branchEnd);
  });

  it('still drops to node through gosu when started as root', () => {
    expect(source).toContain('exec gosu node node --require tsconfig-paths/register dist/index.js');
  });
});
