import { AlertCircle, BookOpen, ChevronRight, Loader2, PanelLeft, Search, X } from 'lucide-react';
import { Children, type ReactNode } from 'react';
import Markdown from 'react-markdown';
import { Link } from 'react-router';
import remarkGfm from 'remark-gfm';
import PageShell from '../components/Layout/PageShell';
import { headingSlug } from '../help/headingSlug';
import { useTranslation } from '../i18n';
import { useHelp } from './help/useHelp';

export default function HelpPage() {
  const { t } = useTranslation();
  const { page, loading, pageError, query, setQuery, navOpen, setNavOpen, contentRef, activeSlug, filtered } =
    useHelp();

  const nav = (
    <nav className="flex flex-col gap-5">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('help.search')}
          className="w-full rounded-lg border border-transparent bg-surface-tertiary py-2 pl-9 pr-3 text-[13px] text-content outline-none focus:border-edge"
        />
      </div>
      {filtered.map((section) => (
        <div key={section.title}>
          {section.title && (
            <h3 className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-content-faint">
              {section.title}
            </h3>
          )}
          <div className="flex flex-col">
            {section.pages.map((p) => {
              const active = p.slug === activeSlug;
              return (
                <Link
                  key={p.slug}
                  to={`/help/${p.slug}`}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors ${
                    active
                      ? 'bg-accent-subtle font-semibold text-accent'
                      : 'text-content-secondary hover:bg-surface-hover'
                  }`}
                >
                  {active && <ChevronRight size={13} className="shrink-0" />}
                  <span className={active ? '' : 'pl-[18px]'}>{p.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      {!filtered.length && <p className="px-2 text-[12px] text-content-faint">{t('help.noResults')}</p>}
    </nav>
  );

  return (
    <PageShell className="bg-surface-secondary" navOffset="var(--nav-h, 56px)">
      <div className="mx-auto flex max-w-[1600px] gap-10 px-4 py-6 lg:px-10">
        {/* Desktop sidebar */}
        <aside className="hidden w-[260px] shrink-0 lg:block">
          <div className="sticky top-[calc(var(--nav-h,56px)+24px)] max-h-[calc(100vh-var(--nav-h,56px)-48px)] overflow-y-auto pr-1">
            <div className="mb-4 flex items-center gap-2 px-2">
              <BookOpen size={16} className="text-accent" />
              <span className="text-[14px] font-bold text-content">{t('help.title')}</span>
            </div>
            {nav}
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1" ref={contentRef}>
          {/* Mobile nav toggle */}
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-edge bg-surface-card px-3 py-2 text-[13px] font-medium text-content lg:hidden"
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
              <p className="max-w-sm text-[13px] text-content-faint">{t('help.errorBody')}</p>
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
        <div className="fixed inset-0 z-[120] lg:hidden" role="presentation" onClick={() => setNavOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-0 left-0 top-0 w-[280px] overflow-y-auto bg-surface-card p-5 shadow-xl"
            role="presentation"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2 text-[14px] font-bold text-content">
                <BookOpen size={16} className="text-accent" /> {t('help.title')}
              </span>
              <button type="button" onClick={() => setNavOpen(false)} className="text-content-faint">
                <X size={18} />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}
    </PageShell>
  );
}

/**
 * GitHub's heading-anchor slug: lowercase, punctuation dropped, spaces to
 * hyphens. Wiki pages link to their own sections with `](#some-heading)`, and
 * those hrefs are written against GitHub's scheme — so ours has to match it, or
 * in-app anchors point at nothing. The slug itself lives in `help/headingSlug`,
 * so the help center's doc links are checked against the same rule.
 */
function headingId(children: ReactNode): string {
  const text = Children.toArray(children)
    .map((c) => (typeof c === 'string' || typeof c === 'number' ? String(c) : ''))
    .join('');
  return headingSlug(text);
}

/** Markdown renderer with TREK-styled elements and SPA-internal links. */
function WikiContent({ markdown }: { markdown: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 id={headingId(children)} className="mb-4 mt-1 text-[26px] font-bold leading-tight text-content">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2
            id={headingId(children)}
            className="mb-3 mt-8 scroll-mt-24 border-b border-edge-secondary pb-1.5 text-[19px] font-bold text-content"
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 id={headingId(children)} className="mb-2 mt-6 scroll-mt-24 text-[15.5px] font-semibold text-content">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 id={headingId(children)} className="mb-2 mt-5 scroll-mt-24 text-[14px] font-semibold text-content">
            {children}
          </h4>
        ),
        p: ({ children }) => <p className="my-3 text-[14px] leading-[1.7] text-content-secondary">{children}</p>,
        ul: ({ children }) => (
          <ul className="my-3 list-disc space-y-1.5 pl-5 text-[14px] text-content-secondary">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-3 list-decimal space-y-1.5 pl-5 text-[14px] text-content-secondary">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-[1.6]">{children}</li>,
        a: ({ href, children }) => {
          const url = href ?? '';
          if (url.startsWith('#'))
            return (
              <a href={url} className="text-accent hover:underline">
                {children}
              </a>
            );
          if (url.startsWith('/'))
            return (
              <Link to={url} className="font-medium text-accent hover:underline">
                {children}
              </Link>
            );
          return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">
              {children}
            </a>
          );
        },
        img: ({ src, alt }) => (
          <img
            src={typeof src === 'string' ? src : ''}
            alt={alt}
            loading="lazy"
            className="my-4 max-w-full rounded-lg border border-edge"
          />
        ),
        code: ({ className, children }) => {
          const isBlock = (className ?? '').includes('language-');
          if (isBlock) return <code className={className}>{children}</code>;
          return (
            <code className="rounded bg-surface-tertiary px-1.5 py-0.5 font-mono text-[12.5px] text-content">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="my-4 overflow-x-auto rounded-xl border border-edge-secondary bg-surface-tertiary p-4 font-mono text-[12.5px] leading-relaxed text-content">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-3 bg-accent-subtle/40 my-4 rounded-r-lg border-accent px-4 py-1 text-content-secondary">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="my-4 overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-edge-secondary bg-surface-tertiary px-3 py-2 text-left font-semibold text-content">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-edge-secondary px-3 py-2 text-content-secondary">{children}</td>
        ),
        hr: () => <hr className="my-6 border-edge-secondary" />,
      }}
    >
      {markdown}
    </Markdown>
  );
}
