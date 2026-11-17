import type { TourTypeKey } from '@trek/shared';
import { MapPinned } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useTranslation } from '../../i18n';
import { DialogButton } from '../shared/DialogShell';
import { NavigationMenu } from '../shared/NavigationMenu';
import { Tooltip } from '../shared/Tooltip';
import { tourRouteTargets } from './tourRouteApps';

/**
 * The tour's whole route, not only the way to its start, in the map apps that
 * follow one (#2812). Nothing when no app can take the tour.
 */
export function TourRouteAppsButton({
  type,
  line,
  name,
}: {
  type: TourTypeKey;
  line: ReadonlyArray<readonly [number, number]> | undefined;
  name: string;
}) {
  const { t } = useTranslation();
  const targets = useMemo(() => (line ? tourRouteTargets(type, line, name) : []), [type, line, name]);
  const [open, setOpen] = useState(false);
  // State, not a ref: the menu reads its anchor while rendering.
  const [anchor, setAnchor] = useState<HTMLSpanElement | null>(null);
  if (targets.length === 0) return null;
  return (
    <>
      <Tooltip label={t('tours.detail.openRoute')}>
        <span ref={setAnchor} className="inline-flex">
          <DialogButton
            onClick={() => setOpen((o) => !o)}
            aria-label={t('tours.detail.openRoute')}
            aria-haspopup="menu"
            aria-expanded={open}
            data-testid="tour-route-apps"
            icon={<MapPinned size={14} strokeWidth={2} />}
          >
            <span className="max-sm:hidden">{t('tours.detail.mapsShort')}</span>
          </DialogButton>
        </span>
      </Tooltip>
      {open && <NavigationMenu targets={targets} anchor={anchor} onClose={() => setOpen(false)} />}
    </>
  );
}
