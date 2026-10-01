import {
  AlertTriangle,
  BookOpen,
  Bug,
  Calendar,
  ChevronDown,
  ChevronUp,
  Coffee,
  ExternalLink,
  Heart,
  History,
  Lightbulb,
  Loader2,
  Tag,
} from 'lucide-react';
import { useEffect, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import apiClient from '../../api/client';
import { getLocaleForLanguage, useTranslation } from '../../i18n';
import { fs } from '../shared/DialogShell';
import { SETTINGS_BUTTON, SettingsCard, StatusPill } from '../Settings/settingsKit';

const REPO = 'liketrek/TREK';
const PER_PAGE = 10;

interface GithubRelease {
  id: number;
  prerelease: boolean;
  tag_name: string;
  name: string | null;
  body: string | null;
  published_at: string | null;
  created_at: string;
  author: { login: string } | null;
  [key: string]: unknown;
}

/** The Discord mark, sized and coloured like the lucide glyphs beside it. */
function DiscordIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

interface SupportLink {
  href: string;
  /** The brand's own colour: the icon and the hover edge take it, nothing else. */
  brand: string;
  icon: ComponentType<{ size?: number }>;
  title: ReactNode;
  hint: ReactNode;
}

/** One link to the project's other places: a card like the bookings', its brand only on the icon. */
function SupportCard({ link }: { link: SupportLink }) {
  const Icon = link.icon;
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-w-0 items-center gap-3 rounded-[14px] border border-edge-faint bg-surface-card p-3 no-underline transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[color:var(--brand)] hover:shadow-sm"
      style={{ '--brand': link.brand } as CSSProperties}
    >
      <span
        className="grid h-10 w-10 flex-none place-items-center rounded-[12px] shadow-sm"
        style={{ background: 'color-mix(in srgb, var(--brand) 13%, var(--bg-card))', color: 'var(--brand)' }}
      >
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-content" style={fs(13.5, 'body')}>{link.title}</span>
        <span className="block truncate text-content-faint" style={fs(11.5)}>{link.hint}</span>
      </span>
      <ExternalLink size={14} className="flex-none text-content-faint transition-colors group-hover:text-content-muted" />
    </a>
  );
}

