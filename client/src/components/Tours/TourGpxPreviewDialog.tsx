import type { TourFileLeftOut, TourGpxImportFields } from '@trek/shared';
import { AlertTriangle, Ban, Clock, FileDown, Layers, MapPin, Shapes } from 'lucide-react';
import { useId, useMemo } from 'react';
import { OFM_POSITRON } from '../../constants/mapDefaults';
import { useTileUrl } from '../../hooks/useTileUrl';
import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { formatDistance, formatElevation } from '../../utils/units';
import { MapViewAuto } from '../Map/MapViewAuto';
import { SoftPill } from '../Planner/planParts';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogShell,
  DialogTile,
  FooterSpacer,
  fs,
  NEUTRAL_TINT,
} from '../shared/DialogShell';
import { recordedDay, recordedMinutes } from './activity/tourActivityModel';
import { importFields, importMissing, useGpxImportChoices } from './gpxImportChoices';
import { GpxImportTypeSection } from './GpxImportTypeSection';
import { InfoDot, TourNotice } from './tourParts';
import { formatPlannedTourDuration } from './tourPresentation';
import type { GpxPreviewFile, TourGpxImport } from './useTourGpxImport';

const BADGE =
  'inline-flex flex-none items-center rounded-full bg-surface-secondary px-2 font-geist tabular-nums leading-[20px] text-content-secondary';

/** ACT-01: when a track was recorded and how long it took, where every point carried a time. */
function RecordedBadge({ track }: { track: GpxPreviewFile['tracks'][number] }) {
  const { locale } = useTranslation();
  const minutes = recordedMinutes(track.started_at, track.ended_at);
  const day = recordedDay(track.started_at, locale);
  if (minutes === null || !day) return null;
  return (
    <span className={`${BADGE} gap-1`} data-testid="gpx-preview-recorded">
      <Clock size={10} strokeWidth={2.2} className="flex-none text-content-faint" />
      {day}
      <span className="text-content-faint">{formatPlannedTourDuration(minutes)}</span>
    </span>
  );
}

/**
 * One track of the file as a row: its number, its name, and what it measures
 * as badges; a track the trip holds says so. The number keeps the lines of a
 * file apart, they are imported one tour each and never joined.
 */
