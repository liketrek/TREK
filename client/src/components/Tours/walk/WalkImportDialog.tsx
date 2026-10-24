import type { WalkImportPreviewResponse, WalkImportStation } from '@trek/shared';
import { AlertTriangle, ExternalLink, Footprints, Link2, Loader2, MapPinOff, Route } from 'lucide-react';
import { useId, type FormEvent } from 'react';
import { useTranslation } from '../../../i18n';
import { EditorField, INPUT } from '../../shared/dialogParts';
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
} from '../../shared/DialogShell';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { TourNotice } from '../tourParts';
import type { WalkImport } from './useWalkImport';

/** One stop of the link, in its place in the order; a stop without a position says so instead of a position. */
function WalkImportStationRow({ station, number }: { station: WalkImportStation; number: number }) {
  const { t } = useTranslation();
  const position =
    station.lat !== null && station.lng !== null ? `${station.lat.toFixed(5)}, ${station.lng.toFixed(5)}` : null;
  const placed = position !== null;
  return (
    <li
      data-testid="walk-import-station"
      data-unresolved={placed ? undefined : 'true'}
      className={`flex items-start gap-2.5 rounded-[10px] px-2.5 py-2 ${placed ? 'bg-surface-card' : 'border border-dashed border-edge'}`}
    >
      <span
        className="mt-px grid h-5 w-5 flex-none place-items-center rounded-full bg-surface-secondary font-geist font-semibold text-content-muted"
        style={fs(10.5)}
      >
        {number}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={`break-words font-medium leading-snug ${placed ? 'text-content' : 'text-content-muted'}`}
          style={fs(12.5, 'body')}
        >
          {station.name ?? t('tours.walk.stationNumbered', { number })}
        </span>
        {placed ? (
          <span className="font-geist text-content-faint" style={fs(11)}>
            {position}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-warning" style={fs(11, 'body')}>
            <MapPinOff size={11} strokeWidth={2.2} className="flex-none" />
            {t('tours.walkImport.noPosition')}
          </span>
        )}
      </span>
    </li>
  );
}

/** The step that asks for the link. */
function WalkImportLinkStep({ walkImport }: { walkImport: WalkImport }) {
  const { t } = useTranslation();
  const inputId = useId();
  return (
    <EditorField
      label={t('tours.walkImport.urlLabel')}
      htmlFor={inputId}
      hint={t('tours.walkImport.urlHint')}
      error={walkImport.failure}
    >
      <input
        id={inputId}
        type="text"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        className={INPUT}
        value={walkImport.url}
        placeholder="https://maps.app.goo.gl/…"
        disabled={walkImport.phase === 'reading'}
        onChange={(event) => walkImport.setUrl(event.target.value)}
        data-testid="walk-import-url"
      />
    </EditorField>
  );
}

