import type { PaddleRegionSettings } from '@trek/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../../i18n';
import { paddleRegionRepo } from '../../../repo/paddleRegionRepo';
import { getApiErrorMessage } from '../../../types';
import { useToast } from '../../shared/Toast';

/**
 * PAD-11C in the admin area: how TREK loads the water data of a place a
 * paddler plans in, read once the card shows and saved on every change. A
 * change shows at once and goes back, with a toast, when the server refuses
 * it. While one is saved the controls rest, so two saves never cross.
 */
export function usePaddleAutoLoad(active: boolean, offline: boolean) {
  const { t } = useTranslation();
  const toast = useToast();
  const [settings, setSettings] = useState<PaddleRegionSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);

  useEffect(() => {
    if (!active || offline) return;
    let cancelled = false;
    paddleRegionRepo.settings().then(
      (loaded) => {
        if (!cancelled) setSettings(loaded);
      },
      (err: unknown) => {
        if (!cancelled) toast.error(getApiErrorMessage(err, t('common.error')));
      }
    );
    return () => {
      cancelled = true;
    };
  }, [active, offline, t, toast]);

  const save = useCallback(
    async (change: Partial<PaddleRegionSettings>) => {
      if (!settings || pending.current) return;
      const before = settings;
      const next = { ...settings, ...change };
      pending.current = true;
      setSaving(true);
      setSettings(next);
      try {
        setSettings(await paddleRegionRepo.saveSettings(next));
      } catch (err) {
        setSettings(before);
        toast.error(getApiErrorMessage(err, t('common.error')));
      } finally {
        pending.current = false;
        setSaving(false);
      }
    },
    [settings, t, toast]
  );

  return { settings, saving, save };
}
