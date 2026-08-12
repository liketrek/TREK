/**
 * Per-check unit tests.
 *
 * Every check is a pure function of a CheckContext, so these need no temp dir and no disk — the
 * context is just data, and `exists` is a closure the test supplies. That is the property the
 * whole checks/ module was shaped around, and it is what makes the boundary cases (399 vs 400
 * chars of prose) cheap enough to actually write down.
 */
import { describe, it, expect } from 'vitest';
import { runOffline } from '../src/cli/checks/index.js';
import { blocking, type CheckContext, type CheckReport } from '../src/cli/checks/types.js';
import { proseLength, missingSections, placeholders, images, undocumentedPermissions } from '../src/cli/checks/readme.js';

/** A manifest that passes everything, so each test can break exactly one thing. */
const GOOD_MANIFEST = {
  id: 'flight-tracker',
  name: 'Flight Tracker',
  version: '1.0.0',
  apiVersion: 1,
  author: 'Jane Doe',
  description: 'Shows your next flight on the trip dashboard.',
  type: 'widget',
  trek: '>=3.4.0 <4.0.0',
  icon: 'Plane',
  nativeModules: false,
  permissions: ['db:own'],
  requiredAddons: [],
  pluginDependencies: [],
};

/** A README that passes every registry gate. Long enough to clear the 400-char prose floor. */
const GOOD_README = `# Flight Tracker

![screenshot](./docs/screenshot.png)

## What it does

This plugin shows your next flight on the trip dashboard, so you never have to dig through your
inbox for a boarding pass again. It reads the trip you are looking at, finds the next reservation
of type flight, and renders it as a widget with the gate, the terminal and a countdown. There is
nothing to configure and nothing to sign up for, and it works offline once the trip has synced.

## Screenshots

The image above shows the widget on a trip dashboard.

## Permissions

| Permission | Why |
|---|---|
| \`db:own\` | Stores the cached flight lookup so the widget renders instantly. |

## Setup

Install it and enable it. There is nothing to configure.
`;

