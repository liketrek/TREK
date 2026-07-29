// FE-MOB-AGH-001 to FE-MOB-AGH-019
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '../../../helpers/render';
import { server } from '../../../helpers/msw/server';
import { resetAllStores } from '../../../helpers/store';
import MAdminGitHubPanel from '../../../../src/mobile/screens/admin/MAdminGitHubPanel';

interface ReleaseOverrides {
  id?: number;
  tag_name?: string;
  name?: string | null;
  body?: string | null;
  published_at?: string | null;
  created_at?: string;
  prerelease?: boolean;
  author?: { login: string } | null;
}

function buildRelease(overrides: ReleaseOverrides = {}) {
  return {
    id: 1,
    tag_name: 'v1.0.0',
    name: 'Initial Release',
    body: null,
    published_at: '2025-01-15T12:00:00Z',
    created_at: '2025-01-15T12:00:00Z',
    prerelease: false,
    author: { login: 'mauriceboe' },
    ...overrides,
  };
}

const PAGE_1 = Array.from({ length: 10 }, (_, i) => buildRelease({ id: i + 1, tag_name: `v1.${i}.0` }));
const PAGE_2 = Array.from({ length: 3 }, (_, i) => buildRelease({ id: 100 + i, tag_name: `v0.${i}.0` }));

function releasesRespondWith(payload: unknown) {
  server.use(http.get('/api/admin/github-releases', () => HttpResponse.json(payload)));
}

beforeEach(() => {
  resetAllStores();
  releasesRespondWith([]);
});

afterEach(() => {
  server.resetHandlers();
});

async function renderPanel(props: { isPrerelease?: boolean } = {}) {
  const view = render(<MAdminGitHubPanel {...props} />);
  await waitFor(() => expect(document.querySelector('.animate-spin')).not.toBeInTheDocument());
  return view;
}