function PreviewTrackRow({
  name,
  number,
  track,
}: {
  name: string;
  number: number;
  track: GpxPreviewFile['tracks'][number];
}) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const heights = track.elevation_gain_m != null && track.elevation_loss_m != null;
  return (
    <li
      data-testid="gpx-preview-track"
      data-duplicate={track.duplicate || undefined}
      className={`flex min-w-0 flex-col gap-1.5 rounded-[12px] border border-edge-faint bg-surface-card px-3 py-2.5 ${track.duplicate ? 'opacity-60' : ''}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden="true"
          className="grid h-6 w-6 flex-none place-items-center rounded-full bg-edge font-geist font-semibold tabular-nums text-content ring-2 ring-surface-card"
          style={fs(11)}
        >
          {number}
        </span>
        <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(13, 'body')}>
          {track.name || name}
        </span>
        {track.duplicate && <SoftPill tone="warning">{t('tours.import.previewDuplicate')}</SoftPill>}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 ps-8" style={fs(11)}>
        <span className={BADGE}>{formatDistance(track.distance_km, unit)}</span>
        {heights ? (
          <>
            <span className={BADGE}>↑ {formatElevation(track.elevation_gain_m ?? 0, unit)}</span>
            <span className={BADGE}>↓ {formatElevation(track.elevation_loss_m ?? 0, unit)}</span>
          </>
        ) : (
          <span className={BADGE}>{t('tours.import.previewNoHeights')}</span>
        )}
        <span className={BADGE}>{t('tours.import.previewPoints', { count: track.point_count })}</span>
        <RecordedBadge track={track} />
      </div>
    </li>
  );
}

/** What all the files held besides their lines, summed by kind; null when they held nothing else. */
function leftOutOf(files: readonly GpxPreviewFile[]): TourFileLeftOut | null {
  const sum = { points: 0, areas: 0, other: 0 };
  for (const { leftOut } of files) {
    if (!leftOut) continue;
    sum.points += leftOut.points;
    sum.areas += leftOut.areas;
    sum.other += leftOut.other;
  }
  return sum.points + sum.areas + sum.other > 0 ? sum : null;
}

/**
 * IO-02: what a KML or KMZ file held besides its lines, named before the
 * import so nothing goes missing unseen: a dashed card with each kind as a
 * counted badge, and why in the info dot.
 */
function PreviewLeftOut({ files }: { files: readonly GpxPreviewFile[] }) {
  const { t } = useTranslation();
  const leftOut = leftOutOf(files);
  if (!leftOut) return null;
  const kinds = [
    { key: 'points', count: leftOut.points, icon: MapPin, labelKey: 'tours.import.leftOutPoints' },
    { key: 'areas', count: leftOut.areas, icon: Shapes, labelKey: 'tours.import.leftOutAreas' },
    { key: 'other', count: leftOut.other, icon: Layers, labelKey: 'tours.import.leftOutOther' },
  ].filter(({ count }) => count > 0);
  return (
    <div
      data-testid="gpx-preview-left-out"
      className="mt-2 flex flex-wrap items-center gap-1.5 rounded-[10px] border border-dashed border-edge px-3 py-2"
    >
      <Ban size={13} strokeWidth={2} className="flex-none text-content-faint" aria-hidden="true" />
      <span className="me-0.5 font-semibold text-content-muted" style={fs(12, 'body')}>
        {t('tours.import.previewLeftOut')}
      </span>
      {kinds.map(({ key, count, icon: Icon, labelKey }) => (
        <SoftPill key={key} icon={<Icon size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}>
          {t(labelKey, { count })}
        </SoftPill>
      ))}
      <span className="ms-auto">
        <InfoDot label={t('tours.import.previewLeftOut')} description={t('tours.import.previewLeftOutHint')} />
      </span>
    </div>
  );
}

/**
 * PAD-02: a GPX file shown before anything is stored. The whole course on a
 * map, every track with its measures, the tracks the trip already holds named
 * as skipped, and the type to import them as; a paddle import names its boat
 * and water, as a planned paddle tour does, a ski import its discipline
 * (SKI-02); a ride (HOR-02) says before anything is stored that its line stays
 * as recorded, gets no riding time and is not checked for access. Closing it
 * stores nothing. `initial` presets the type, as a recording imported for a
 * tour takes that tour's (ACT-01); left out, it is a hike. A KML or KMZ file
 * is shown the same way, with what it holds besides (IO-02).
 */
export default function TourGpxPreviewDialog({
  gpxImport,
  initial,
}: {
  gpxImport: TourGpxImport;
  initial?: TourGpxImportFields;
}) {
  const { preview } = gpxImport;
  if (!preview) return null;
  return <PreviewDialog gpxImport={gpxImport} files={preview} initial={initial ?? HIKE} />;
}

const HIKE: TourGpxImportFields = { tour_type: 'hike' };

function PreviewDialog({
  gpxImport,
  files,
  initial,
}: {
  gpxImport: TourGpxImport;
  files: GpxPreviewFile[];
  initial: TourGpxImportFields;
}) {
  const { t } = useTranslation();
  const labelId = useId();
  const tileUrl = useTileUrl(OFM_POSITRON);
  const choices = useGpxImportChoices(initial);

  const tracks = files.flatMap((file) => file.tracks.map((track) => ({ file: file.file, track })));
  const fresh = tracks.filter(({ track }) => !track.duplicate).length;
  const lines = useMemo(
    () =>
      files.flatMap((file) =>
        file.tracks.map((track) => track.geometry.map(([lat, lng]): [number, number] => [lat, lng]))
      ),
    [files]
  );
  const focusPoints = useMemo(() => lines.flat(), [lines]);
  const canImport = fresh > 0 && importMissing(choices.chosen) === null && !gpxImport.importing;
  const fields = importFields(choices.chosen);
  const title = files.length === 1 ? files[0].file.name : t('tours.import.previewFiles', { count: files.length });

  return (
    <DialogShell
      onClose={gpxImport.cancel}
      labelledBy={labelId}
      width="editor"
      blocked={gpxImport.importing}
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <FileDown size={20} strokeWidth={2} className="text-content" />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={gpxImport.cancel}
          eyebrow={t('tours.import.previewTitle')}
          title={title}
          sub={t('tours.import.previewHint')}
          subWraps
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={gpxImport.cancel} disabled={gpxImport.importing}>
            {t('common.cancel')}
          </DialogButton>
          <DialogButton
            variant="primary"
            data-testid="gpx-preview-import"
            icon={<FileDown size={14} strokeWidth={2} />}
            disabled={!canImport}
            onClick={() => void gpxImport.confirm(fields)}
          >
            {t('tours.import.previewConfirm', { count: fresh })}
          </DialogButton>
        </DialogFooter>
      }
    >
      <div
        data-testid="gpx-preview-map"
        className="relative h-[280px] flex-none overflow-hidden rounded-[14px] border border-edge-faint"
      >
        <MapViewAuto
          places={[]}
          route={lines}
          tileUrl={tileUrl}
          focusPoints={focusPoints}
          focusKey={files.map(({ file }) => file.name).join('|')}
          followSelection={false}
        />
      </div>

      <DialogSection label={t('tours.import.previewTracks', { count: tracks.length })}>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {tracks.map(({ file, track }, index) => (
            <PreviewTrackRow key={`${file.name}-${index}`} name={file.name} number={index + 1} track={track} />
          ))}
        </ul>
        <PreviewLeftOut files={files} />
        {fresh === 0 && (
          <div className="mt-2">
            <TourNotice tone="warning" icon={<AlertTriangle size={13} strokeWidth={2} />}>
              {t('tours.import.previewAllDuplicates')}
            </TourNotice>
          </div>
        )}
      </DialogSection>

      <GpxImportTypeSection choices={choices} />
    </DialogShell>
  );
}
