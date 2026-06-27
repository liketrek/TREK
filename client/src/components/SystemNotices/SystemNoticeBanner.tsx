import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, AlertTriangle, AlertOctagon, X } from 'lucide-react';
import { useSystemNoticeStore } from '../../store/systemNoticeStore.js';
import type { SystemNoticeDTO } from '../../store/systemNoticeStore.js';
import { useTranslation } from '../../i18n/index.js';
import { isRtlLanguage } from '../../i18n/index.js';
import { runNoticeAction } from './noticeActions.js';

const SEVERITY_ICONS: Record<string, React.ElementType> = {
  info: Info,
  warn: AlertTriangle,
  critical: AlertOctagon,
};

const SEVERITY = {
  info: {
    bg:       'bg-white dark:bg-slate-900',
    border:   'border-blue-500 dark:border-blue-400',
    text:     'text-slate-900 dark:text-slate-100',
    icon:     'text-blue-500 dark:text-blue-400',
    ariaLive: 'polite' as const,
    role:     'status' as const,
  },
  warn: {
    bg:       'bg-amber-50 dark:bg-amber-950',
    border:   'border-amber-500 dark:border-amber-400',
    text:     'text-amber-900 dark:text-amber-100',
    icon:     'text-amber-500 dark:text-amber-400',
    ariaLive: 'polite' as const,
    role:     'status' as const,
  },
  critical: {
    bg:       'bg-rose-50 dark:bg-rose-950',
    border:   'border-rose-600 dark:border-rose-400',
    text:     'text-rose-900 dark:text-rose-100',
    icon:     'text-rose-600 dark:text-rose-400',
    ariaLive: 'assertive' as const,
    role:     'alert' as const,
  },
} as const;

interface BannerItemProps {
  notice: SystemNoticeDTO;
  onDismiss: () => void;
  language: string;
}

