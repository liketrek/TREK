import { Ban, FileDown, Loader2 } from 'lucide-react';
import { useRef, useState, type DragEvent, type ReactNode } from 'react';
import { useTranslation } from '../../i18n';
import { fs } from '../shared/DialogShell';
import TourGpxPreviewDialog from './TourGpxPreviewDialog';
import type { TourGpxImport } from './useTourGpxImport';

/** Only a drag of files from the desktop; a waypoint or a tour row being dragged is not one. */
const carriesFiles = (event: DragEvent) => Array.from(event.dataTransfer.types).includes('Files');

/**
 * The tours workspace as a drop target for GPX files: a file dragged over it
 * dims the workspace and says what will happen, and a drop hands the files to
 * the same import the button runs. While an import runs, the overlay stays and
 * says so. A drag of anything else (a waypoint in the list, the map) passes
 * straight through.
 */
export default function TourGpxDropZone({
  gpxImport,
  canEdit,
  className = 'relative',
  children,
}: {
  gpxImport: TourGpxImport;
  canEdit: boolean;
  /** Positions the zone; it must be positioned for the overlay to cover it. */
  className?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const [over, setOver] = useState(false);
  // dragenter and dragleave fire for every child the pointer crosses, so the
  // overlay goes only when the count of entered elements is back at zero.
  const depth = useRef(0);

  const reset = () => {
    depth.current = 0;
    setOver(false);
  };

  return (
    <div
      className={className}
      onDragEnter={(event) => {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        depth.current += 1;
        setOver(true);
      }}
      onDragOver={(event) => {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = canEdit && !gpxImport.importing ? 'copy' : 'none';
      }}
      onDragLeave={(event) => {
        if (!carriesFiles(event)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      }}
      onDrop={(event) => {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        reset();
        if (canEdit) void gpxImport.importFiles(Array.from(event.dataTransfer.files));
      }}
    >
      {children}
      <TourGpxPreviewDialog gpxImport={gpxImport} />
      {(over || gpxImport.importing) && (
        <div
          data-testid="tour-gpx-drop"
          role="status"
          className="pointer-events-none absolute inset-2.5 z-30 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-accent backdrop-blur-[2px]"
          style={{ background: 'color-mix(in srgb, var(--bg-card) 82%, transparent)' }}
        >
          <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-surface-card text-content shadow-sm">
            {gpxImport.importing ? (
              <Loader2 size={22} strokeWidth={1.9} className="animate-spin" />
            ) : canEdit ? (
              <FileDown size={22} strokeWidth={1.9} />
            ) : (
              <Ban size={22} strokeWidth={1.9} />
            )}
          </span>
          <span className="font-semibold text-content" style={fs(14, 'body')}>
            {gpxImport.importing
              ? t('tours.import.importing')
              : canEdit
                ? t('tours.import.drop')
                : t('tours.import.dropNoPermission')}
          </span>
          {!gpxImport.importing && canEdit && (
            <span className="max-w-[320px] text-center text-content-muted" style={fs(12, 'body')}>
              {t('tours.import.dropHint')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
