import { useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n';
import { useStudioStore } from '../../store/studioStore';
import { useToast } from '../shared/Toast';

/**
 * What the Studio says about a click it could not carry out. Today one thing:
 * the page already holds as many elements as a page can, so a sticker, a frame,
 * a paste or a duplicate was not added. Every path that refuses counts it in the
 * store, and this says it once per count rather than each path in its own words.
 */
export function StudioNotices() {
  const { t } = useTranslation();
  const toast = useToast();
  const refused = useStudioStore((s) => s.refusedFull);
  const seen = useRef(refused);
  useEffect(() => {
    if (refused === seen.current) return;
    seen.current = refused;
    toast.warning(t('journey.studio.pageFull'));
  }, [refused, toast, t]);
  return null;
}
