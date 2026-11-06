import { ChevronRight, MapPinned } from 'lucide-react';
import type { DayRouteTarget } from '../../../../components/Planner/dayRouteApps';
import type { TranslationFn } from '../../../../types';
import MSheet from '../../../components/MSheet';
import { TileHeader } from '../sheets/MTripSheetUi'

/** Opens a target: a web link in a new tab (the app takes it over), geo: in place. */
export function openRouteTarget(target: DayRouteTarget): void {
  if (target.url.startsWith('geo:')) window.location.assign(target.url);
  else window.open(target.url, '_blank', 'noopener,noreferrer');
}

/**
 * The plan's one Maps button, asked: which app should get the day. A docked
 * sheet of the apps this device can open, each a full-width row; the ones that
 * take a single place say they only get the first stop.
 */
export default function MRouteAppsSheet({
  open,
  onClose,
  targets,
  t,
}: {
  open: boolean;
  onClose: () => void;
  targets: DayRouteTarget[];
  t: TranslationFn;
}) {
  return (
    <MSheet open={open} onClose={onClose} variant="bottom" ariaLabel={t('mobileTrip.openRouteIn')}>
      <div className="px-[18px] pb-4 pt-4">
        <div className="mb-3">
          <TileHeader
            icon={<MapPinned size={19} strokeWidth={1.8} />}
            title={t('mobileTrip.openRouteIn')}
            onClose={onClose}
            closeLabel={t('common.close')}
          />
        </div>
        <div className="flex flex-col gap-2">
          {targets.map((target) => (
            <button
              key={target.id}
              type="button"
              onClick={() => {
                openRouteTarget(target);
                onClose();
              }}
              className="flex items-center gap-3 rounded-[18px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-4 py-3 text-start transition-transform active:scale-[.98]"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[length:calc(15px*var(--fs-scale-body,1))] font-bold text-m-ink">
                  {target.labelKey ? t(target.labelKey) : target.label}
                </span>
                {target.firstStopOnly && (
                  <span className="mt-0.5 block font-geist text-[length:calc(11px*var(--fs-scale-body,1))] text-m-muted">
                    {t('mobileTrip.firstStopOnly')}
                  </span>
                )}
              </span>
              <ChevronRight size={17} strokeWidth={2} className="flex-none text-m-faint" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </MSheet>
  );
}
