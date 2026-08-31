/**
 * The network checks talk to GitHub only through the global `fetch`, so they run here against a
 * stubbed fetch and no network. These tests pin the README-at-commit gate — in particular its
 * screenshot half: the registry's check-readme.mjs fetches EXACTLY `docs/screenshot.png` at the
 * pinned commit (that precise path is what the store card loads), and preflight must grade the
 * same path the same way. The offline twin of this gate lives in checks.test.ts.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { NETWORK_CHECKS } from '../src/cli/checks/network.js';
import { makeContext } from '../src/cli/checks/context.js';
import type { RegistryEntry } from '../src/cli/checks/types.js';

const readmeAtCommit = NETWORK_CHECKS.find((c) => c.id === 'network.readme-at-commit');
if (!readmeAtCommit) throw new Error('network.readme-at-commit is not registered');

/** Passes every registry README rule: four sections, no placeholders, ≥400 chars of prose,
 *  and the manifest's one permission (`db:own`) named. */
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

const SHA = 'a'.repeat(40);

const ENTRY: RegistryEntry = {
  id: 'flight-tracker',
  name: 'Flight Tracker',
  author: 'You',
  description: 'Live flight status on the dashboard.',
  repo: 'you/trek-plugin-flight-tracker',
  type: 'widget',
  versions: [
    {
      version: '1.0.0',
      gitTag: 'v1.0.0',
      commitSha: SHA,
      downloadUrl: 'https://github.com/you/trek-plugin-flight-tracker/releases/download/v1.0.0/plugin.zip',
      sha256: '0'.repeat(64),
      trek: '>=4.0.0 <5.0.0',
      size: 1234,
      apiVersion: 1,
      nativeModules: false,
      publishedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
};

const MANIFEST_AT_COMMIT = JSON.stringify({ id: 'flight-tracker', permissions: ['db:own'] });

type Route = { ok: boolean; status: number; contentType?: string; body?: string } | 'throw';

/** Serve each URL by suffix; anything unrouted is a test bug, not a silent 404. */
function stubFetch(routes: Record<string, Route>): ReturnType<typeof vi.fn> {
  const fn = vi.fn(async (url: unknown, init?: { headers?: Record<string, string> }) => {
    void init;
    const key = Object.keys(routes).find((k) => String(url).endsWith(k));
    if (!key) throw new Error(`unexpected fetch in test: ${String(url)}`);
    const r = routes[key];
    if (r === 'throw') throw new Error('network down');
    return {
      ok: r.ok,
      status: r.status,
      headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? (r.contentType ?? null) : null) },
      text: async () => r.body ?? '',
    };
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

const ctx = () => makeContext({ entry: ENTRY });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('network.readme-at-commit — the README graded at the pinned commit', () => {
  it('passes a good README whose docs/screenshot.png serves an image at the commit', async () => {
    const fetchFn = stubFetch({
      '/README.md': { ok: true, status: 200, body: GOOD_README },
      '/docs/screenshot.png': { ok: true, status: 200, contentType: 'image/png' },
      '/trek-plugin.json': { ok: true, status: 200, body: MANIFEST_AT_COMMIT },
    });

    const r = await readmeAtCommit.run(ctx());
    expect(r.status).toBe('pass');

    // The screenshot probe mirrors the registry gate byte-for-byte: the exact path at the
    // pinned commit, first 2 KB only.
    const shot = fetchFn.mock.calls.find(([u]) => String(u).endsWith('/docs/screenshot.png'));
    expect(shot?.[0]).toBe(`https://raw.githubusercontent.com/${ENTRY.repo}/${SHA}/docs/screenshot.png`);
    expect(shot?.[1]?.headers?.Range).toBe('bytes=0-2047');
  });

  it('fails naming docs/screenshot.png when the file 404s at the commit — README links to other images do not count', async () => {
    stubFetch({
      '/README.md': { ok: true, status: 200, body: GOOD_README },
      '/docs/screenshot.png': { ok: false, status: 404, contentType: 'text/plain' },
      '/trek-plugin.json': { ok: true, status: 200, body: MANIFEST_AT_COMMIT },
    });

    const r = await readmeAtCommit.run(ctx());
    expect(r.status).toBe('fail');
    expect(r.fix).toMatch(/docs\/screenshot\.png does not resolve to an image/);
    expect(r.fix).toMatch(/404/);
    expect(r.fix).toMatch(/trek-plugin shot/);
  });

  it('fails when the file resolves but is not an image (200 with no content-type)', async () => {
    stubFetch({
      '/README.md': { ok: true, status: 200, body: GOOD_README },
      '/docs/screenshot.png': { ok: true, status: 200 },
      '/trek-plugin.json': { ok: true, status: 200, body: MANIFEST_AT_COMMIT },
    });

    const r = await readmeAtCommit.run(ctx());
    expect(r.status).toBe('fail');
    expect(r.fix).toMatch(/no content-type/);
  });

  it('fails calling the screenshot unreachable when the fetch itself throws', async () => {
    stubFetch({
      '/README.md': { ok: true, status: 200, body: GOOD_README },
      '/docs/screenshot.png': 'throw',
      '/trek-plugin.json': { ok: true, status: 200, body: MANIFEST_AT_COMMIT },
    });

    const r = await readmeAtCommit.run(ctx());
    expect(r.status).toBe('fail');
    expect(r.fix).toMatch(/docs\/screenshot\.png is unreachable/);
  });

  it('fails on a README missing at the commit — the tree is not what the registry grades', async () => {
    stubFetch({
      '/README.md': { ok: false, status: 404 },
    });

    const r = await readmeAtCommit.run(ctx());
    expect(r.status).toBe('fail');
    expect(r.detail).toMatch(/README\.md not found/);
  });

  it('reports the README problems and the permission parity together, like the registry does', async () => {
    stubFetch({
      '/README.md': { ok: true, status: 200, body: '# Stub\n\nDescribe what it does. {{TAGLINE}}\n' },
      '/docs/screenshot.png': { ok: true, status: 200, contentType: 'image/png' },
      '/trek-plugin.json': { ok: true, status: 200, body: MANIFEST_AT_COMMIT },
    });

    const r = await readmeAtCommit.run(ctx());
    expect(r.status).toBe('fail');
    expect(r.fix).toMatch(/missing required section/);
    expect(r.fix).toMatch(/template placeholder/);
    expect(r.fix).toMatch(/chars of prose/);
    expect(r.fix).toMatch(/permissions not explained in the README: db:own/);
  });

  it('skips without an entry — nothing to grade against', async () => {
    stubFetch({});
    const r = await readmeAtCommit.run(makeContext({}));
    expect(r.status).toBe('skip');
  });
});