function CTALink({
  notice,
  label,
  onDismiss,
}: {
  notice: SystemNoticeDTO;
  label: string;
  onDismiss: () => void;
}) {
  const navigate = useNavigate();

  function handleClick() {
    if (!notice.cta) return;
    if (notice.cta.kind === 'nav') {
      navigate(notice.cta.href);
      if (notice.dismissible) onDismiss();
    } else if (notice.cta.kind === 'link') {
      window.open(notice.cta.href, '_blank', 'noopener,noreferrer');
    } else {
      runNoticeAction(notice.cta.actionId, { navigate });
      if (notice.cta.dismissOnAction !== false) onDismiss();
    }
  }

  if (!notice.cta) return null;

  if (notice.cta.kind === 'nav' || notice.cta.kind === 'link') {
    return (
      <a
        href={notice.cta.href}
        onClick={e => { e.preventDefault(); handleClick(); }}
        className="underline hover:no-underline font-medium ml-3 shrink-0"
      >
        {label}
      </a>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="underline hover:no-underline font-medium ml-3 shrink-0"
    >
      {label}
    </button>
  );
}

function BannerItem({ notice, onDismiss, language }: BannerItemProps) {
  const { t } = useTranslation();
  const s = SEVERITY[notice.severity] ?? SEVERITY.info;
  const title = t(notice.titleKey);
  const body = t(notice.bodyKey);
  const ctaLabel = notice.cta ? t(notice.cta.labelKey) : null;

  // Tailwind 3.3+ supports border-s-4 (logical, RTL-aware)
  const accentBorder = 'border-s-4';

  return (
    <div
      role={s.role}
      aria-live={s.ariaLive}
      aria-atomic="true"
      className={`flex items-start gap-x-3 py-3 px-4 ${accentBorder} ${s.bg} ${s.border} ${s.text}`}
    >
      {React.createElement(
        (SEVERITY_ICONS[notice.severity] ?? Info) as React.ElementType,
        { size: 20, className: `shrink-0 mt-0.5 ${s.icon}` },
      )}
      <div className="flex-1 min-w-0">
        <span className="font-semibold">{title}</span>
        {body !== title && (
          <span className="ml-2 opacity-80">{body}</span>
        )}
        {ctaLabel && notice.cta && (
          <CTALink notice={notice} label={ctaLabel} onDismiss={onDismiss} />
        )}
      </div>
      {notice.dismissible && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-2 -mr-2 rounded hover:bg-black/5 dark:hover:bg-white/10 transition"
          aria-label={`Dismiss: ${title}`}
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
}

interface AnimatedBannerItemProps {
  notice: SystemNoticeDTO;
  onDismiss: () => void;
  language: string;
}

function AnimatedBannerItem({ notice, onDismiss, language }: AnimatedBannerItemProps) {
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false);

  useEffect(() => {
    if (typeof requestAnimationFrame !== 'undefined') {
      const id = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(id);
    }
    setMounted(true);
  }, []);

  const transition = prefersReducedMotion
    ? 'transition-opacity duration-[120ms]'
    : 'transition-all duration-200 ease-out';
  const state = mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2';

  return (
    <div className={`${transition} ${state}`}>
      <BannerItem notice={notice} onDismiss={onDismiss} language={language} />
    </div>
  );
}

interface BannerRendererProps {
  notices: SystemNoticeDTO[];
}

export function BannerRenderer({ notices }: BannerRendererProps) {
  const { dismiss } = useSystemNoticeStore();
  const { language } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  // Show at most 2 highest-priority banners
  const visible = notices.slice(0, 2);

  // Report banner stack height for layout reflow
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--banner-stack-h', el.offsetHeight + 'px');
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.setProperty('--banner-stack-h', '0px');
    };
  }, []);

  if (visible.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed left-0 right-0 z-40"
      style={{ top: 'var(--nav-h, 0px)' }}
    >
      {visible.map((notice, i) => (
        <React.Fragment key={notice.id}>
          {i > 0 && <div className="border-t border-black/10 dark:border-white/10" />}
          <AnimatedBannerItem
            notice={notice}
            onDismiss={() => dismiss(notice.id)}
            language={language}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

interface ToastRendererProps {
  notices: SystemNoticeDTO[];
}

export function ToastRenderer({ notices }: ToastRendererProps) {
  const { dismiss } = useSystemNoticeStore();
  const { t } = useTranslation();
  const firedRef = useRef(new Set<string>());

  useEffect(() => {
    for (const notice of notices) {
      if (firedRef.current.has(notice.id)) continue;
      firedRef.current.add(notice.id);

      // Critical should not be a toast — log and skip
      if (notice.severity === 'critical') {
        console.warn(
          `[systemNotices] notice "${notice.id}" is critical but display=toast. ` +
          'Should be banner or modal.'
        );
        dismiss(notice.id);
        continue;
      }

      const variantMap: Record<string, string> = { info: 'info', warn: 'warning' };
      const variant = variantMap[notice.severity] ?? 'info';
      const titleStr = t(notice.titleKey);
      const bodyStr = t(notice.bodyKey);
      const message = bodyStr !== titleStr ? `${titleStr}: ${bodyStr}` : titleStr;
      const duration = notice.severity === 'warn' ? 9000 : 6000;

      // Fire the toast, retrying on the next frame if __addToast isn't registered yet
      // (race between ToastContainer mounting and SystemNoticeHost mounting on cold load).
      const fireToast = (attempt = 0) => {
        if (typeof window.__addToast === 'function') {
          window.__addToast(message, variant as 'info' | 'success' | 'error' | 'warning', duration);
        } else if (attempt < 10) {
          requestAnimationFrame(() => fireToast(attempt + 1));
          return; // don't schedule dismiss until the toast actually fires
        } else {
          console.warn(`[systemNotices] toast "${notice.id}" dropped — __addToast never registered`);
        }
        setTimeout(() => dismiss(notice.id), duration + 500);
      };
      fireToast();
    }
  }, [notices]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
