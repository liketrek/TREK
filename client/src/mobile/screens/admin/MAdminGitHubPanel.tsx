import { type ReactNode } from 'react'
import { Tag, Calendar, ExternalLink, ChevronDown, ChevronUp, Loader2, Heart, Coffee, Bug, Lightbulb, BookOpen } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { useGithubReleases } from '../../../components/Admin/useGithubReleases'
import { escapeReleaseHtml as escapeHtml, parseReleaseNotes } from '../../../utils/releaseNotes'
import { MAdminButton, MAdminCard } from './MAdminUi'

const REPO = 'liketrek/TREK'

// Support / community link cards (design: brand-tinted icon tile + title/sub).
// Brand hex stays as content identity; every surface/border uses --m-* tokens.
interface LinkCard {
  href: string
  color: string
  icon: ReactNode
  title: string
  sub: string
}

export default function MAdminGitHubPanel({ isPrerelease = false }: { isPrerelease?: boolean }) {
  const { t } = useTranslation()
  const {
    releases, shownReleases, loading, error, expanded, toggleExpand, hasMore, loadingMore, handleLoadMore, formatDate,
  } = useGithubReleases({ isPrerelease, fillPages: true })

  // Simple markdown-to-html for release notes (handles headers, bold, lists, links)
  const renderBody = (body: string | null) => {
    if (!body) return null

    // `[label](url)` → anchor, exactly as /\[([^\]]+)\]\(([^)]+)\)/g did. Written as a
    // scan because that pattern backtracks from both ends: `[^\]]` matches `[` and
    // `[^)]` matches `(`, so a run of either made the engine retry the whole match from
    // every one of them, reading to the end each time. Release bodies come off the
    // GitHub API. Both parts are one-or-more, so `[](url)` and `[label]()` stay plain
    // text; the label ends at the first `]`, the url at the first `)`.
    const linkify = (text: string) => {
      let out = ''
      let cursor = 0
      let search = 0
      for (;;) {
        const open = text.indexOf('[', search)
        if (open === -1) break
        const close = text.indexOf(']', open + 1)
        if (close === -1) break // no `]` left: no later `[` can match either
        // Every `[` up to `close` shares that first `]`, so they fail together.
        if (close === open + 1 || text[close + 1] !== '(') {
          search = close + 1
          continue
        }
        const end = text.indexOf(')', close + 2)
        if (end === -1) break // no `)` left: no later `(` can close either
        if (end === close + 2) {
          search = close + 1
          continue
        }
        const label = text.slice(open + 1, close)
        const url = text.slice(close + 2, end)
        const safeUrl = url.startsWith('http://') || url.startsWith('https://') ? url : '#'
        out += `${text.slice(cursor, open)}<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" style="color:var(--m-st-info);text-decoration:underline">${label}</a>`
        cursor = end + 1
        search = end + 1
      }
      return out + text.slice(cursor)
    }
    const inlineFormat = (text: string) => {
      return linkify(
        escapeHtml(text)
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/`(.+?)`/g, '<code style="font-size:11px;padding:1px 4px;border-radius:4px;background:var(--m-ic)">$1</code>')
      )
    }

    return parseReleaseNotes(body).map((block, idx) => {
      if (block.kind === 'ul') {
        return (
          <ul key={`ul-${idx}`} className="space-y-1 my-2">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs text-m-muted">
                <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--m-faint)' }} />
                <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
              </li>
            ))}
          </ul>
        )
      }
      if (block.kind === 'h4') {
        return (
          <h4 key={idx} className="text-xs font-semibold mt-3 mb-1 text-m-ink">
            {block.text}
          </h4>
        )
      }
      if (block.kind === 'h3') {
        return (
          <h3 key={idx} className="text-sm font-semibold mt-3 mb-1 text-m-ink">
            {block.text}
          </h3>
        )
      }
      return (
        <p key={idx} className="text-xs my-1 text-m-muted"
          dangerouslySetInnerHTML={{ __html: inlineFormat(block.text) }}
        />
      )
    })
  }

  const discordIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
  )

  const cards: LinkCard[] = [
    { href: 'https://ko-fi.com/mauriceboe', color: '#ff5e5b', icon: <Coffee size={18} className="text-[#ff5e5b]" />, title: 'Ko-fi', sub: t('admin.github.support') },
    { href: 'https://buymeacoffee.com/mauriceboe', color: '#ffdd00', icon: <Heart size={18} className="text-[#ffdd00]" />, title: 'Buy Me a Coffee', sub: t('admin.github.support') },
    { href: 'https://discord.gg/NhZBDSd4qW', color: '#5865F2', icon: discordIcon, title: 'Discord', sub: 'Join the community' },
    { href: 'https://github.com/liketrek/TREK/issues/new?template=bug_report.yml', color: '#ef4444', icon: <Bug size={18} className="text-[#ef4444]" />, title: t('settings.about.reportBug'), sub: t('settings.about.reportBugHint') },
    { href: 'https://github.com/liketrek/TREK/discussions/new?category=feature-requests', color: '#f59e0b', icon: <Lightbulb size={18} className="text-[#f59e0b]" />, title: t('settings.about.featureRequest'), sub: t('settings.about.featureRequestHint') },
    { href: 'https://github.com/liketrek/TREK/wiki', color: '#6366f1', icon: <BookOpen size={18} className="text-[#6366f1]" />, title: 'Wiki', sub: t('settings.about.wikiHint') },
  ]

  return (
    <div className="space-y-3">
      {/* Support / community cards */}
      <div className="grid grid-cols-1 gap-[10px]">
        {cards.map((card) => (
          <a
            key={card.href}
            href={card.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-[18px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] px-[14px] py-3 no-underline"
          >
            <span
              className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px]"
              style={{ background: `${card.color}22` }}
            >
              {card.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[0.8125rem] font-bold text-m-ink">{card.title}</div>
              <div className="mt-[1px] truncate font-geist text-[0.625rem] text-m-faint">{card.sub}</div>
            </div>
            <ExternalLink size={14} className="ms-auto flex-none text-m-faint" />
          </a>
        ))}
      </div>

      {/* Loading / Error / Releases */}
      {loading ? (
        <MAdminCard>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-m-muted" />
          </div>
        </MAdminCard>
      ) : error && releases.length === 0 ? (
        <MAdminCard>
          <div className="py-4 text-center">
            <p className="text-[0.8125rem] text-m-muted">{t('admin.github.error')}</p>
            <p className="mt-1 font-geist text-[0.625rem] text-m-faint">{error}</p>
          </div>
        </MAdminCard>
      ) : (
        <div className="overflow-hidden rounded-[18px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)]">
          <div className="flex items-center justify-between gap-2 border-b border-[color:var(--m-rowbr)] px-[14px] py-[13px]">
            <div className="min-w-0 flex-1">
              <h2 className="text-[0.875rem] font-extrabold text-m-ink">{t('admin.github.title')}</h2>
              <p className="mt-[2px] truncate font-geist text-[0.625rem] text-m-faint">
                {t('admin.github.subtitle').replace('{repo}', REPO)}
              </p>
            </div>
            <a
              href={`https://github.com/${REPO}/releases`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-none items-center gap-[5px] rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[7px] text-[0.6875rem] font-bold text-m-ink no-underline"
            >
              <ExternalLink size={12} />
              GitHub
            </a>
          </div>

          {/* Timeline */}
          <div className="px-[14px] py-3">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute start-[11px] top-3 bottom-3 w-px" style={{ background: 'var(--m-rowbr)' }} />

              <div className="space-y-0">
                {shownReleases.map((release, idx) => {
                  const isLatest = idx === 0
                  const isExpanded = expanded[release.id]

                  return (
                    <div key={release.id} className="relative pb-5 ps-8">
                      {/* Timeline dot */}
                      <div
                        className="absolute start-0 top-1 flex h-[23px] w-[23px] items-center justify-center rounded-full border-2"
                        style={{
                          background: isLatest ? 'var(--m-ink)' : 'var(--m-sheetop)',
                          borderColor: isLatest ? 'var(--m-ink)' : 'var(--m-rowbr)',
                        }}
                      >
                        <Tag size={10} style={{ color: isLatest ? 'var(--m-sheetop)' : 'var(--m-faint)' }} />
                      </div>

                      {/* Release content */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[0.875rem] font-bold text-m-ink">
                            {release.tag_name}
                          </span>
                          {isLatest && (
                            <span className="rounded-full bg-[color:color-mix(in_srgb,var(--m-st-confirmed)_14%,transparent)] px-2 py-[2px] text-[0.625rem] font-bold text-[color:var(--m-st-confirmed)]">
                              {t('admin.github.latest')}
                            </span>
                          )}
                          {release.prerelease && (
                            <span className="rounded-full bg-[color:color-mix(in_srgb,var(--m-st-pending)_14%,transparent)] px-2 py-[2px] text-[0.625rem] font-bold text-[color:var(--m-st-pending)]">
                              {t('admin.github.prerelease')}
                            </span>
                          )}
                        </div>

                        {release.name && release.name !== release.tag_name && (
                          <p className="mt-[2px] text-xs font-medium text-m-muted">
                            {release.name}
                          </p>
                        )}

                        <div className="mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[0.6875rem] text-m-faint">
                            <Calendar size={10} />
                            {formatDate(release.published_at || release.created_at)}
                          </span>
                          {release.author && (
                            <span className="text-[0.6875rem] text-m-faint">
                              {t('admin.github.by')} {release.author.login}
                            </span>
                          )}
                        </div>

                        {/* Expandable body */}
                        {release.body && (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => toggleExpand(release.id)}
                              className="flex items-center gap-1 text-[0.6875rem] font-medium text-m-muted"
                            >
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              {isExpanded ? t('admin.github.hideDetails') : t('admin.github.showDetails')}
                            </button>

                            {isExpanded && (
                              <div className="mt-2 rounded-lg bg-[color:var(--m-ic)] p-3">
                                {renderBody(release.body)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* A failed "Load more" keeps the timeline and stays retryable */}
            {error && (
              <p className="pb-1 text-center font-geist text-[0.625rem] text-m-faint">
                {t('admin.github.error')} — {error}
              </p>
            )}

            {/* Load more */}
            {hasMore && (
              <div className="pt-1 text-center">
                <MAdminButton variant="ghost" busy={loadingMore} onClick={handleLoadMore}>
                  {!loadingMore && <ChevronDown size={12} />}
                  {loadingMore ? t('admin.github.loading') : t('admin.github.loadMore')}
                </MAdminButton>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