function ctx(over: Partial<CheckContext> = {}): CheckContext {
  const files = new Set<string>(['server/index.js', 'docs/screenshot.png']);
  return {
    dir: '/plugins/flight-tracker',
    manifest: { ...GOOD_MANIFEST },
    readme: GOOD_README,
    exists: (rel) => files.has(rel.replace(/^\.?\//, '')),
    ...over,
  };
}

const failed = (r: CheckReport, id: string) => r.errors.some((e) => e.id === id);
const warned = (r: CheckReport, id: string) => r.warnings.some((w) => w.id === id);

describe('the baseline is actually clean', () => {
  it('a well-formed plugin passes every offline check', () => {
    const r = runOffline(ctx());
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });
});

describe('manifest checks', () => {
  it('rejects a description longer than the registry allows', () => {
    const r = runOffline(ctx({ manifest: { ...GOOD_MANIFEST, description: 'x'.repeat(201) } }));
    expect(failed(r, 'manifest.entry-fields')).toBe(true);
  });

  it('rejects a missing description — the entry would carry an empty one and fail the schema', () => {
    const m = { ...GOOD_MANIFEST };
    delete (m as Record<string, unknown>).description;
    expect(failed(runOffline(ctx({ manifest: m })), 'manifest.entry-fields')).toBe(true);
  });

  it('accepts a description at exactly the 200-char cap', () => {
    const r = runOffline(ctx({ manifest: { ...GOOD_MANIFEST, description: 'x'.repeat(200) } }));
    expect(failed(r, 'manifest.entry-fields')).toBe(false);
  });

  it('rejects an icon lucide does not have — the registry does', () => {
    const r = runOffline(ctx({ manifest: { ...GOOD_MANIFEST, icon: 'Aeroplane' } }));
    expect(failed(r, 'manifest.icon')).toBe(true);
  });

  it('allows no icon at all (TREK falls back to Blocks) but says so', () => {
    const m = { ...GOOD_MANIFEST };
    delete (m as Record<string, unknown>).icon;
    const r = runOffline(ctx({ manifest: m }));
    expect(failed(r, 'manifest.icon')).toBe(false);
    expect(r.outcomes.find((o) => o.id === 'manifest.icon')?.detail).toMatch(/Blocks/);
  });

  it('rejects a homoglyph name that mixes Latin with Cyrillic', () => {
    // "Flight Trаcker" — the 'а' is Cyrillic U+0430.
    const r = runOffline(ctx({ manifest: { ...GOOD_MANIFEST, name: 'Flight Trаcker' } }));
    expect(failed(r, 'manifest.entry-fields')).toBe(true);
  });

  it('warns — but does not fail — on an unbounded trek range', () => {
    const r = runOffline(ctx({ manifest: { ...GOOD_MANIFEST, trek: '*' } }));
    expect(warned(r, 'manifest.trek-range')).toBe(true);
    expect(failed(r, 'manifest.trek-range')).toBe(false);
  });
});

/**
 * The egress trap.
 *
 * TREK builds the child's network allow-list and the iframe CSP from the `http:outbound:<host>`
 * PERMISSIONS. It never reads the manifest's `egress[]` array — that is a declaration for the
 * consent screen. So a host in egress[] with no matching permission is silently unreachable at
 * runtime: the plugin installs, activates, consents, and every request to it is blocked. Nothing
 * anywhere caught this before.
 */
describe('the egress trap', () => {
  const outbound = (permissions: string[], egress: string[]) =>
    runOffline(ctx({ manifest: { ...GOOD_MANIFEST, permissions, egress } }));

  it('fails a host declared in egress[] with only the bare http:outbound permission', () => {
    const r = outbound(['db:own', 'http:outbound'], ['api.example.com']);
    expect(failed(r, 'code.egress-reachable')).toBe(true);
    const e = r.errors.find((x) => x.id === 'code.egress-reachable');
    // The fix has to name the exact permission string, or the author is left guessing.
    expect(e?.fix).toContain('"http:outbound:api.example.com"');
  });

  it('passes when every egress host has its matching per-host permission', () => {
    const r = outbound(['db:own', 'http:outbound:api.example.com'], ['api.example.com']);
    expect(failed(r, 'code.egress-reachable')).toBe(false);
  });

  it('warns when a host is reachable but not declared in egress[] (the consent screen understates it)', () => {
    const r = outbound(['db:own', 'http:outbound:api.example.com'], []);
    expect(warned(r, 'code.egress-declared')).toBe(true);
  });
});

describe('README checks', () => {
  it('fails a README that is one char short of the prose floor, and passes one that is exactly at it', () => {
    // Build prose of an exact length, with all four sections present so only the floor is in play.
    const withProse = (n: number) =>
      GOOD_README.replace(
        /This plugin shows[\s\S]*?has synced\./,
        'x'.repeat(n),
      );
    const proseOf = (md: string) => proseLength(md);

    const short = withProse(1);
    const long = withProse(2000);
    expect(proseOf(short)).toBeLessThan(400);
    expect(proseOf(long)).toBeGreaterThanOrEqual(400);

    expect(failed(runOffline(ctx({ readme: short })), 'docs.readme-prose')).toBe(true);
    expect(failed(runOffline(ctx({ readme: long })), 'docs.readme-prose')).toBe(false);
  });

  it('fails a README missing a required section', () => {
    const r = runOffline(ctx({ readme: GOOD_README.replace('## Setup', '## Configuration') }));
    expect(failed(r, 'docs.readme-sections')).toBe(true);
  });

  it('fails a README with a permission it never explains', () => {
    const r = runOffline(ctx({ manifest: { ...GOOD_MANIFEST, permissions: ['db:own', 'weather:read'] } }));
    expect(failed(r, 'docs.permissions-explained')).toBe(true);
    expect(r.errors.find((e) => e.id === 'docs.permissions-explained')?.detail).toContain('weather:read');
  });

  it('fails template placeholders left in the README', () => {
    const r = runOffline(ctx({ readme: GOOD_README.replace('This plugin shows', 'Describe what it does.') }));
    expect(failed(r, 'docs.readme-placeholders')).toBe(true);
  });

  /**
   * The old check regexed for an image LINK and passed if it found one — so the scaffold's
   * `![screenshot](./docs/screenshot.png)`, pointing at a file that was never created, satisfied
   * it. Resolve the path instead.
   */
  it('fails a screenshot link whose file does not exist', () => {
    const r = runOffline(ctx({ exists: (rel) => rel === 'server/index.js' }));
    expect(failed(r, 'docs.screenshot')).toBe(true);
    expect(r.errors.find((e) => e.id === 'docs.screenshot')?.next).toBe('trek-plugin shot');
  });

  it('fails a README with no image at all', () => {
    const r = runOffline(ctx({ readme: GOOD_README.replace('![screenshot](./docs/screenshot.png)', '') }));
    expect(failed(r, 'docs.screenshot')).toBe(true);
  });
});

/**
 * `pack` must not be blocked by a gate that only matters at publish time — packing is how you
 * install a plugin into a local TREK to try it, and an unwritten README does not stop it running.
 */
describe('what blocks what', () => {
  it('an undocumented plugin blocks publish but not the artifact', () => {
    const undocumented = ctx({ readme: '# Nothing here\n', exists: (rel) => rel === 'server/index.js' });
    const full = runOffline(undocumented);
    expect(full.ok).toBe(false);

    expect(blocking(full, 'artifact').ok).toBe(true);
  });

  it('a broken manifest blocks the artifact too — that plugin could never load', () => {
    const broken = runOffline(ctx({ manifest: { ...GOOD_MANIFEST, trek: 'not-a-range' } }));
    expect(blocking(broken, 'artifact').ok).toBe(false);
  });

  it('a missing server entry blocks the artifact', () => {
    const r = runOffline(ctx({ exists: (rel) => rel === 'docs/screenshot.png' }));
    expect(blocking(r, 'artifact').ok).toBe(false);
    expect(failed(r, 'code.server-entry')).toBe(true);
  });
});

describe('README helpers mirror the registry exactly', () => {
  it('strips headings, tables, links, images and code fences before measuring prose', () => {
    const md = '# Title\n\n![x](y.png)\n\n| a | b |\n|---|---|\n\n```js\nconst x = 1;\n```\n\n[link](u)\n';
    expect(proseLength(md)).toBeLessThan(20); // nothing above is prose
  });

  it('finds required sections case-insensitively and as substrings', () => {
    expect(missingSections('## What it does\n## Screenshots\n## Permissions\n## Setup')).toEqual([]);
    expect(missingSections('### WHAT IT DOES and more\n## Screenshots\n## Permissions\n## Setup')).toEqual([]);
    expect(missingSections('## What it does')).toEqual(['Screenshots', 'Permissions', 'Setup']);
  });

  it('ignores data: URIs when looking for a screenshot, like the registry does', () => {
    expect(images('![a](data:image/png;base64,xxx)')).toEqual([]);
    expect(images('<img src="shot.png">')).toEqual(['shot.png']);
  });

  it('matches a permission anywhere in the README, case-insensitively', () => {
    expect(undocumentedPermissions('we use `DB:OWN` for caching', ['db:own'])).toEqual([]);
    expect(undocumentedPermissions('nothing here', ['db:own'])).toEqual(['db:own']);
  });

  it('spots each template placeholder the registry spots', () => {
    expect(placeholders('Describe what your plugin does.')).toHaveLength(1);
    expect(placeholders('see your-name/trek-plugin-x')).toHaveLength(1);
    expect(placeholders('{{ TODO }}')).toHaveLength(1);
    expect(placeholders('a real README')).toEqual([]);
  });
});
