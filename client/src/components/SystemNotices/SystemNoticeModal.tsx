import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Info, AlertTriangle, AlertOctagon, X, ChevronLeft, ChevronRight, Coffee } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { useSystemNoticeStore } from '../../store/systemNoticeStore.js';
import type { SystemNoticeDTO } from '../../store/systemNoticeStore.js';
import { useTranslation, isRtlLanguage } from '../../i18n/index.js';
import { runNoticeAction } from './noticeActions.js';

const ReactMarkdown = React.lazy(() =>
  import('react-markdown').then(m => ({ default: m.default }))
);

/** Safe rAF shim — falls back to setTimeout(0) in environments without rAF (e.g. jsdom). */
function scheduleFrame(cb: () => void): () => void {
  if (typeof requestAnimationFrame !== 'undefined') {
    const id = requestAnimationFrame(cb);
    return () => cancelAnimationFrame(id);
  }
  const id = setTimeout(cb, 0);
  return () => clearTimeout(id);
}

const SEVERITY_ICONS: Record<string, React.ElementType> = {
  info: Info,
  warn: AlertTriangle,
  critical: AlertOctagon,
};

const SEVERITY_ACCENT: Record<string, string> = {
  info:     'text-blue-500  dark:text-blue-400  bg-blue-50  dark:bg-blue-950',
  warn:     'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950',
  critical: 'text-rose-600  dark:text-rose-400  bg-rose-50  dark:bg-rose-950',
};

// Real brand marks (simple-icons single-path logos) for the support buttons, so the
// Buy Me a Coffee / Ko-fi buttons carry their actual logo instead of a generic
// lucide glyph. Tinted via currentColor.
const BRAND_ICON_PATHS: Record<string, string> = {
  buymeacoffee:
    'M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.2-1.756.205-.656.004-1.31-.025-1.966-.022-.699.004-1.556-.06-2.095-.58-.475-.458-.54-1.174-.605-1.793l-.731-7.013-.322-3.094c-.037-.351-.286-.695-.678-.678-.336.015-.718.3-.678.679l.228 2.185.949 9.112c.147 1.344 1.174 2.068 2.446 2.272.742.12 1.503.144 2.257.156.966.016 1.942.053 2.892-.122 1.408-.258 2.465-1.198 2.616-2.657.34-3.332.683-6.663 1.024-9.995l.215-2.087a.484.484 0 01.39-.426c.402-.078.787-.212 1.074-.518.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233-2.416.359-4.866.54-7.308.46-1.748-.06-3.477-.254-5.207-.498-.17-.024-.353-.055-.47-.18-.22-.236-.111-.71-.054-.995.052-.26.152-.609.463-.646.484-.057 1.046.148 1.526.22.577.088 1.156.159 1.737.212 2.48.226 5.002.19 7.472-.14.45-.06.899-.13 1.345-.21.399-.072.84-.206 1.08.206.166.281.188.657.162.974a.544.544 0 01-.169.364zm-6.159 3.9c-.862.37-1.84.788-3.109.788a5.884 5.884 0 01-1.569-.217l.877 9.004c.065.78.717 1.38 1.5 1.38 0 0 1.243.065 1.658.065.447 0 1.786-.065 1.786-.065.783 0 1.434-.6 1.499-1.38l.94-9.95a3.996 3.996 0 00-1.322-.238c-.826 0-1.491.284-2.26.613z',
  kofi:
    'M11.351 2.715c-2.7 0-4.986.025-6.83.26C2.078 3.285 0 5.154 0 8.61c0 3.506.182 6.13 1.585 8.493 1.584 2.701 4.233 4.182 7.662 4.182h.83c4.209 0 6.494-2.234 7.637-4a9.5 9.5 0 0 0 1.091-2.338C21.792 14.688 24 12.22 24 9.208v-.415c0-3.247-2.13-5.507-5.792-5.87-1.558-.156-2.65-.208-6.857-.208m0 1.947c4.208 0 5.09.052 6.571.182 2.624.311 4.13 1.584 4.13 4v.39c0 2.156-1.792 3.844-3.87 3.844h-.935l-.156.649c-.208 1.013-.597 1.818-1.039 2.546-.909 1.428-2.545 3.064-5.922 3.064h-.805c-2.571 0-4.831-.883-6.078-3.195-1.09-2-1.298-4.155-1.298-7.506 0-2.181.857-3.402 3.012-3.714 1.533-.233 3.559-.26 6.39-.26m6.547 2.287c-.416 0-.65.234-.65.546v2.935c0 .311.234.545.65.545 1.324 0 2.051-.754 2.051-2s-.727-2.026-2.052-2.026m-10.39.182c-1.818 0-3.013 1.48-3.013 3.142 0 1.533.858 2.857 1.949 3.897.727.701 1.87 1.429 2.649 1.896a1.47 1.47 0 0 0 1.507 0c.78-.467 1.922-1.195 2.623-1.896 1.117-1.039 1.974-2.364 1.974-3.897 0-1.662-1.247-3.142-3.039-3.142-1.065 0-1.792.545-2.338 1.298-.493-.753-1.246-1.298-2.312-1.298',
};

