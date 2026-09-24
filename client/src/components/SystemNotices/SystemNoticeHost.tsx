import { useEffect, useState } from 'react';
import { useSystemNoticeStore, type SystemNoticeDTO } from '../../store/systemNoticeStore.js';
import { useTranslation } from '../../i18n/index.js';
import { ModalRenderer } from './SystemNoticeModal.js';
import { BannerRenderer, ToastRenderer } from './SystemNoticeBanner.js';

// Mobile breakpoint matches the modal sheet's (max-width: 639px).
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && (window.matchMedia?.('(max-width: 639px)')?.matches ?? false)
  );
  useEffect(() => {
    const mq = window.matchMedia?.('(max-width: 639px)');
    if (!mq) return;
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

/**
 * A key by its shape: dotted, no spaces, `system_notice.release_notes.headline`.
 *
 * A notice may carry literal copy instead of a key — an instance's own announcement is
 * written out, not translated — and `t()` hands any string it does not know straight back,
 * so the test below cannot tell "no translation" from "this IS the text" on its own. The
 * shape can: a sentence has spaces and no dots between words.
 */
const KEY_SHAPE = /^[a-z0-9_-]+(\.[a-z0-9_-]+)+$/i;

/**
 * Whether a notice has words to show, rather than the names of strings this build lacks.
 *
 * The keys come from the server's registry, the copy from the bundle in the browser, and a
 * deploy parts the two for as long as it takes the page to reload: the service worker keeps
 * serving the old app while `/api/config` already reports the new version, and the release
 * notice for that very version arrives naming keys the old bundle never had. What is drawn
 * is then `system_notice.release_notes.headline` where the headline belongs, on the one
 * notice whose whole job is to be read once per release. Worse, a dismissal in that window
 * is a real one: it is `per-version`, so whoever closes the gibberish never sees the notes.
 *
 * So a notice made only of unresolved keys waits. Nothing is spent by waiting — a notice is
 * used up by `POST /dismiss` and by nothing else — and `App.tsx` reloads the page as soon
 * as the new worker takes over, after which this returns true and the modal opens for real.
 *
 * Deliberately generous: one resolved key is enough. Half a translation is still readable,
 * and a notice hidden by mistake is a worse failure than an ugly one.
 *
 * A bundle older than this filter cannot run it, so the server holds the release notice
 * back until the store announces the layout (see systemNoticeStore.fetch). This filter is
 * for the bundles after that one: they announce the layout but may still lack the copy.
 */
function hasCopy(notice: SystemNoticeDTO, t: (key: string) => string): boolean {
  const keys = notice.release
    ? [notice.release.headlineKey, notice.release.introKey, notice.release.note.titleKey]
    : [notice.titleKey, notice.bodyKey];
  return keys.some(key => !KEY_SHAPE.test(key) || t(key) !== key);
}

export function SystemNoticeHost() {
  const { notices, loaded } = useSystemNoticeStore();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // Notices are fetched by authStore after login (see App.tsx / authStore modification).
  // Cold-session fetch (page reload with valid session) is triggered here:
  useEffect(() => {
    // Only fetch if not already loaded (authStore may have already triggered)
    if (!loaded) {
      useSystemNoticeStore.getState().fetch();
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) return null;

  // desktopOnly notices (e.g. the thank-you/support modal) are hidden on mobile, and a
  // notice whose copy this build does not have yet waits for the reload (see hasCopy).
  const readable = notices.filter(n => hasCopy(n, t));
  const visible = isMobile ? readable.filter(n => !n.desktopOnly) : readable;

  const modals  = visible.filter(n => n.display === 'modal');
  const banners = visible.filter(n => n.display === 'banner');
  const toasts  = visible.filter(n => n.display === 'toast');

  return (
    <>
      <BannerRenderer notices={banners} />
      <ModalRenderer  notices={modals}  />
      <ToastRenderer  notices={toasts}  />
    </>
  );
}
