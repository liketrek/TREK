import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Info, AlertTriangle, AlertOctagon, X, ChevronLeft, ChevronRight } from 'lucide-react';
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

interface Props {
  notices: SystemNoticeDTO[];
}

// Inner content shared between desktop and mobile layouts
interface ContentProps {
  notice: SystemNoticeDTO;
  title: string;
  body: string;
  ctaLabel: string | null;
  titleId: string;
  bodyId: string;
  isDark: boolean;
  onDismiss: () => void;
  onDismissAll: () => void;
  onCTA: () => void;
  // Pager
  total: number;
  currentPage: number;
  canPage: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoto: (i: number) => void;
}

function NoticeContent({ notice, title, body, ctaLabel, titleId, bodyId, isDark, onDismiss, onDismissAll, onCTA, total, currentPage, canPage, onPrev, onNext, onGoto }: ContentProps) {
  const { t } = useTranslation();
  const isLastPage = total <= 1 || currentPage === total - 1;

  const DefaultIcon = SEVERITY_ICONS[notice.severity] ?? Info;
  const LucideIcon: React.ElementType = notice.icon
    ? ((LucideIcons as Record<string, unknown>)[notice.icon] as React.ElementType) ?? DefaultIcon
    : DefaultIcon;

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
          <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-pink-500 to-indigo-500 px-8 py-5 text-center">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 80%, white 1px, transparent 1px)', backgroundSize: '60px 60px, 80px 80px, 40px 40px' }} />
            <div className="relative flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/10">
                <LucideIcon size={20} className="text-white" />
              </div>
              <div className="text-left">
                <h2 id={titleId} className="text-lg font-bold text-white leading-tight">{title}</h2>
                <p className="text-xs text-white/60 font-medium">TREK 3.0</p>
              </div>
            </div>
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

          {/* Highlights */}
          {notice.highlights && notice.highlights.length > 0 && (
            <ul className="mx-auto mb-4 space-y-2">
              {notice.highlights.map((h, i) => {
                const HIcon: React.ElementType | null = h.iconName
                  ? ((LucideIcons as Record<string, unknown>)[h.iconName] as React.ElementType) ?? null
                  : null;
                return (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    {HIcon
                      ? <HIcon size={16} className="text-blue-500 shrink-0" />
                      : <span className="text-blue-500 shrink-0">✓</span>
                    }
                    {t(h.labelKey)}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Sticky footer — pager + CTA, always anchored at the bottom of the slot */}
      <div
        className="sticky bottom-0 px-8 pt-4 flex flex-col gap-3"
        style={{
          background: 'var(--modal-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          borderTop: '1px solid var(--modal-border)',
        }}
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

        {/* CTA + dismiss link */}
        <div className="flex flex-col items-center gap-3">
          {ctaLabel && isLastPage ? (
            <button
              id={`notice-cta-${notice.id}`}
              onClick={onCTA}
              className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              {ctaLabel}
            </button>
          ) : (notice.dismissible || isLastPage) && (
            <button
              id={`notice-cta-${notice.id}`}
              onClick={isLastPage ? onDismissAll : onNext}
              className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              {t('common.ok')}
            </button>
          )}
          {notice.dismissible && isLastPage && ctaLabel && (
            <button
              onClick={onDismiss}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              Not now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ModalRenderer({ notices }: Props) {
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

  function handleCTA() {
    if (!notice) return;
    if (!notice.cta) {
      handleDismissAll();
      return;
    }
    if (notice.cta.kind === 'nav') {
      navigate(notice.cta.href);
      if (notice.dismissible !== false) handleDismissAll();
    } else {
      runNoticeAction(notice.cta.actionId, { navigate });
      const actionCta = notice.cta as { kind: 'action'; labelKey: string; actionId: string; dismissOnAction?: boolean };
      if (actionCta.dismissOnAction !== false) handleDismissAll();
    }
  }

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

  // No notice to show
  if (!notice) return null;

  // Pre-compute body with params interpolated
  const rawBody = t(notice.bodyKey);
  const body = notice.bodyParams
    ? Object.entries(notice.bodyParams).reduce(
        (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
        rawBody
      )
    : rawBody;

  const title = t(notice.titleKey);
  const ctaLabel = notice.cta ? t(notice.cta.labelKey) : null;

  const titleId = `notice-title-${notice.id}`;
  const bodyId  = `notice-body-${notice.id}`;

  // Animation classes
  const dur = prefersReducedMotion ? 'duration-[120ms]' : 'duration-[260ms]';
  const ease = visible ? 'ease-out' : 'ease-in';

  const contentProps: ContentProps = {
    notice, title, body, ctaLabel, titleId, bodyId, isDark,
    onDismiss: handleDismiss,
    onDismissAll: handleDismissAll,
    onCTA: handleCTA,
    total: notices.length,
    currentPage: idx,
    canPage,
    onPrev: handlePrev,
    onNext: handleNext,
    onGoto: handleGoto,
  };

  if (isMobile) {
    const mobileMotion = prefersReducedMotion
      ? (visible ? 'opacity-100' : 'opacity-0')
      : (visible ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-full');

    // Build ContentProps for an adjacent slot so NoticeContent renders correctly
    function buildSlotProps(n: SystemNoticeDTO, slotIdx: number): ContentProps {
      const slotRawBody = t(n.bodyKey);
      const slotBody = n.bodyParams
        ? Object.entries(n.bodyParams).reduce(
            (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
            slotRawBody
          )
        : slotRawBody;
      return {
        notice: n,
        title: t(n.titleKey),
        body: slotBody,
        ctaLabel: n.cta ? t(n.cta.labelKey) : null,
        titleId: `notice-title-${n.id}`,
        bodyId: `notice-body-${n.id}`,
        isDark,
        onDismiss: handleDismiss,
        onDismissAll: handleDismissAll,
        onCTA: handleCTA,
        total: notices.length,
        currentPage: slotIdx,
        canPage,
        onPrev: handlePrev,
        onNext: handleNext,
        onGoto: handleGoto,
      };
    }

    const prevNotice = notices[idx - 1] ?? null;
    const nextNotice = notices[idx + 1] ?? null;

    return (
      <div className="fixed inset-0 z-50" role="presentation">
        {/* Screen-reader page announcements */}
        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{pageAnnouncement}</span>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 transition-opacity ${dur} ${ease} ${visible ? 'opacity-100' : 'opacity-0'}`}
          style={{
            background: 'var(--modal-backdrop)',
            backdropFilter: 'blur(12px) saturate(150%)',
            WebkitBackdropFilter: 'blur(12px) saturate(150%)',
          }}
          onClick={notice.dismissible ? animatedDismissAll : undefined}
        />
        {/* Bottom sheet */}
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={bodyId}
          className={`absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden h-[85dvh] flex flex-col transition-[opacity,transform] ${dur} ${ease} ${mobileMotion}`}
          style={{
            background: 'var(--modal-bg)',
            backdropFilter: 'var(--glass-blur-lg)',
            WebkitBackdropFilter: 'var(--glass-blur-lg)',
            border: '1px solid var(--modal-border)',
            borderBottomWidth: 0,
            boxShadow: 'var(--glass-shadow-lg)',
          }}
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
                {prevNotice && <NoticeContent {...buildSlotProps(prevNotice, idx - 1)} />}
              </div>
              <div ref={contentWrapperRef} style={{ width: '33.333%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <NoticeContent {...contentProps} />
              </div>
              <div ref={nextSlotRef} style={{ width: '33.333%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {nextNotice && <NoticeContent {...buildSlotProps(nextNotice, idx + 1)} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop centered modal
  const maxWidth = notice.severity === 'critical' ? 'max-w-[680px]' : 'max-w-[620px]';
  const desktopMotion = prefersReducedMotion
    ? (visible ? 'opacity-100' : 'opacity-0')
    : (visible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97]');

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity ${dur} ${ease} ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{
        background: 'var(--modal-backdrop)',
        backdropFilter: 'blur(12px) saturate(150%)',
        WebkitBackdropFilter: 'blur(12px) saturate(150%)',
      }}
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
          className={`w-full ${maxWidth} rounded-2xl overflow-hidden overflow-y-auto max-h-[90vh] transition-all ${dur} ${ease} ${desktopMotion}`}
          style={{
            background: 'var(--modal-bg)',
            backdropFilter: 'var(--glass-blur-lg)',
            WebkitBackdropFilter: 'var(--glass-blur-lg)',
            border: '1px solid var(--modal-border)',
            boxShadow: 'var(--modal-shadow)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div ref={contentWrapperRef}>
            <NoticeContent {...contentProps} />
          </div>
        </div>
      </div>
    </div>
  );
}
