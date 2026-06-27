import { useEffect, useState } from 'react';
import { useSystemNoticeStore } from '../../store/systemNoticeStore.js';
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

export function SystemNoticeHost() {
  const { notices, loaded } = useSystemNoticeStore();
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

  // desktopOnly notices (e.g. the thank-you/support modal) are hidden on mobile.
  const visible = isMobile ? notices.filter(n => !n.desktopOnly) : notices;

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