/** The step that shows what the link holds, before anything is loaded. */
function WalkImportPreviewStep({
  preview,
  unplaced,
  canLoad,
  hasUnsavedChanges,
}: {
  preview: WalkImportPreviewResponse;
  unplaced: number;
  canLoad: boolean;
  hasUnsavedChanges: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4" data-testid="walk-import-preview">
      <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-content-muted" style={fs(12, 'body')}>
        <Footprints size={13} strokeWidth={2} className="flex-none" />
        <span>{t('tours.walkImport.source')}</span>
        <a
          href={preview.resolved_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
          data-testid="walk-import-source"
        >
          {t('tours.walkImport.openSource')}
          <ExternalLink size={12} strokeWidth={2} className="flex-none" />
        </a>
      </p>
      <TourNotice icon={<Route size={13} strokeWidth={2} />}>{t('tours.walkImport.recalculated')}</TourNotice>
      <DialogSection label={t('tours.walkImport.stops')}>
        <ol className="m-0 flex list-none flex-col gap-1 p-0">
          {preview.stations.map((station, index) => (
            <WalkImportStationRow key={index} station={station} number={index + 1} />
          ))}
        </ol>
      </DialogSection>
      {unplaced > 0 && (
        <TourNotice tone="warning" icon={<MapPinOff size={13} strokeWidth={2} />}>
          {t('tours.walkImport.unresolved', { count: unplaced })}
        </TourNotice>
      )}
      {!canLoad && <TourNotice tone="warning">{t('tours.walkImport.tooFewPositions')}</TourNotice>}
      {hasUnsavedChanges && (
        <TourNotice tone="warning" icon={<AlertTriangle size={13} strokeWidth={2} />}>
          {t('tours.walkImport.replacesDraft')}
        </TourNotice>
      )}
    </div>
  );
}

/** The buttons of each step: read the link, or go back and load the walk. */
function WalkImportFooter({ walkImport }: { walkImport: WalkImport }) {
  const { t } = useTranslation();
  const reading = walkImport.phase === 'reading';
  return (
    <DialogFooter>
      <FooterSpacer />
      <DialogButton onClick={walkImport.close}>{t('common.cancel')}</DialogButton>
      {walkImport.preview ? (
        <>
          <DialogButton onClick={walkImport.back}>{t('tours.walkImport.back')}</DialogButton>
          <DialogButton
            variant="primary"
            icon={<Footprints size={14} strokeWidth={2} />}
            disabled={!walkImport.canLoad}
            onClick={walkImport.load}
            data-testid="walk-import-load"
          >
            {t('tours.walkImport.load')}
          </DialogButton>
        </>
      ) : (
        <DialogButton
          variant="primary"
          icon={
            reading ? (
              <Loader2 size={14} strokeWidth={2} className="animate-spin" />
            ) : (
              <Link2 size={14} strokeWidth={2} />
            )
          }
          disabled={!walkImport.canRead}
          onClick={() => void walkImport.read()}
          data-testid="walk-import-read"
        >
          {t('tours.walkImport.read')}
        </DialogButton>
      )}
    </DialogFooter>
  );
}

/**
 * CW-07: a city walk from a Google Maps walking route, opened from "Add tour".
 * First the link, then its stops in their order with the ones the link gives
 * no position marked, where the route came from, and that TREK plans the way
 * between them itself. Only the load button hands the walk to the planner.
 */
export function WalkImportDialog({
  walkImport,
  hasUnsavedChanges,
}: {
  walkImport: WalkImport;
  hasUnsavedChanges: boolean;
}) {
  const { t } = useTranslation();
  const titleId = useId();
  if (!walkImport.open) return null;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!walkImport.preview && walkImport.canRead) void walkImport.read();
  };
  const head = (
    <DialogHeader
      tile={
        <DialogTile>
          <Footprints size={20} strokeWidth={2} className="text-content" />
        </DialogTile>
      }
      tint={NEUTRAL_TINT}
      labelId={titleId}
      onClose={walkImport.close}
      title={t('tours.walkImport.title')}
      sub={t('tours.walkImport.intro')}
      subWraps
    />
  );
  return (
    <DialogShell
      onClose={walkImport.close}
      labelledBy={titleId}
      width="narrow"
      onSubmit={submit}
      header={head}
      footer={<WalkImportFooter walkImport={walkImport} />}
    >
      {walkImport.preview ? (
        <WalkImportPreviewStep
          preview={walkImport.preview}
          unplaced={walkImport.unplaced}
          canLoad={walkImport.canLoad}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      ) : (
        <WalkImportLinkStep walkImport={walkImport} />
      )}
    </DialogShell>
  );
}

/** CW-07: said in the planner while a walk read from Google Maps is not saved yet. */
export function WalkImportDraftNotice({ planner }: { planner: Pick<TourPlannerController, 'draftSource' | 'mode'> }) {
  const { t } = useTranslation();
  if (planner.draftSource !== 'google_maps' || planner.mode.type !== 'new-draft') return null;
  return (
    <TourNotice role="status" icon={<Footprints size={13} strokeWidth={2} />}>
      {t('tours.walkImport.draftNotice')}
    </TourNotice>
  );
}