export default function GitHubPanel({ isPrerelease = false }: { isPrerelease?: boolean }) {
  const { t, language } = useTranslation();
  const [releases, setReleases] = useState<GithubRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchReleases = async (pageNum = 1, append = false) => {
    try {
      const res = await apiClient.get(`/admin/github-releases`, { params: { per_page: PER_PAGE, page: pageNum } });
      const data = Array.isArray(res.data) ? res.data : [];
      setReleases((prev) => (append ? [...prev, ...data] : data));
      setHasMore(data.length === PER_PAGE);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    setLoading(true);
    void fetchReleases(1).finally(() => setLoading(false));
  }, []);

  const handleLoadMore = async () => {
    const next = page + 1;
    setLoadingMore(true);
    await fetchReleases(next, true);
    setPage(next);
    setLoadingMore(false);
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(getLocaleForLanguage(language), { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Simple markdown-to-html for release notes (handles headers, bold, lists, links)
  const renderBody = (body: string) => {
    if (!body) return null;
    const lines = body.split('\n');
    const elements: ReactNode[] = [];
    let listItems: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-1.5 space-y-1 pl-0">
            {listItems.map((item, i) => (
              <li key={i} className="flex gap-2 leading-relaxed text-content-secondary" style={fs(12.5, 'body')}>
                <span className="mt-[0.6em] h-1 w-1 flex-shrink-0 rounded-full bg-content-faint" />
                <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    const escapeHtml = (str: string) =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const inlineFormat = (text: string) => {
      return escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(
          /`(.+?)`/g,
          '<code style="font-size:0.9em;padding:1px 5px;border-radius:6px;background:var(--bg-tertiary)">$1</code>'
        )
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
          const safeUrl = url.startsWith('http://') || url.startsWith('https://') ? url : '#';
          return `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" style="color:var(--text-primary);text-decoration:underline;text-underline-offset:2px">${label}</a>`;
        });
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        flushList();
        continue;
      }

      if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h4 key={elements.length} className="mb-1 mt-3 font-geist font-bold uppercase tracking-[.08em] text-content-faint first:mt-0" style={fs(10)}>
            {trimmed.slice(4)}
          </h4>
        );
      } else if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(
          <h3 key={elements.length} className="mb-1 mt-3 font-semibold text-content first:mt-0" style={fs(13, 'body')}>
            {trimmed.slice(3)}
          </h3>
        );
      } else if (/^[-*] /.test(trimmed)) {
        listItems.push(trimmed.slice(2));
      } else {
        flushList();
        elements.push(
          <p
            key={elements.length}
            className="my-1 leading-relaxed text-content-secondary"
            style={fs(12.5, 'body')}
            dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed) }}
          />
        );
      }
    }
    flushList();
    return elements;
  };

  const supportLinks: SupportLink[] = [
    {
      href: 'https://ko-fi.com/mauriceboe',
      brand: '#ff5e5b', // theme-lint-disable: Ko-fi brand colour
      icon: Coffee,
      title: 'Ko-fi',
      hint: t('admin.github.support'),
    },
    {
      href: 'https://buymeacoffee.com/mauriceboe',
      brand: '#e0b400', // theme-lint-disable: Buy Me a Coffee brand yellow, deepened so it reads on white
      icon: Heart,
      title: 'Buy Me a Coffee',
      hint: t('admin.github.support'),
    },
    {
      href: 'https://discord.gg/NhZBDSd4qW',
      brand: '#5865F2', // theme-lint-disable: Discord brand colour
      icon: DiscordIcon,
      title: 'Discord',
      hint: 'Join the community',
    },
    {
      href: 'https://github.com/liketrek/TREK/issues/new?template=bug_report.yml',
      brand: 'var(--danger)',
      icon: Bug,
      title: t('settings.about.reportBug'),
      hint: t('settings.about.reportBugHint'),
    },
    {
      href: 'https://github.com/liketrek/TREK/discussions/new?category=feature-requests',
      brand: 'var(--warning)',
      icon: Lightbulb,
      title: t('settings.about.featureRequest'),
      hint: t('settings.about.featureRequestHint'),
    },
    {
      href: 'https://github.com/liketrek/TREK/wiki',
      brand: 'var(--text-secondary)',
      icon: BookOpen,
      title: 'Wiki',
      hint: t('settings.about.wikiHint'),
    },
  ];

  const subtitle = t('admin.github.subtitle').replace('{repo}', REPO);

  let releasesCard: ReactNode;
  if (loading) {
    releasesCard = (
      <SettingsCard icon={History} title={t('admin.github.title')} hint={subtitle}>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-content-faint" />
        </div>
      </SettingsCard>
    );
  } else if (error) {
    releasesCard = <SettingsCard icon={AlertTriangle} tone="danger" title={t('admin.github.error')} hint={error} />;
  } else {
    const shown = isPrerelease ? releases : releases.filter((r) => !r.prerelease);
    releasesCard = (
      <SettingsCard
        icon={History}
        title={t('admin.github.title')}
        hint={subtitle}
        action={
          <a
            href={`https://github.com/${REPO}/releases`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${SETTINGS_BUTTON} no-underline`}
            style={fs(12.5, 'body')}
          >
            <ExternalLink size={13} strokeWidth={2.2} />
            GitHub
          </a>
        }
      >
        {/* Timeline */}
        <div className="relative">
          {/* Timeline line, from the first dot's middle down to the last one's */}
          {shown.length > 1 && <div className="absolute bottom-6 left-[15px] top-4 w-px bg-edge" aria-hidden="true" />}

          <div className="flex flex-col gap-5">
            {shown.map((release, idx) => {
              const isLatest = idx === 0;
              const isExpanded = expanded[release.id];

              return (
                <div key={release.id} className="relative flex gap-3.5">
                  {/* Timeline dot */}
                  <span
                    className={`relative grid h-8 w-8 flex-none place-items-center rounded-[10px] ${
                      isLatest ? 'bg-accent text-accent-text' : 'bg-surface-card text-content-faint shadow-sm ring-1 ring-edge-faint'
                    }`}
                  >
                    <Tag size={13} strokeWidth={2.2} />
                  </span>

                  {/* Release content */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-geist font-bold tabular-nums text-content" style={fs(14, 'body')}>{release.tag_name}</span>
                      {isLatest && <StatusPill tone="success">{t('admin.github.latest')}</StatusPill>}
                      {release.prerelease && <StatusPill tone="warning">{t('admin.github.prerelease')}</StatusPill>}
                    </div>

                    {release.name && release.name !== release.tag_name && (
                      <p className="m-0 mt-0.5 truncate font-medium text-content-secondary" style={fs(12.5, 'body')}>{release.name}</p>
                    )}

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-content-faint" style={fs(11.5)}>
                      <span className="inline-flex items-center gap-1 font-geist tabular-nums text-content-faint">
                        <Calendar size={11} />
                        {formatDate(release.published_at || release.created_at)}
                      </span>
                      {release.author && (
                        <span className="text-content-faint">
                          {t('admin.github.by')} {release.author.login}
                        </span>
                      )}
                    </div>

                    {/* Expandable body */}
                    {release.body && (
                      <div className="mt-2">
                        <button type="button"
                          onClick={() => toggleExpand(release.id)}
                          aria-expanded={!!isExpanded}
                          className="inline-flex items-center gap-1 rounded-full bg-surface-tertiary px-2.5 py-1 font-semibold text-content-muted transition-colors hover:text-content"
                          style={fs(11.5, 'body')}
                        >
                          {isExpanded ? <ChevronUp size={12} strokeWidth={2.4} /> : <ChevronDown size={12} strokeWidth={2.4} />}
                          {isExpanded ? t('admin.github.hideDetails') : t('admin.github.showDetails')}
                        </button>

                        {isExpanded && (
                          <div className="mt-2.5 min-w-0 overflow-hidden break-words rounded-[12px] border border-edge-faint bg-surface-card px-3.5 py-3">
                            {renderBody(release.body)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center">
            <button type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className={SETTINGS_BUTTON}
              style={fs(12.5, 'body')}
            >
              {loadingMore ? <Loader2 size={13} className="animate-spin" /> : <ChevronDown size={13} strokeWidth={2.2} />}
              {loadingMore ? t('admin.github.loading') : t('admin.github.loadMore')}
            </button>
          </div>
        )}
      </SettingsCard>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Support links: one card, the six places as tiles inside it */}
      <SettingsCard icon={Heart} title={t('settings.about')}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {supportLinks.map((link) => <SupportCard key={link.href} link={link} />)}
        </div>
      </SettingsCard>

      {/* Loading / Error / Releases */}
      {releasesCard}
    </div>
  );
}