describe('MAdminGitHubPanel', () => {
  it('FE-MOB-AGH-001: renders the six support cards with their external hrefs', async () => {
    await renderPanel();

    expect(screen.getByText('Ko-fi').closest('a')).toHaveAttribute('href', 'https://ko-fi.com/mauriceboe');
    expect(screen.getByText('Buy Me a Coffee').closest('a')).toHaveAttribute(
      'href',
      'https://buymeacoffee.com/mauriceboe',
    );
    const discord = screen.getByText('Discord').closest('a')!;
    expect(discord).toHaveAttribute('href', 'https://discord.gg/NhZBDSd4qW');
    expect(discord).toHaveAttribute('target', '_blank');
    expect(discord).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('Report a Bug')).toBeInTheDocument();
    expect(screen.getByText('Feature Request')).toBeInTheDocument();
    expect(screen.getByText('Wiki').closest('a')).toHaveAttribute('href', 'https://github.com/mauriceboe/TREK/wiki');
    expect(screen.getAllByText('Helps me keep building TREK')).toHaveLength(2);
  });

  it('FE-MOB-AGH-002: shows a spinner while the releases request is in flight', () => {
    server.use(
      http.get('/api/admin/github-releases', async () => {
        await new Promise(() => {});
        return HttpResponse.json([]);
      }),
    );
    render(<MAdminGitHubPanel />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Release History')).not.toBeInTheDocument();
  });

  it('FE-MOB-AGH-003: renders the error card with the axios message when the request fails', async () => {
    server.use(
      http.get('/api/admin/github-releases', () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    );
    render(<MAdminGitHubPanel />);

    await screen.findByText('Failed to load releases');
    expect(screen.getByText(/500/)).toBeInTheDocument();
    expect(screen.queryByText('Release History')).not.toBeInTheDocument();
  });

  it('FE-MOB-AGH-004: renders the timeline header with the repo subtitle and the GitHub link', async () => {
    releasesRespondWith([buildRelease()]);
    await renderPanel();

    expect(screen.getByText('Release History')).toBeInTheDocument();
    expect(screen.getByText('Latest updates from mauriceboe/TREK')).toBeInTheDocument();
    expect(screen.getByText('GitHub').closest('a')).toHaveAttribute(
      'href',
      'https://github.com/mauriceboe/TREK/releases',
    );
  });

  it('FE-MOB-AGH-005: marks only the first release as latest and shows the release name and author', async () => {
    releasesRespondWith([
      buildRelease({ id: 1, tag_name: 'v2.0.0', name: 'Big Bang' }),
      buildRelease({ id: 2, tag_name: 'v1.9.0', name: 'v1.9.0' }),
    ]);
    await renderPanel();

    expect(screen.getAllByText('Latest')).toHaveLength(1);
    expect(screen.getByText('v2.0.0')).toBeInTheDocument();
    // name === tag_name on the second release, so it is not repeated
    expect(screen.getByText('Big Bang')).toBeInTheDocument();
    expect(screen.getAllByText('v1.9.0')).toHaveLength(1);
    expect(screen.getAllByText('by mauriceboe')).toHaveLength(2);
  });

  it('FE-MOB-AGH-006: falls back to created_at when published_at is null and hides a missing author', async () => {
    releasesRespondWith([
      buildRelease({ published_at: null, created_at: '2024-03-02T08:00:00Z', author: null, name: null }),
    ]);
    await renderPanel();

    expect(screen.getByText('Mar 2, 2024')).toBeInTheDocument();
    expect(screen.queryByText(/by /)).not.toBeInTheDocument();
  });

  it('FE-MOB-AGH-007: hides prereleases unless the panel runs in prerelease mode', async () => {
    releasesRespondWith([
      buildRelease({ id: 1, tag_name: 'v3.0.0-beta.1', prerelease: true }),
      buildRelease({ id: 2, tag_name: 'v2.9.0' }),
    ]);
    await renderPanel();

    expect(screen.queryByText('v3.0.0-beta.1')).not.toBeInTheDocument();
    expect(screen.getByText('v2.9.0')).toBeInTheDocument();
  });

  it('FE-MOB-AGH-008: prerelease mode shows the pre-release badge', async () => {
    releasesRespondWith([buildRelease({ id: 1, tag_name: 'v3.0.0-beta.1', prerelease: true })]);
    await renderPanel({ isPrerelease: true });

    expect(screen.getByText('v3.0.0-beta.1')).toBeInTheDocument();
    expect(screen.getByText('Pre-release')).toBeInTheDocument();
  });

  it('FE-MOB-AGH-009: no toggle is offered for a release without a body', async () => {
    releasesRespondWith([buildRelease({ body: null })]);
    await renderPanel();

    expect(screen.queryByText('Show details')).not.toBeInTheDocument();
  });

  it('FE-MOB-AGH-010: expands and collapses the release notes', async () => {
    releasesRespondWith([buildRelease({ body: '- Fixed a bug' })]);
    const user = userEvent.setup();
    await renderPanel();

    expect(screen.queryByText('Fixed a bug')).not.toBeInTheDocument();
    await user.click(screen.getByText('Show details'));
    expect(await screen.findByText('Fixed a bug')).toBeInTheDocument();

    await user.click(screen.getByText('Hide details'));
    await waitFor(() => expect(screen.queryByText('Fixed a bug')).not.toBeInTheDocument());
    expect(screen.getByText('Show details')).toBeInTheDocument();
  });

  it('FE-MOB-AGH-011: renders headings, list items and paragraphs from the markdown body', async () => {
    releasesRespondWith([
      buildRelease({
        body: '## Highlights\n- first item\n- second item\n\n### Details\nA plain paragraph.',
      }),
    ]);
    const user = userEvent.setup();
    await renderPanel();
    await user.click(screen.getByText('Show details'));

    expect((await screen.findByText('Highlights')).tagName).toBe('H3');
    expect(screen.getByText('Details').tagName).toBe('H4');
    expect(screen.getByText('first item').closest('li')).toBeInTheDocument();
    expect(screen.getByText('second item').closest('li')).toBeInTheDocument();
    expect(screen.getByText('A plain paragraph.').tagName).toBe('P');
  });

  it('FE-MOB-AGH-012: renders bold and inline code inside list items', async () => {
    releasesRespondWith([buildRelease({ body: '- **bold text**\n- `inline code`' })]);
    const user = userEvent.setup();
    await renderPanel();
    await user.click(screen.getByText('Show details'));

    expect((await screen.findByText('bold text')).tagName).toBe('STRONG');
    expect(screen.getByText('inline code').tagName).toBe('CODE');
  });

  it('FE-MOB-AGH-013: keeps http links and rewrites unsafe link targets to #', async () => {
    releasesRespondWith([
      buildRelease({ body: '- [click here](https://example.com)\n- [evil](javascript:alert(1))' }),
    ]);
    const user = userEvent.setup();
    await renderPanel();
    await user.click(screen.getByText('Show details'));

    const safe = await screen.findByText('click here');
    expect(safe.tagName).toBe('A');
    expect(safe).toHaveAttribute('href', 'https://example.com');
    expect(safe).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('evil')).toHaveAttribute('href', '#');
  });

  it('FE-MOB-AGH-014: escapes html in the release body instead of rendering it', async () => {
    releasesRespondWith([buildRelease({ body: 'plain <img src=x onerror="alert(1)"> text' })]);
    const user = userEvent.setup();
    await renderPanel();
    await user.click(screen.getByText('Show details'));

    expect(await screen.findByText('plain <img src=x onerror="alert(1)"> text')).toBeInTheDocument();
    expect(document.querySelector('img')).not.toBeInTheDocument();
  });

  it('FE-MOB-AGH-015: hides "Load more" when the first page is not full', async () => {
    releasesRespondWith(PAGE_2);
    await renderPanel();

    expect(screen.getByText('v0.0.0')).toBeInTheDocument();
    expect(screen.queryByText('Load more')).not.toBeInTheDocument();
  });

  it('FE-MOB-AGH-016: "Load more" appends the second page and then disappears', async () => {
    server.use(
      http.get('/api/admin/github-releases', ({ request }) => {
        const page = new URL(request.url).searchParams.get('page');
        return HttpResponse.json(page === '2' ? PAGE_2 : PAGE_1);
      }),
    );
    const user = userEvent.setup();
    await renderPanel();

    expect(screen.getAllByText(/^v1\.\d\.0$/)).toHaveLength(10);
    await user.click(screen.getByText('Load more'));

    expect(await screen.findByText('v0.0.0')).toBeInTheDocument();
    expect(screen.getAllByText(/^v[01]\.\d\.0$/)).toHaveLength(13);
    expect(screen.queryByText('Load more')).not.toBeInTheDocument();
  });

  it('FE-MOB-AGH-017: a failing "Load more" keeps the timeline and can be retried', async () => {
    let calls = 0;
    server.use(
      http.get('/api/admin/github-releases', () => {
        calls += 1;
        if (calls === 2) return HttpResponse.json({ message: 'nope' }, { status: 500 });
        return HttpResponse.json(calls === 1 ? PAGE_1 : PAGE_2);
      }),
    );
    const user = userEvent.setup();
    await renderPanel();

    await user.click(screen.getByText('Load more'));
    await screen.findByText(/Failed to load releases/);
    expect(screen.getAllByText(/^v1\.\d\.0$/)).toHaveLength(10);

    // the retry succeeds and clears the error
    await user.click(screen.getByText('Load more'));
    expect(await screen.findByText('v0.0.0')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/Failed to load releases/)).not.toBeInTheDocument());
  });

  it('FE-MOB-AGH-018: a non-array response is treated as an empty release list', async () => {
    releasesRespondWith({ message: 'rate limited' });
    await renderPanel();

    expect(screen.getByText('Release History')).toBeInTheDocument();
    expect(screen.queryByText('Load more')).not.toBeInTheDocument();
    expect(screen.queryByText('Latest')).not.toBeInTheDocument();
  });

  it('FE-MOB-AGH-019: skips over a full page that only contains prereleases', async () => {
    const prereleasePage = Array.from({ length: 10 }, (_, i) =>
      buildRelease({ id: 200 + i, tag_name: `v4.0.0-beta.${i}`, prerelease: true }),
    );
    server.use(
      http.get('/api/admin/github-releases', ({ request }) => {
        const page = new URL(request.url).searchParams.get('page');
        return HttpResponse.json(page === '1' ? prereleasePage : PAGE_2);
      }),
    );
    await renderPanel();

    expect(screen.getByText('v0.0.0')).toBeInTheDocument();
    expect(screen.queryByText('Load more')).not.toBeInTheDocument();
  });
});
