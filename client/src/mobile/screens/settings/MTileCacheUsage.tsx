import { Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../../i18n';
import { reportNativeFailure } from '../../../native/reportFailure';
import { tileCacheActive } from '../../../native/tileCache';
import { TrekShell } from '../../../native/trekShell';
import { formatBytes } from '../../../utils/formatBytes';
import { MSetButton, MSetRow } from './MSettingsUi';

/**
 * How much room the iOS app's map tile store takes (native/tileCache.ts), with
 * a way to empty it. The store keeps itself under its limit and drops tiles
 * older than 30 days on its own; this is for seeing it and taking the room back
 * by hand. Renders nothing outside a binary that has the store.
 */
export default function MTileCacheUsage() {
  const { t } = useTranslation();
  const active = tileCacheActive();
  const [usage, setUsage] = useState<{ bytes: number; limit: number } | null>(null);
  const [clearing, setClearing] = useState(false);

  const refresh = useCallback(() => {
    TrekShell.getTileCacheUsage().then(setUsage, reportNativeFailure);
  }, []);

  useEffect(() => {
    if (active) refresh();
  }, [active, refresh]);

  if (!active || !usage) return null;

  const clear = async () => {
    setClearing(true);
    try {
      await TrekShell.clearTileCache();
    } catch (err) {
      reportNativeFailure(err);
    }
    setClearing(false);
    refresh();
  };

  return (
    <MSetRow
      label={t('settings.offline.tileStore.title')}
      sub={t('settings.offline.tileStore.usage', { used: formatBytes(usage.bytes), limit: formatBytes(usage.limit) })}
      trailing={
        <MSetButton variant="ghost" disabled={clearing || usage.bytes === 0} onClick={() => void clear()}>
          <Trash2 size={14} />
          {t('settings.offline.tileStore.clear')}
        </MSetButton>
      }
    />
  );
}
