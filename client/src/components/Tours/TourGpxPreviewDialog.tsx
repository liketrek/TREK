import type { PaddleBoatType, PaddleWaterContext, PlannableTourType, TourGpxImportFields } from '@trek/shared';
import { AlertTriangle, FileDown, Info, Mountain, Waves } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { OFM_POSITRON } from '../../constants/mapDefaults';
import { useTileUrl } from '../../hooks/useTileUrl';
import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { formatDistance, formatElevation } from '../../utils/units';
import { MapViewAuto } from '../Map/MapViewAuto';
import { SoftPill } from '../Planner/planParts';
import { LABEL, Segmented } from '../shared/dialogParts';
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
import { TourNotice } from './tourParts';
import type { GpxPreviewFile, TourGpxImport } from './useTourGpxImport';

const BOATS: readonly PaddleBoatType[] = ['kayak', 'canoe', 'sup', 'other'];
const WATERS: readonly PaddleWaterContext[] = ['river', 'lake'];
const BADGE =
  'inline-flex flex-none items-center rounded-full bg-surface-secondary px-2 font-geist tabular-nums leading-[20px] text-content-secondary';

/** One track of the file as a row: its name, and what it measures as badges; a track the trip holds says so. */
function PreviewTrackRow({ name, track }: { name: string; track: GpxPreviewFile['tracks'][number] }) {
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
        <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(13, 'body')}>
          {track.name || name}
        </span>
        {track.duplicate && <SoftPill tone="warning">{t('tours.import.previewDuplicate')}</SoftPill>}
      </div>
      <div className="flex flex-wrap items-center gap-1.5" style={fs(11)}>
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
      </div>
    </li>
  );
}

/**
 * PAD-02: a GPX file shown before anything is stored. The whole course on a
 * map, every track with its measures, the tracks the trip already holds named
 * as skipped, and the type to import them as; a paddle import names its boat
 * and water, as a planned paddle tour does. Closing it stores nothing.
 */
export default function TourGpxPreviewDialog({ gpxImport }: { gpxImport: TourGpxImport }) {
  const { preview } = gpxImport;
  if (!preview) return null;
  return <PreviewDialog gpxImport={gpxImport} files={preview} />;
}

function PreviewDialog({ gpxImport, files }: { gpxImport: TourGpxImport; files: GpxPreviewFile[] }) {
  const { t } = useTranslation();
  const labelId = useId();
  const tileUrl = useTileUrl(OFM_POSITRON);
  const [type, setType] = useState<PlannableTourType>('hike');
  const [boat, setBoat] = useState<PaddleBoatType | null>(null);
  const [water, setWater] = useState<PaddleWaterContext | null>(null);

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
  const paddleIncomplete = type === 'kayak' && (boat === null || water === null);
  const canImport = fresh > 0 && !paddleIncomplete && !gpxImport.importing;
  const fields: TourGpxImportFields =
    type === 'kayak' && boat && water
      ? { tour_type: 'kayak', boat_type: boat, water_context: water }
      : { tour_type: 'hike' };
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
            <PreviewTrackRow key={`${file.name}-${index}`} name={file.name} track={track} />
          ))}
        </ul>
        {fresh === 0 && (
          <div className="mt-2">
            <TourNotice tone="warning" icon={<AlertTriangle size={13} strokeWidth={2} />}>
              {t('tours.import.previewAllDuplicates')}
            </TourNotice>
          </div>
        )}
      </DialogSection>

      <DialogSection label={t('tours.import.previewAs')}>
        <div className="flex flex-col gap-3">
          <Segmented<PlannableTourType>
            value={type}
            onChange={setType}
            label={t('tours.import.previewAs')}
            fill
            options={[
              { value: 'hike', label: t('tourTypes.hike'), icon: <Mountain size={13} strokeWidth={2} /> },
              { value: 'kayak', label: t('tourTypes.kayak'), icon: <Waves size={13} strokeWidth={2} /> },
            ]}
          />
          {type === 'kayak' && (
            <div data-testid="gpx-preview-paddle" className="grid grid-cols-1 gap-3 sm:grid-cols-[3fr_2fr]">
              <div className="min-w-0">
                <span className={LABEL}>{t('tours.paddle.boat')}</span>
                <Segmented<PaddleBoatType>
                  value={(boat ?? '') as PaddleBoatType}
                  onChange={setBoat}
                  label={t('tours.paddle.boat')}
                  fill
                  options={BOATS.map((value) => ({ value, label: t(`tours.paddle.boat.${value}`) }))}
                />
              </div>
              <div className="min-w-0">
                <span className={LABEL}>{t('tours.paddle.water')}</span>
                <Segmented<PaddleWaterContext>
                  value={(water ?? '') as PaddleWaterContext}
                  onChange={setWater}
                  label={t('tours.paddle.water')}
                  fill
                  options={WATERS.map((value) => ({ value, label: t(`tours.paddle.water.${value}`) }))}
                />
              </div>
            </div>
          )}
          {paddleIncomplete && (
            <TourNotice role="status" icon={<Info size={13} strokeWidth={2} />}>
              {t('tours.paddle.chooseBoatImport')}
            </TourNotice>
          )}
        </div>
      </DialogSection>
    </DialogShell>
  );
}
