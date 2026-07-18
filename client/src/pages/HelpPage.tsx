import { Children, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Search, ChevronRight, Loader2, AlertCircle, BookOpen, PanelLeft, X } from 'lucide-react'
import PageShell from '../components/Layout/PageShell'
import { useTranslation } from '../i18n'
import { useHelp } from './help/useHelp'

export default function HelpPage() {
  const { t } = useTranslation()
  const { page, loading, pageError, query, setQuery, navOpen, setNavOpen, contentRef, activeSlug, filtered } =
    useHelp()

  const nav = (
    <nav className="flex flex-col gap-5">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('help.search')}
          className="w-full bg-surface-tertiary text-content rounded-lg pl-9 pr-3 py-2 text-[13px] outline-none border border-transparent focus:border-edge"
        />
      </div>
      {filtered.map((section) => (
        <div key={section.title}>
          {section.title && (
            <h3 className="text-[10px] font-semibold tracking-[0.1em] uppercase text-content-faint mb-1.5 px-2">
              {section.title}
            </h3>
          )}
          <div className="flex flex-col">
            {section.pages.map((p) => {
              const active = p.slug === activeSlug
              return (
                <Link
                  key={p.slug}
                  to={`/help/${p.slug}`}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] transition-colors ${
                    active
                      ? 'bg-accent-subtle text-accent font-semibold'
                      : 'text-content-secondary hover:bg-surface-hover'
                  }`}
                >
                  {active && <ChevronRight size={13} className="shrink-0" />}
                  <span className={active ? '' : 'pl-[18px]'}>{p.title}</span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
      {!filtered.length && <p className="text-[12px] text-content-faint px-2">{t('help.noResults')}</p>}
    </nav>
  )

  return (
    <PageShell className="bg-surface-secondary" navOffset="var(--nav-h, 56px)">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-10 py-6 flex gap-10">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[260px] shrink-0">
          <div className="sticky top-[calc(var(--nav-h,56px)+24px)] max-h-[calc(100vh-var(--nav-h,56px)-48px)] overflow-y-auto pr-1">
            <div className="flex items-center gap-2 mb-4 px-2">
              <BookOpen size={16} className="text-accent" />
              <span className="text-[14px] font-bold text-content">{t('help.title')}</span>
            </div>
            {nav}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0" ref={contentRef}>
          {/* Mobile nav toggle */}
          <button
            onClick={() => setNavOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-surface-card border border-edge text-[13px] font-medium text-content"
          >
            <PanelLeft size={15} /> {t('help.contents')}
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-content-faint">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : pageError ? (
            <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
              <AlertCircle size={28} className="text-content-faint" />
              <p className="text-[14px] font-semibold text-content">{t('help.errorTitle')}</p>
              <p className="text-[13px] text-content-faint max-w-sm">{t('help.errorBody')}</p>
            </div>
          ) : page ? (
            <article className="wiki-prose max-w-[1040px]">
              <WikiContent markdown={page.markdown} />
            </article>
          ) : null}
        </main>
      </div>

      {/* Mobile sidebar drawer */}
      {navOpen && (
        <div className="lg:hidden fixed inset-0 z-[120]" onClick={() => setNavOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute left-0 top-0 bottom-0 w-[280px] bg-surface-card p-5 overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[14px] font-bold text-content flex items-center gap-2">
                <BookOpen size={16} className="text-accent" /> {t('help.title')}
              </span>
              <button onClick={() => setNavOpen(false)} className="text-content-faint">
                <X size={18} />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}
    </PageShell>
  )
}

/**
 * GitHub's heading-anchor slug: lowercase, punctuation dropped, spaces to
 * hyphens. Wiki pages link to their own sections with `](#some-heading)`, and
 * those hrefs are written against GitHub's scheme — so ours has to match it, or
 * in-app anchors point at nothing.
 */
function headingId(children: ReactNode): string {
  const text = Children.toArray(children)
    .map(c => (typeof c === 'string' || typeof c === 'number' ? String(c) : ''))
    .join('')
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

/** Markdown renderer with TREK-styled elements and SPA-internal links. */
function WikiContent({ markdown }: { markdown: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 id={headingId(children)} className="text-[26px] font-bold text-content mt-1 mb-4 leading-tight">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 id={headingId(children)} className="text-[19px] font-bold text-content mt-8 mb-3 pb-1.5 border-b border-edge-secondary scroll-mt-24">
            {children}
          </h2>
        ),
        h3: ({ children }) => <h3 id={headingId(children)} className="text-[15.5px] font-semibold text-content mt-6 mb-2 scroll-mt-24">{children}</h3>,
        h4: ({ children }) => <h4 id={headingId(children)} className="text-[14px] font-semibold text-content mt-5 mb-2 scroll-mt-24">{children}</h4>,
        p: ({ children }) => <p className="text-[14px] text-content-secondary leading-[1.7] my-3">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 my-3 space-y-1.5 text-[14px] text-content-secondary">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 my-3 space-y-1.5 text-[14px] text-content-secondary">{children}</ol>,
        li: ({ children }) => <li className="leading-[1.6]">{children}</li>,
        a: ({ href, children }) => {
          const url = href ?? ''
          if (url.startsWith('#')) return <a href={url} className="text-accent hover:underline">{children}</a>
          if (url.startsWith('/')) return <Link to={url} className="text-accent hover:underline font-medium">{children}</Link>
          return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">
              {children}
            </a>
          )
        },
        img: ({ src, alt }) => (
          <img src={typeof src === 'string' ? src : ''} alt={alt} loading="lazy" className="rounded-lg border border-edge my-4 max-w-full" />
        ),
        code: ({ className, children }) => {
          const isBlock = (className ?? '').includes('language-')
          if (isBlock) return <code className={className}>{children}</code>
          return <code className="bg-surface-tertiary text-content rounded px-1.5 py-0.5 text-[12.5px] font-mono">{children}</code>
        },
        pre: ({ children }) => (
          <pre className="bg-surface-tertiary text-content rounded-xl p-4 my-4 overflow-x-auto text-[12.5px] font-mono leading-relaxed border border-edge-secondary">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-3 border-accent bg-accent-subtle/40 rounded-r-lg px-4 py-1 my-4 text-content-secondary">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="w-full text-[13px] border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="text-left font-semibold text-content border border-edge-secondary px-3 py-2 bg-surface-tertiary">
            {children}
          </th>
        ),
        td: ({ children }) => <td className="text-content-secondary border border-edge-secondary px-3 py-2">{children}</td>,
        hr: () => <hr className="my-6 border-edge-secondary" />,
      }}
    >
      {markdown}
    </Markdown>
  )
}