function brandForHref(href?: string): string | null {
  if (!href) return null;
  if (href.includes('buymeacoffee')) return 'buymeacoffee';
  if (href.includes('ko-fi.com') || href.includes('kofi')) return 'kofi';
  return null;
}

function BrandIcon({ brand, size = 18, className }: { brand: string; size?: number; className?: string }) {
  const d = BRAND_ICON_PATHS[brand];
  if (!d) return null;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

interface Props {
  notices: SystemNoticeDTO[];
}

// Inner content shared between desktop and mobile layouts
interface ContentProps {
  notice: SystemNoticeDTO;
  title: string;
  body: string;
  ctaLabel: string | null;
  secondaryCtaLabel: string | null;
  titleId: string;
  bodyId: string;
  isDark: boolean;
  onDismiss: () => void;
  onDismissAll: () => void;
  onCTA: () => void;
  onSecondaryCTA: () => void;
  // Pager
  total: number;
  currentPage: number;
  canPage: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoto: (i: number) => void;
}

function NoticeContent({ notice, title, body, ctaLabel, secondaryCtaLabel, titleId, bodyId, isDark, onDismiss, onDismissAll, onCTA, onSecondaryCTA, total, currentPage, canPage, onPrev, onNext, onGoto }: ContentProps) {
  const { t } = useTranslation();
  const isLastPage = total <= 1 || currentPage === total - 1;

  const DefaultIcon = SEVERITY_ICONS[notice.severity] ?? Info;
  const LucideIcon: React.ElementType = notice.icon
    ? ((LucideIcons as Record<string, unknown>)[notice.icon] as React.ElementType) ?? DefaultIcon
    : DefaultIcon;

  // Real brand logo for each support button, detected from the link target.
  const primaryBrand = notice.cta?.kind === 'link' ? brandForHref(notice.cta.href) : null;
  const secondaryBrand = notice.secondaryCta?.kind === 'link' ? brandForHref(notice.secondaryCta.href) : null;

  return (
    <div className="flex flex-col relative" style={{ flex: '1 1 0', minHeight: '100%' }}>
      {/* Dismiss X button — only on last page so users read all notices */}
      {notice.dismissible && isLastPage && (
        <button
          onClick={onDismissAll}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>
      )}

      {/* Scrollable content — vertically centered when shorter than available space */}
      <div className="flex flex-col justify-center" style={{ flex: '1 1 0' }}>
        {/* Hero image (not inline) */}
        {notice.media && notice.media.placement !== 'inline' && (
          <div
            className="w-full overflow-hidden"
            style={{ aspectRatio: notice.media.aspectRatio ?? '16/9' }}
          >
            <img
              src={isDark && notice.media.srcDark ? notice.media.srcDark : notice.media.src}
              alt={t(notice.media.altKey)}
              className="w-full h-full object-cover"
              fetchPriority="high"
              decoding="async"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}

        {/* Special warm header for Heart icon (thank-you notice) */}
        {notice.icon === 'Heart' && !notice.media && (
          <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-pink-500 to-indigo-500 px-8 py-6 text-center">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 80%, white 1px, transparent 1px)', backgroundSize: '60px 60px, 80px 80px, 40px 40px' }} />
            <h2 id={titleId} className="relative text-xl font-bold text-white leading-tight">{title}</h2>
          </div>
        )}

        <div className={`${notice.icon === 'Heart' && !notice.media ? 'px-8 py-6' : 'p-8'} flex flex-col`}>
          {/* Severity icon (when no hero and not Heart) */}
          {!notice.media && notice.icon !== 'Heart' && (
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${SEVERITY_ACCENT[notice.severity] ?? ''}`}>
              <LucideIcon size={28} />
            </div>
          )}

          {/* Title (not for Heart — rendered in gradient header) */}
          {(notice.icon !== 'Heart' || notice.media) && (
            <h2
              id={titleId}
              className="text-xl font-semibold text-center text-slate-900 dark:text-slate-100 mb-3"
            >
              {title}
            </h2>
          )}

          {/* Body — markdown */}
          <div
            id={bodyId}
            className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 mx-auto mb-4 text-center"
          >
            <React.Suspense fallback={<p className="text-sm text-slate-500">{body}</p>}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-300 dark:decoration-indigo-700 hover:decoration-indigo-500 dark:hover:decoration-indigo-400 underline-offset-2 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  p: ({ children }) => {
                    // Signature line styling (e.g. "— Maurice")
                    const text = typeof children === 'string' ? children : Array.isArray(children) ? children.find(c => typeof c === 'string') : '';
                    if (typeof text === 'string' && text.trim().startsWith('—') && text.trim().length < 30) {
                      return <p className="mt-4 mb-3 text-base font-semibold text-slate-800 dark:text-slate-200 italic">{children}</p>;
                    }
                    return <p className="mb-3 last:mb-0">{children}</p>;
                  },
                  hr: () => (
                    <div className="my-5 flex items-center gap-3">
                      <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
                      <span className="text-slate-300 dark:text-slate-600 text-xs">♡</span>
                      <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
                    </div>
                  ),
                  strong: ({ children }) => <strong className="font-semibold text-slate-800 dark:text-slate-200">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc list-inside text-left">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside text-left">{children}</ol>,
                }}
              >
                {body}
              </ReactMarkdown>
            </React.Suspense>
          </div>

          {/* Inline image */}
          {notice.media?.placement === 'inline' && (
            <div
              className="w-full overflow-hidden rounded-lg mb-4 mx-auto"
              style={{ aspectRatio: notice.media.aspectRatio ?? '16/9' }}
            >
              <img
                src={isDark && notice.media.srcDark ? notice.media.srcDark : notice.media.src}
                alt={t(notice.media.altKey)}
                className="w-full h-full object-cover"
                decoding="async"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}

          {/* Highlights — compact pills */}
          {notice.highlights && notice.highlights.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {notice.highlights.map((h, i) => {
                const HIcon: React.ElementType | null = h.iconName
                  ? ((LucideIcons as Record<string, unknown>)[h.iconName] as React.ElementType) ?? null
                  : null;
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    {HIcon
                      ? <HIcon size={13} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
                      : <span className="text-indigo-500 shrink-0">✓</span>
                    }
                    {t(h.labelKey)}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sticky footer — pager + CTA, always anchored at the bottom of the slot */}
      <div
        className="sticky bottom-0 px-8 pt-4 flex flex-col gap-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800"
        style={{ paddingBottom: 'calc(var(--bottom-nav-h) + 1rem)' }}
      >
        {/* Pager — dots, arrows, counter (only when multiple notices) */}
        {total > 1 && (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <button
                onClick={onPrev}
                disabled={!canPage || currentPage === 0}
                aria-label={t('system_notice.pager.prev')}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: total }, (_, i) => (
                <button
                  key={i}
                  onClick={() => { if (canPage) onGoto(i); }}
                  aria-label={t('system_notice.pager.goto').replace('{n}', String(i + 1))}
                  aria-current={i === currentPage ? 'true' : undefined}
                  disabled={!canPage && i !== currentPage}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentPage
                      ? 'bg-blue-500 dark:bg-blue-400'
                      : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 disabled:cursor-not-allowed'
                  }`}
                />
              ))}

              <button
                onClick={onNext}
                disabled={!canPage || currentPage === total - 1}
                aria-label={t('system_notice.pager.next')}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <span className="text-xs text-slate-400 tabular-nums">
              {t('system_notice.pager.counter')
                .replace('{current}', String(currentPage + 1))
                .replace('{total}', String(total))}
            </span>
          </div>
        )}

        {/* CTA(s) + dismiss link */}
        <div className="flex flex-col items-center gap-3">
          {ctaLabel && isLastPage ? (
            <div className="flex w-full flex-col sm:flex-row gap-2.5">
              <button
                id={`notice-cta-${notice.id}`}
                onClick={onCTA}
                className={`flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-lg font-semibold shadow-sm transition active:scale-[0.98] ${
                  notice.cta?.kind === 'link'
                    ? 'bg-[#FFDD00] text-[#0D0C22] hover:brightness-95'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {primaryBrand ? <BrandIcon brand={primaryBrand} size={18} /> : (notice.cta?.kind === 'link' && <Coffee size={17} aria-hidden="true" />)}
                {ctaLabel}
              </button>
              {secondaryCtaLabel && (
                <button
                  id={`notice-cta2-${notice.id}`}
                  onClick={onSecondaryCTA}
                  className={`flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-lg font-semibold shadow-sm transition active:scale-[0.98] ${
                    notice.secondaryCta?.kind === 'link'
                      ? 'bg-[#FF5E5B] text-white hover:brightness-95'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {secondaryBrand ? <BrandIcon brand={secondaryBrand} size={18} /> : (notice.secondaryCta?.kind === 'link' && <Coffee size={17} aria-hidden="true" />)}
                  {secondaryCtaLabel}
                </button>
              )}
            </div>
          ) : (notice.dismissible || isLastPage) && (
            <button
              id={`notice-cta-${notice.id}`}
              onClick={isLastPage ? onDismissAll : onNext}
              className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              {t('common.ok')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


/**
 * Drives the system-notice modal: pager index + visibility, mobile/dark/reduced-
 * motion detection, body-scroll lock, keyboard (ESC + arrows) and the page-slide
 * animation refs. Exposes dismiss/CTA/pager handlers + the touch-drag refs used
 * by the mobile bottom sheet. The two layout components below render from it.
 */
function useSystemNoticeModal(notices: SystemNoticeDTO[]) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [pageAnnouncement, setPageAnnouncement] = useState('');
  const navigate = useNavigate();
  const { dismiss } = useSystemNoticeStore();
  const { t, language } = useTranslation();

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && (window.matchMedia?.('(max-width: 639px)')?.matches ?? false)
  );

  const [isDark, setIsDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false);

  const notice = notices[idx] ?? null;

  // Non-dismissible notices lock the pager so users must act before advancing.
  const canPage = notice?.dismissible !== false;

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  // 'h' once we classify the gesture as horizontal, 'v' for vertical, null = unclassified
  const dragLockRef = useRef<'h' | 'v' | null>(null);
  // Sheet scroll offset at the moment the touch began — used to suppress dismiss-drag
  // when the user is scrolled into content and pans down to scroll back up.
  const scrollTopAtTouchStart = useRef(0);
  // Keep a ref to the current notice id so dismiss/CTA handlers see the latest value
  const noticeIdRef = useRef<string | null>(null);
  noticeIdRef.current = notice?.id ?? null;

  // Page-slide animation refs.
  // isPageNavRef: set to true just before a user-initiated page change so the
  // grace-delay effect knows to run a slide instead of hide+show.
  // slideDirRef: 'right' = new content enters from the right (Next), 'left' = from the left (Prev).
  // contentWrapperRef: the div wrapping NoticeContent — we animate its transform directly.
  const isPageNavRef = useRef(false);
  const slideDirRef  = useRef<'left' | 'right'>('right');
  // Mobile drag strip — wraps all 3 slots and is translated to reveal prev/current/next
  const stripRef = useRef<HTMLDivElement>(null);
  // The sheet element itself — animated on vertical drag-to-dismiss
  const sheetRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  // Individual slot scroll containers (prev / center / next)
  const prevSlotRef  = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null); // center slot
  const nextSlotRef  = useRef<HTMLDivElement>(null);

  // Mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia?.('(max-width: 639px)');
    if (!mq) return;
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Dark mode observer
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // Clamp idx when notices array shrinks (e.g. after dismiss of the last page)
  useEffect(() => {
    if (notices.length > 0 && idx >= notices.length) {
      setIdx(notices.length - 1);
    }
  }, [notices.length, idx]);

  // Fires on every notice-id change. Branches on whether this is a user-initiated
  // page navigation (slide the content wrapper) or a modal appear/dismiss-advance
  // (grace-delay the whole modal).
  useEffect(() => {
    if (!notice) return;

    // ── Page navigation: slide new content in, keep modal visible ────────────
    if (isPageNavRef.current) {
      isPageNavRef.current = false;
      const el = contentWrapperRef.current;
      if (el && !prefersReducedMotion) {
        // The handler already set el.style.transform to the start position
        // synchronously before setIdx was called. Trigger the transition here.
        requestAnimationFrame(() => {
          el.style.transition = 'transform 260ms ease-out';
          el.style.transform = 'translateX(0)';
          const onEnd = () => {
            el.style.transition = '';
            el.style.transform = '';
            el.removeEventListener('transitionend', onEnd);
          };
          el.addEventListener('transitionend', onEnd);
        });
      }
      return;
    }

    // ── Modal appearing / dismiss-advance: grace delay ────────────────────────
    setVisible(false);
    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    const cancel1 = scheduleFrame(() => {
      const cancel2 = scheduleFrame(() => {
        timerId = setTimeout(() => {
          if (!cancelled) setVisible(true);
        }, 500);
      });
      if (cancelled) cancel2();
    });
    return () => {
      cancelled = true;
      cancel1();
      if (timerId !== undefined) clearTimeout(timerId);
    };
  }, [notice?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ESC key — closes all modal notices (only on last page so users read all notices)
  const isLastPage = notices.length <= 1 || idx === notices.length - 1;
  useEffect(() => {
    if (!visible || !notice?.dismissible || !isLastPage) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismissAll();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [visible, notice?.dismissible, isLastPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Arrow-key pager navigation
  useEffect(() => {
    if (!visible || notices.length <= 1) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (!canPage) return;
      // In RTL layouts the directional meaning of arrows is flipped
      const forward = isRtlLanguage(language) ? e.key === 'ArrowLeft' : e.key === 'ArrowRight';
      if (forward && idx < notices.length - 1) {
        triggerPageSlide('right');
        setIdx(idx + 1);
        announceIndex(idx + 1, notices.length);
      } else if (!forward && idx > 0) {
        triggerPageSlide('left');
        setIdx(idx - 1);
        announceIndex(idx - 1, notices.length);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [visible, idx, notices.length, canPage, language]); // eslint-disable-line react-hooks/exhaustive-deps

  // Body scroll lock
  useEffect(() => {
    if (visible && notice) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [visible, notice]);

  // Reset center slot scroll to top on navigation (keyboard / pager buttons).
  useEffect(() => {
    if (!isMobile) return;
    contentWrapperRef.current?.scrollTo({ top: 0 });
  }, [idx, isMobile]);

  function announceIndex(newIdx: number, total: number) {
    setPageAnnouncement(
      t('system_notice.pager.position')
        .replace('{current}', String(newIdx + 1))
        .replace('{total}', String(total)),
    );
  }

  // Dismiss current notice. The store removes it from the array, and the next
  // notice naturally shifts into notices[idx]. The clamp effect handles the
  // edge case where idx was pointing at the last item.
  function handleDismissById(id: string) {
    setVisible(false);
    dismiss(id);
  }

  function handleDismiss() {
    const id = noticeIdRef.current;
    if (id) handleDismissById(id);
  }

  // Dismiss every notice in the current modal list — used by the X button and ESC.
  function handleDismissAll() {
    setVisible(false);
    notices.forEach(n => dismiss(n.id));
  }

  function runCta(cta: SystemNoticeDTO['cta']) {
    if (!cta) { handleDismissAll(); return; }
    if (cta.kind === 'nav') {
      navigate(cta.href);
      if (notice?.dismissible !== false) handleDismissAll();
    } else if (cta.kind === 'link') {
      // External link (e.g. Buy Me a Coffee / Ko-fi): open in a new tab and leave the
      // notice open so the user can use the other button too.
      window.open(cta.href, '_blank', 'noopener,noreferrer');
    } else {
      runNoticeAction(cta.actionId, { navigate });
      if (cta.dismissOnAction !== false) handleDismissAll();
    }
  }
  function handleCTA() { runCta(notice?.cta); }
  function handleSecondaryCTA() { runCta(notice?.secondaryCta); }

  function animatedDismissAll() {
    const sheet = sheetRef.current;
    if (!sheet || prefersReducedMotion) { handleDismissAll(); return; }
    sheet.style.transition = 'transform 300ms ease-out';
    sheet.style.transform = 'translateY(110%)';
    sheet.addEventListener('transitionend', function onDone() {
      sheet.removeEventListener('transitionend', onDone);
      handleDismissAll();
    }, { once: true });
  }

  // Sets up the content wrapper's start transform SYNCHRONOUSLY (before React
  // re-renders with the new notice), then flags the grace-delay effect to slide
  // rather than hide+show.
  function triggerPageSlide(dir: 'left' | 'right') {
    isPageNavRef.current = true;
    slideDirRef.current = dir;
    if (!prefersReducedMotion) {
      const el = contentWrapperRef.current;
      if (el) {
        el.style.transition = 'none';
        el.style.transform = dir === 'right' ? 'translateX(100%)' : 'translateX(-100%)';
      }
    }
  }

  function handlePrev() {
    if (!canPage || idx <= 0) return;
    const next = idx - 1;
    triggerPageSlide('left');
    setIdx(next);
    announceIndex(next, notices.length);
  }

  function handleNext() {
    if (!canPage || idx >= notices.length - 1) return;
    const next = idx + 1;
    triggerPageSlide('right');
    setIdx(next);
    announceIndex(next, notices.length);
  }

  function handleGoto(i: number) {
    if (!canPage || i === idx) return;
    triggerPageSlide(i > idx ? 'right' : 'left');
    setIdx(i);
    announceIndex(i, notices.length);
  }

  // Animation classes
  const dur = prefersReducedMotion ? 'duration-[120ms]' : 'duration-[260ms]';
  const ease = visible ? 'ease-out' : 'ease-in';

  return {
    notices, idx, setIdx, visible, pageAnnouncement, isMobile, isDark, prefersReducedMotion,
    notice, canPage, isLastPage, language, t, dur, ease,
    touchStartX, touchStartY, dragLockRef, scrollTopAtTouchStart, isPageNavRef,
    stripRef, sheetRef, prevSlotRef, contentWrapperRef, nextSlotRef,
    announceIndex, handleDismiss, handleDismissAll, handleCTA, handleSecondaryCTA, animatedDismissAll,
    handlePrev, handleNext, handleGoto,
  };
}

type NoticeState = ReturnType<typeof useSystemNoticeModal>;

// Build the NoticeContent props for a given notice + pager slot index.
function makeContentProps(S: NoticeState, n: SystemNoticeDTO, slotIdx: number): ContentProps {
  const { t, isDark, canPage, notices, handleDismiss, handleDismissAll, handleCTA, handleSecondaryCTA, handlePrev, handleNext, handleGoto } = S;
  const rawBody = t(n.bodyKey);
  const body = n.bodyParams
    ? Object.entries(n.bodyParams).reduce(
        (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
        rawBody
      )
    : rawBody;
  return {
    notice: n,
    title: t(n.titleKey),
    body,
    ctaLabel: n.cta ? t(n.cta.labelKey) : null,
    secondaryCtaLabel: n.secondaryCta ? t(n.secondaryCta.labelKey) : null,
    titleId: `notice-title-${n.id}`,
    bodyId: `notice-body-${n.id}`,
    isDark,
    onDismiss: handleDismiss,
    onDismissAll: handleDismissAll,
    onCTA: handleCTA,
    onSecondaryCTA: handleSecondaryCTA,
    total: notices.length,
    currentPage: slotIdx,
    canPage,
    onPrev: handlePrev,
    onNext: handleNext,
    onGoto: handleGoto,
  };
}

function MobileNoticeSheet(S: NoticeState) {
  const {
    notice, idx, notices, visible, dur, ease, prefersReducedMotion, pageAnnouncement,
    language, canPage, setIdx, announceIndex, isPageNavRef, animatedDismissAll,
    touchStartX, touchStartY, dragLockRef, scrollTopAtTouchStart,
    stripRef, sheetRef, prevSlotRef, contentWrapperRef, nextSlotRef,
  } = S;
  if (!notice) return null;
  const titleId = `notice-title-${notice.id}`;
  const bodyId  = `notice-body-${notice.id}`;
  const mobileMotion = prefersReducedMotion
    ? (visible ? 'opacity-100' : 'opacity-0')
    : (visible ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-full');

  const prevNotice = notices[idx - 1] ?? null;
  const nextNotice = notices[idx + 1] ?? null;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      {/* Screen-reader page announcements */}
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{pageAnnouncement}</span>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity ${dur} ${ease} ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={notice.dismissible ? animatedDismissAll : undefined}
      />
      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className={`absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden h-[85dvh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl transition-[opacity,transform] ${dur} ${ease} ${mobileMotion}`}
        style={{ touchAction: 'pan-y' }}
        onTouchStart={e => {
          touchStartX.current = e.touches[0].clientX;
          touchStartY.current = e.touches[0].clientY;
          dragLockRef.current = null;
          scrollTopAtTouchStart.current = contentWrapperRef.current?.scrollTop ?? 0;
        }}
        onTouchMove={e => {
          if (prefersReducedMotion) return;
          const startX = touchStartX.current;
          const startY = touchStartY.current;
          if (startX === null || startY === null) return;
          const dx = e.touches[0].clientX - startX;
          const dy = e.touches[0].clientY - startY;
          // Classify gesture direction on first significant movement
          if (!dragLockRef.current) {
            if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
              dragLockRef.current = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
              // Reset adjacent slots to top before they slide into view.
              if (dragLockRef.current === 'h') {
                prevSlotRef.current?.scrollTo({ top: 0 });
                nextSlotRef.current?.scrollTo({ top: 0 });
              }
            }
            return;
          }
          if (dragLockRef.current === 'h') {
            const strip = stripRef.current;
            if (!strip) return;
            strip.style.transition = 'none';
            // Strip base = -33.333% (center slot visible); dx offsets from there
            strip.style.transform = `translateX(calc(-33.333% + ${dx}px))`;
          } else if (dragLockRef.current === 'v' && notice.dismissible) {
            // Only intercept downward drag for dismiss when the sheet is scrolled to the top.
            // If scrolled into content, let native pan-y scroll it back up.
            if (scrollTopAtTouchStart.current > 0) return;
            const sheet = sheetRef.current;
            if (!sheet || dy <= 0) return;
            sheet.style.transition = 'none';
            sheet.style.transform = `translateY(${dy}px)`;
          }
        }}
        onTouchEnd={e => {
          const startX = touchStartX.current;
          const startY = touchStartY.current;
          touchStartX.current = null;
          touchStartY.current = null;
          const lock = dragLockRef.current;
          dragLockRef.current = null;

          if (lock === 'h') {
            if (startX === null) return;
            const deltaX = e.changedTouches[0].clientX - startX;
            const strip = stripRef.current;
            if (!strip) return;

            const goNext = isRtlLanguage(language) ? deltaX > 50 : deltaX < -50;
            const goPrev = isRtlLanguage(language) ? deltaX < -50 : deltaX > 50;
            const canGoNext = canPage && idx < notices.length - 1;
            const canGoPrev = canPage && idx > 0;

            if ((goNext && canGoNext) || (goPrev && canGoPrev)) {
              // Animate strip to the adjacent slot (-66.666% = next, 0% = prev)
              strip.style.transition = 'transform 200ms ease-out';
              strip.style.transform = goNext ? 'translateX(-66.666%)' : 'translateX(0%)';
              strip.addEventListener('transitionend', function onDone() {
                strip.removeEventListener('transitionend', onDone);
                strip.style.transition = 'none';
                // Render new content into the center slot BEFORE moving the strip,
                // so the browser never paints old content at the center position.
                const newIdx = goNext ? idx + 1 : idx - 1;
                flushSync(() => {
                  isPageNavRef.current = true;
                  setIdx(newIdx);
                  announceIndex(newIdx, notices.length);
                });
                // Reset all slot scrolls so the new center starts at top.
                prevSlotRef.current?.scrollTo({ top: 0 });
                contentWrapperRef.current?.scrollTo({ top: 0 });
                nextSlotRef.current?.scrollTo({ top: 0 });
                strip.style.transform = 'translateX(-33.333%)';
              }, { once: true });
            } else {
              // Spring back to center
              strip.style.transition = 'transform 300ms cubic-bezier(0.34,1.56,0.64,1)';
              strip.style.transform = 'translateX(-33.333%)';
              strip.addEventListener('transitionend', function onSnap() {
                strip.removeEventListener('transitionend', onSnap);
                strip.style.transition = '';
                strip.style.transform = 'translateX(-33.333%)';
              }, { once: true });
            }
            return;
          }

          // Vertical drag — animated dismiss or spring back (only when at scroll top)
          if (lock === 'v' && startY !== null && scrollTopAtTouchStart.current === 0) {
            const deltaY = e.changedTouches[0].clientY - startY;
            const sheet = sheetRef.current;
            if (deltaY > 80 && notice.dismissible) {
              animatedDismissAll();
            } else if (sheet && deltaY > 0) {
              sheet.style.transition = 'transform 300ms cubic-bezier(0.34,1.56,0.64,1)';
              sheet.style.transform = 'translateY(0)';
              sheet.addEventListener('transitionend', function onSnap() {
                sheet.removeEventListener('transitionend', onSnap);
                sheet.style.transition = '';
                sheet.style.transform = '';
              }, { once: true });
            }
          }
        }}
      >
        {/* Drag handle — fixed, does not scroll */}
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-9 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>
        {/* Clip container — fills remaining sheet height, hides adjacent slots */}
        <div style={{ flex: '1 1 0', minHeight: 0, overflow: 'hidden', width: '100%' }}>
          {/* 3-slot strip: [prev][current][next] — starts at -33.333% to show current */}
          <div
            ref={stripRef}
            style={{ display: 'flex', width: '300%', height: '100%', alignItems: 'stretch', transform: 'translateX(-33.333%)' }}
          >
            <div ref={prevSlotRef} style={{ width: '33.333%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {prevNotice && <NoticeContent {...makeContentProps(S, prevNotice, idx - 1)} />}
            </div>
            <div ref={contentWrapperRef} style={{ width: '33.333%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <NoticeContent {...makeContentProps(S, notice, idx)} />
            </div>
            <div ref={nextSlotRef} style={{ width: '33.333%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {nextNotice && <NoticeContent {...makeContentProps(S, nextNotice, idx + 1)} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopNoticeModal(S: NoticeState) {
  const { notice, idx, visible, dur, ease, prefersReducedMotion, pageAnnouncement, isLastPage, handleDismissAll, contentWrapperRef } = S;
  if (!notice) return null;
  const titleId = `notice-title-${notice.id}`;
  const bodyId  = `notice-body-${notice.id}`;
  const maxWidth = notice.severity === 'critical' ? 'max-w-[680px]' : 'max-w-[620px]';
  const desktopMotion = prefersReducedMotion
    ? (visible ? 'opacity-100' : 'opacity-0')
    : (visible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97]');

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] transition-opacity ${dur} ${ease} ${visible ? 'opacity-100' : 'opacity-0'}`}
      role="presentation"
      onClick={notice.dismissible && isLastPage ? handleDismissAll : undefined}
    >
      {/* Screen-reader page announcements */}
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{pageAnnouncement}</span>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={bodyId}
          className={`w-full ${maxWidth} rounded-2xl overflow-hidden overflow-y-auto max-h-[90vh] shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all ${dur} ${ease} ${desktopMotion}`}
          onClick={e => e.stopPropagation()}
        >
          <div ref={contentWrapperRef}>
            <NoticeContent {...makeContentProps(S, notice, idx)} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModalRenderer({ notices }: Props) {
  const S = useSystemNoticeModal(notices);
  // No notice to show
  if (!S.notice) return null;
  return S.isMobile ? <MobileNoticeSheet {...S} /> : <DesktopNoticeModal {...S} />;
}
