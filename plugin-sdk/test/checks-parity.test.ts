/**
 * The test this whole rework rests on.
 *
 * The SDK's checks are a PORT of the TREK-Plugins registry's gates (scripts/validate-entry.mjs
 * and scripts/check-readme.mjs). A port drifts. And when it drifts in the lenient direction the
 * result is not a missing feature — it is a FALSE GREEN: an author runs `validate`, sees a pass,
 * cuts an immutable GitHub release, and the registry rejects it. That is the exact failure this
 * rework exists to make impossible, so it needs a test, not a comment.
 *
 * Two halves:
 *
 *   1. The README gate's constants are read out of the registry's own source and compared. If
 *      someone bumps MIN_PROSE_CHARS to 500 over there, this goes red here.
 *   2. The registry's REAL validate-entry.mjs is executed (SKIP_NETWORK=1) against an entry the
 *      SDK built, and must agree that it is valid.
 *
 * The registry lives in a separate repo, so these skip when it is not checked out — a plugin-sdk
 * CI run without it still passes. Point TREK_PLUGINS_REPO at it to run them anywhere.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scaffold } from '../src/cli/create.js';
import { packPluginDir } from '../src/cli/pack.js';
import { buildEntry } from '../src/cli/entry.js';
import { validatePluginDir } from '../src/cli/validate.js';
import { REQUIRED_SECTIONS, MIN_PROSE_CHARS, PLACEHOLDER_PATTERNS } from '../src/cli/checks/readme.js';
import { makePublishable } from './helpers.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY =
  process.env.TREK_PLUGINS_REPO ?? path.resolve(HERE, '..', '..', '..', 'TREK-Plugins');
const haveRegistry = fs.existsSync(path.join(REGISTRY, 'scripts', 'validate-entry.mjs'));

const describeIfRegistry = haveRegistry ? describe : describe.skip;

describeIfRegistry('parity with the TREK-Plugins registry gates', () => {
  let tmp: string;
  let dir: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-'));
    scaffold('parity-plug', 'widget', tmp);
    dir = path.join(tmp, 'parity-plug');
  });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  // ── 1. the README gate's constants ────────────────────────────────────────────

  const readmeGateSource = (): string =>
    fs.readFileSync(path.join(REGISTRY, 'scripts', 'check-readme.mjs'), 'utf8');

  it('requires exactly the sections the registry requires', () => {
    const src = readmeGateSource();
    const match = src.match(/const REQUIRED_HEADINGS = \[([^\]]+)\]/);
    expect(match, 'could not find REQUIRED_HEADINGS in check-readme.mjs').toBeTruthy();
    const theirs = [...match![1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(REQUIRED_SECTIONS).toEqual(theirs);
  });

  it('uses the same prose floor as the registry', () => {
    const match = readmeGateSource().match(/const MIN_PROSE_CHARS = (\d+)/);
    expect(match, 'could not find MIN_PROSE_CHARS in check-readme.mjs').toBeTruthy();
    expect(MIN_PROSE_CHARS).toBe(Number(match![1]));
  });

  it('detects the same template placeholders as the registry', () => {
    const src = readmeGateSource();
    const block = src.match(/const PLACEHOLDER_PATTERNS = \[([\s\S]*?)\n\]/);
    expect(block, 'could not find PLACEHOLDER_PATTERNS in check-readme.mjs').toBeTruthy();
    // Compare the regex SOURCES, not the objects — same patterns, whatever the formatting.
    const theirs = [...block![1].matchAll(/\/((?:[^/\\\n]|\\.)+)\/[a-z]*/g)].map((m) => m[1]).sort();
    const ours = PLACEHOLDER_PATTERNS.map((r) => r.source).sort();
    expect(ours).toEqual(theirs);
  });

  // ── 2. the registry's real validator, run against an entry we built ───────────

  /**
   * Build a publishable plugin, pack it, and hand the resulting entry to the registry's OWN
   * validate-entry.mjs. This is the end of the chain: if the registry's script says yes with
   * SKIP_NETWORK=1, then everything the SDK can promise offline, it has promised correctly.
   */
  function runRegistryValidator(entry: unknown, id: string): { code: number; output: string } {
    const entryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'entry-'));
    const entryPath = path.join(entryDir, `${id}.json`);
    fs.writeFileSync(entryPath, JSON.stringify(entry, null, 2));
    try {
      const output = execFileSync('node', [path.join(REGISTRY, 'scripts', 'validate-entry.mjs'), entryPath], {
        encoding: 'utf8',
        env: { ...process.env, SKIP_NETWORK: '1' },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return { code: 0, output };
    } catch (e) {
      const err = e as { status?: number; stdout?: string; stderr?: string };
      return { code: err.status ?? 1, output: (err.stdout ?? '') + (err.stderr ?? '') };
    } finally {
      fs.rmSync(entryDir, { recursive: true, force: true });
    }
  }

  function entryFor(pluginDir: string) {
    const zip = path.join(pluginDir, 'plugin.zip');
    packPluginDir(pluginDir, zip);
    return buildEntry({
      dir: pluginDir,
      repo: 'someone/trek-plugin-parity-plug',
      tag: 'v1.0.0',
      zipPath: zip,
      // No git tag exists in a temp dir, so pin the commit by hand — the network checks that
      // would verify it are exactly the ones SKIP_NETWORK=1 turns off.
      commit: 'a'.repeat(40),
      now: '2026-01-01T00:00:00Z',
    });
  }

  it('an entry the SDK builds passes the registry validator', () => {
    makePublishable(dir);
    expect(validatePluginDir(dir).ok).toBe(true);

    const { code, output } = runRegistryValidator(entryFor(dir), 'parity-plug');
    expect(output).not.toMatch(/FAIL|schema:/);
    expect(code).toBe(0);
  });

  /**
   * The buildEntry bug, pinned.
   *
   * buildEntry never emitted requiredAddons or pluginDependencies, but validate-entry.mjs
   * parity-checks both against the manifest. So any plugin that actually declared an addon
   * dependency produced an entry the registry rejected — and the author found out after the
   * release was cut and its bytes pinned. This test is the reason that cannot happen again.
   */
  it('an entry for a plugin with requiredAddons still passes the registry validator', () => {
    const manifestPath = path.join(dir, 'trek-plugin.json');
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    m.requiredAddons = ['budget', 'packing'];
    m.pluginDependencies = [{ id: 'some-other-plugin', version: '>=1.0.0 <2.0.0' }];
    fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2));
    makePublishable(dir);

    const entry = entryFor(dir);
    // The entry must MIRROR the manifest, or the registry's parity check rejects it.
    expect(entry.versions[0].requiredAddons).toEqual(['budget', 'packing']);
    expect(entry.versions[0].pluginDependencies).toEqual([{ id: 'some-other-plugin', version: '>=1.0.0 <2.0.0' }]);

    const { code, output } = runRegistryValidator(entry, 'parity-plug');
    expect(output).not.toMatch(/FAIL|requiredAddons|pluginDependencies/);
    expect(code).toBe(0);
  });

  /**
   * `tags` and `homepage` are copied verbatim out of the manifest into the entry, and the
   * registry's JSON schema validates both — but nothing local used to. A tag with a capital
   * letter (the obvious thing to write) produced an entry CI rejected, after the release was cut.
   *
   * Both halves are asserted: WE reject it, and the registry rejects it too. Either one alone
   * would be a weaker claim than it looks.
   */
  it.each([
    { field: 'tags', value: ['Flight Tracking'], match: /tag/i },
    { field: 'homepage', value: 'not-a-url', match: /homepage/i },
  ])('rejects a bad $field, exactly as the registry schema does', ({ field, value, match }) => {
    const manifestPath = path.join(dir, 'trek-plugin.json');
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    m[field] = value;
    fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2));
    makePublishable(dir);

    const ours = validatePluginDir(dir);
    expect(ours.ok).toBe(false);
    expect(ours.errors.some((e) => match.test(e))).toBe(true);

    const { code, output } = runRegistryValidator(entryFor(dir), 'parity-plug');
    expect(code).toBe(1);
    expect(output).toMatch(/schema:/);
  });

  /**
   * The registry's schema caps `description` at 200 chars and requires at least 5. Nothing local
   * used to look at either, so an over-long description sailed through pack + release and failed
   * CI once the artifact was immutable. Assert that we now catch it BEFORE the registry does.
   */
  it('rejects an over-long description that the registry schema would also reject', () => {
    const manifestPath = path.join(dir, 'trek-plugin.json');
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    m.description = 'x'.repeat(201);
    fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2));
    makePublishable(dir);

    // We say no…
    const ours = validatePluginDir(dir);
    expect(ours.ok).toBe(false);
    expect(ours.errors.some((e) => /description/.test(e))).toBe(true);

    // …and so does the registry, for the same reason. That agreement is the point.
    const { code, output } = runRegistryValidator(entryFor(dir), 'parity-plug');
    expect(code).toBe(1);
    expect(output).toMatch(/description/);
  });
});
