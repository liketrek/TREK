import { Download, Loader2, Share } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { BarButton } from '../Planner/planParts';
import { DialogButton } from '../shared/DialogShell';
import { Tooltip } from '../shared/Tooltip';
import { useTourGpxExport, type TourGpxExportTarget } from './useTourGpxExport';

/**
 * PR1-06A, IO-01 in a footer: the saved tour as a GPX file, its own action
 * beside the navigation, which only leads to the start. "GPX" says the format,
 * the tooltip what the file holds. The share button beside it hands the same
 * file to the system's share sheet where the platform takes GPX files, and a
 * short text about the tour where it does not.
 */
export function TourGpxExportButton({ target }: { target: TourGpxExportTarget }) {
  const { t } = useTranslation();
  const { exportGpx, shareGpx, sharesFile, exporting } = useTourGpxExport(target);
  const shareLabel = t(sharesFile ? 'tours.gpxExport.share' : 'tours.gpxExport.shareTour');
  return (
    <>
      <Tooltip label={t('tours.gpxExport.hint')}>
        <span className="inline-flex">
          <DialogButton
            onClick={() => void exportGpx(target)}
            disabled={exporting}
            aria-label={t('tours.gpxExport.action')}
            data-testid="tour-gpx-export"
            icon={exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} strokeWidth={2} />}
          >
            <span className="max-sm:hidden">GPX</span>
          </DialogButton>
        </span>
      </Tooltip>
      <Tooltip label={shareLabel}>
        <span className="inline-flex">
          <DialogButton
            onClick={() => void shareGpx(target)}
            disabled={exporting}
            aria-label={shareLabel}
            data-testid="tour-gpx-share"
            icon={<Share size={14} strokeWidth={2} />}
          >
            <span className="max-sm:hidden">{t('tours.gpxExport.shareShort')}</span>
          </DialogButton>
        </span>
      </Tooltip>
    </>
  );
}

/**
 * The same export in the planner's head. While the tour has unsaved changes
 * the file would not hold them, so the buttons wait for the save and say so.
 */
export function TourGpxExportBarButton({ target, unsaved }: { target: TourGpxExportTarget; unsaved: boolean }) {
  const { t } = useTranslation();
  const { exportGpx, shareGpx, sharesFile, exporting } = useTourGpxExport(unsaved ? null : target);
  const shareLabel = sharesFile
    ? t(unsaved ? 'tours.gpxExport.shareSaveFirst' : 'tours.gpxExport.share')
    : t(unsaved ? 'tours.gpxExport.shareTourSaveFirst' : 'tours.gpxExport.shareTour');
  return (
    <>
      <BarButton
        label={t(unsaved ? 'tours.gpxExport.saveFirst' : 'tours.gpxExport.action')}
        onClick={() => void exportGpx(target)}
        disabled={unsaved || exporting}
      >
        {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} strokeWidth={2} />}
      </BarButton>
      <BarButton label={shareLabel} onClick={() => void shareGpx(target)} disabled={unsaved || exporting}>
        <Share size={15} strokeWidth={2} />
      </BarButton>
    </>
  );
}
