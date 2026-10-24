import type { WandererSourceHintItem, WandererWatch } from '@trek/shared';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from '../../i18n';
import { wandererRepo } from '../../repo/wandererRepo';
import { useToast } from '../shared/Toast';
import { hintWhen } from '../Tours/wanderer/hintWhen';

type Translate = (key: string, params?: Record<string, unknown>) => string;

/** What the watch last did, as one pill: refused, waiting after errors, last looked, or not yet. */
interface WandererWatchStatus {
  tone: 'neutral' | 'warning' | 'danger';
  text: string;
  /** Why, for the tooltip; null where the text says it all. */
  why: string | null;
}

/** The pill for a switched-on watch; null while it is off, since then nothing runs to report on. */
export function watchStatusOf(
  watch: WandererWatch | null,
  t: Translate,
  locale: string,
  now = Date.now()
): WandererWatchStatus | null {
  if (!watch?.enabled) return null;
  if (watch.blocked) return { tone: 'danger', text: t('wanderer.watch.blocked'), why: t('wanderer.watch.blockedHint') };
  const pausedUntil = watch.pausedUntil ? new Date(watch.pausedUntil).getTime() : Number.NaN;
  if (pausedUntil > now) {
    return {
      tone: 'warning',
      text: t('wanderer.watch.paused', { time: hintWhen(watch.pausedUntil, locale) }),
      why: t('wanderer.watch.pausedHint'),
    };
  }
  const lastRun = hintWhen(watch.lastRunAt, locale);
  return {
    tone: 'neutral',
    text: lastRun ? t('wanderer.watch.lastRun', { date: lastRun }) : t('wanderer.watch.neverRun'),
    why: null,
  };
}

/**
 * WAN-02: the background watch in the wanderer card. It loads with the card
 * and again whenever `refreshKey` changes, which the connection card bumps on
 * connecting, disconnecting, saving a token and a stored test result, so a
 * refused token clears once it is fixed. It switches on and off at
 * once (there is nothing to save with the form), and opens the tour a hint is
 * about. Online-only like the rest of the connection: the watch runs on the
 * server and its hints are read from there.
 */
export function useWandererWatch(refreshKey: string) {
  const { t, locale } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const [watch, setWatch] = useState<WandererWatch | null>(null);
  const [saving, setSaving] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    wandererRepo.getWatch().then(
      (next) => {
        if (!cancelled) setWatch(next);
      },
      () => {
        // The card above already says when the connection cannot be read; without
        // an answer the switch simply stays dimmed.
        if (!cancelled) setWatch(null);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const toggle = useCallback(async () => {
    if (!watch?.connected || saving) return;
    setSaving(true);
    try {
      const next = await wandererRepo.setWatch(!watch.enabled);
      setWatch(next);
      toast.success(next.enabled ? t('wanderer.watch.on') : t('wanderer.watch.off'));
    } catch {
      toast.error(t('wanderer.watch.failed'));
    } finally {
      setSaving(false);
    }
  }, [saving, t, toast, watch]);

  const openTour = useCallback(
    (hint: WandererSourceHintItem) => {
      setHintsOpen(false);
      void navigate(`/trips/${hint.tripId}?tab=plan&place=${hint.placeId}`);
    },
    [navigate]
  );

  return {
    /** The switch can act: the server knows a connection to watch with. */
    available: !!watch?.connected,
    enabled: !!watch?.enabled,
    saving,
    status: watchStatusOf(watch, t, locale),
    hints: watch?.hints ?? [],
    hintsOpen,
    openHints: useCallback(() => setHintsOpen(true), []),
    closeHints: useCallback(() => setHintsOpen(false), []),
    openTour,
    toggle,
  };
}

export type WandererWatchController = ReturnType<typeof useWandererWatch>;
