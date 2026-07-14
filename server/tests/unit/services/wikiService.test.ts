import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';

// wikiService picks its source (local disk vs GitHub) once at module load, so each
// mode needs a fresh import with TREK_WIKI_DIR already set.
const FIXTURE_WIKI = path.join(__dirname, '..', '..', 'fixtures', 'wiki');
const MISSING_WIKI = path.join(__dirname, '..', '..', 'fixtures', 'no-such-wiki');

type WikiModule = typeof import('../../../src/services/wikiService');

async function loadWiki(dir: string | undefined): Promise<WikiModule> {
  vi.resetModules();
  if (dir === undefined) delete process.env.TREK_WIKI_DIR;
  else process.env.TREK_WIKI_DIR = dir;
  return import('../../../src/services/wikiService');
}

const fetchSpy = vi.fn();

beforeEach(() => {
  fetchSpy.mockReset();
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.TREK_WIKI_DIR;
});

describe('wikiService — local wiki on disk', () => {
  it('serves the sidebar from disk and never touches the network', async () => {
    const wiki = await loadWiki(FIXTURE_WIKI);
    expect(wiki.isLocalWiki()).toBe(true);

    const { sections } = await wiki.getWikiIndex();

    expect(sections.map((s) => s.title)).toEqual(['Getting Started', 'Planning']); // empty section dropped
    expect(sections[0].pages).toEqual([
      { title: 'Home', slug: 'Home' },
      { title: 'Quick Start', slug: 'Quick-Start' },
    ]);
    // `_private` fails SLUG_RE, so it is filtered out of the nav.
    expect(sections[1].pages).toEqual([{ title: 'Sample Page', slug: 'Sample' }]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('renders a page, rewriting wikilinks and relative images', async () => {
    const wiki = await loadWiki(FIXTURE_WIKI);
    const page = await wiki.getWikiPage('Sample');

    expect(page.title).toBe('Sample Page');
    expect(page.markdown).toContain('[Quick Start](/help/Quick-Start)');
    expect(page.markdown).toContain('[Home](/help/Home)');
    expect(page.markdown).toContain('![A picture](/api/help/asset/assets/pic.png)');
    expect(page.markdown).toContain('![External](https://example.com/x.png)'); // absolute URLs left alone
    expect(page.markdown).not.toContain('TODO: screenshot'); // HTML comments stripped
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('404s an unknown page instead of falling back to GitHub', async () => {
    const wiki = await loadWiki(FIXTURE_WIKI);

    // A page missing from disk does not exist in *this* version — falling back to
    // GitHub here is what would reintroduce version skew.
    await expect(wiki.getWikiPage('Nope')).rejects.toBeInstanceOf(wiki.WikiNotFound);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each([['_Sidebar'], ['../Home'], ['a/b'], ['']])('rejects the invalid slug %j', async (slug) => {
    const wiki = await loadWiki(FIXTURE_WIKI);
    await expect(wiki.getWikiPage(slug)).rejects.toBeInstanceOf(wiki.WikiNotFound);
  });

  it('serves an asset from disk with the right content type', async () => {
    const wiki = await loadWiki(FIXTURE_WIKI);
    const { buf, type } = await wiki.getWikiAsset('assets/pic.png');

    expect(type).toBe('image/png');
    expect(buf.subarray(1, 4).toString()).toBe('PNG');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each([
    ['../../src/config.ts'],
    ['../../../.env'],
    ['assets/../../package.json'],
    ['/etc/passwd'],
    ['assets/notes.txt'],
  ])('refuses the asset path %j', async (assetPath) => {
    const wiki = await loadWiki(FIXTURE_WIKI);
    await expect(wiki.getWikiAsset(assetPath)).rejects.toBeInstanceOf(wiki.WikiNotFound);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('404s a missing asset', async () => {
    const wiki = await loadWiki(FIXTURE_WIKI);
    await expect(wiki.getWikiAsset('assets/ghost.png')).rejects.toBeInstanceOf(wiki.WikiNotFound);
  });
});

describe('wikiService — GitHub fallback when no wiki is on disk', () => {
  const ok = (body: string): Response =>
    ({ ok: true, status: 200, text: async () => body, arrayBuffer: async () => new ArrayBuffer(4) }) as unknown as Response;

  it('fetches from GitHub and caches the result', async () => {
    const wiki = await loadWiki(MISSING_WIKI);
    expect(wiki.isLocalWiki()).toBe(false);

    fetchSpy.mockResolvedValue(ok('## Docs\n- [[Home]]\n'));

    const first = await wiki.getWikiIndex();
    const second = await wiki.getWikiIndex();

    expect(first.sections[0].pages).toEqual([{ title: 'Home', slug: 'Home' }]);
    expect(second).toEqual(first);
    expect(fetchSpy).toHaveBeenCalledTimes(1); // second read served from cache
    expect(fetchSpy.mock.calls[0][0]).toContain('raw.githubusercontent.com');
  });

  it('serves a stale cache entry when GitHub is unreachable', async () => {
    const wiki = await loadWiki(MISSING_WIKI);

    fetchSpy.mockResolvedValueOnce(ok('# Cached\n'));
    const before = await wiki.getWikiPage('Home');

    fetchSpy.mockRejectedValue(new Error('network down'));
    const after = await wiki.getWikiPage('Home');

    expect(after.title).toBe(before.title);
  });

  it('404s when GitHub is unreachable and nothing is cached', async () => {
    const wiki = await loadWiki(MISSING_WIKI);
    fetchSpy.mockRejectedValue(new Error('network down'));

    await expect(wiki.getWikiPage('Home')).rejects.toBeInstanceOf(wiki.WikiNotFound);
  });
});

describe('wikiService — default path resolution', () => {
  it("resolves the repo's wiki/ with no override, so a release never ships without docs", async () => {
    // Guards the __dirname anchor and the Dockerfile COPY: if either breaks, help
    // silently degrades to the GitHub fallback and nobody notices.
    const wiki = await loadWiki(undefined);

    expect(wiki.isLocalWiki()).toBe(true);
    const page = await wiki.getWikiPage('Home');
    expect(page.title.length).toBeGreaterThan(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
