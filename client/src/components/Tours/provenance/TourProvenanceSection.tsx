import type { TourListItem, TourProvenance, TourSourceCheckResponse } from '@trek/shared';
import { Download, ExternalLink, FileDown, Loader2, PenLine, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import { formatDate } from '../../../utils/formatters';
import { BOX } from '../../Planner/bookings/bookingParts';
import { SoftPill } from '../../Planner/planParts';
import ConfirmDialog from '../../shared/ConfirmDialog';
import { DialogSection, fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { CardAction, InfoDot } from '../tourParts';
import WandererMark from '../wanderer/WandererMark';
import { type SourceCheck, useSourceCheck } from './useSourceCheck';
import { useTourProvenance } from './useTourProvenance';

type Translate = (key: string, params?: Record<string, unknown>) => string;

/** A stored time as the reader's date; the time of day says nothing here. */
function dayOf(value: string | null, locale: string): string | null {
  return value ? formatDate(value.slice(0, 10), locale) : null;
}

function hostOf(instance: string): string {
  try {
    return new URL(instance).host;
  } catch {
    return instance;
  }
}

/** One line of the card: a round icon, what it is, and the value beside it. */
function ProvenanceRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 px-3 py-2">
      <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-surface-secondary text-content-muted">
        {icon}
      </span>
      <span className="w-[92px] flex-none truncate text-content-faint" style={fs(11)}>
        {label}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-content" style={fs(12.5, 'body')}>
        {children}
      </div>
    </div>
  );
}

function SourceValue({ provenance, t }: { provenance: TourProvenance; t: Translate }) {
  const { source } = provenance;
  if (source.kind === 'gpx') {
    return (
      <>
        <span className="font-semibold">{t('tours.badge.gpx')}</span>
        {source.fileName && (
          <span className="min-w-0 truncate font-geist text-content-muted" style={fs(11.5)}>
            {source.fileName}
          </span>
        )}
      </>
    );
  }
  if (source.kind === 'wanderer') {
    return (
      <>
        <span className="font-semibold">{t('tours.badge.wanderer')}</span>
        <span className="min-w-0 truncate font-geist text-content-muted" style={fs(11.5)}>
          {hostOf(source.instance)}
        </span>
        {source.externalUrl && (
          <Tooltip label={t('tours.provenance.openSource')}>
            <a
              href={source.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('tours.provenance.openSource')}
              className="grid h-6 w-6 flex-none place-items-center rounded-full text-content-faint transition-colors hover:bg-surface-hover hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <ExternalLink size={12} strokeWidth={2.2} />
            </a>
          </Tooltip>
        )}
      </>
    );
  }
  return <span className="font-semibold">{t('tours.badge.planned')}</span>;
}

/** How the tour stands here against what came in: planned over, edited, or as it was. */
function LocalState({ provenance, t }: { provenance: TourProvenance; t: Translate }) {
  const pills: ReactNode[] = [];
  if (provenance.plannedOver) {
    pills.push(
      <SoftPill key="planned" tone="info">
        {t('tours.provenance.plannedOver')}
      </SoftPill>
    );
  }
  if (provenance.editedLocally === true) {
    pills.push(
      <SoftPill key="edited" tone="warning">
        {t('tours.provenance.editedLocally')}
      </SoftPill>
    );
  } else if (provenance.editedLocally === false && !provenance.plannedOver) {
    pills.push(
      <SoftPill key="same" tone="success">
        {t('tours.provenance.asImported')}
      </SoftPill>
    );
  }
  return pills.length ? <>{pills}</> : null;
}

const STATE_TONE: Record<TourSourceCheckResponse['state'], 'success' | 'warning' | 'neutral'> = {
  unchanged: 'success',
  changed: 'warning',
  unavailable: 'neutral',
  not_connected: 'neutral',
  other_instance: 'neutral',
  unknown: 'neutral',
};

/** What the check found, the parts that differ, and the way to take the change in. */
function CheckResult({ check, locale, t }: { check: SourceCheck; locale: string; t: Translate }) {
  const { result } = check;
  if (!result) return null;
  const body =
    result.state === 'unchanged' || result.state === 'changed' ? null : t(`tours.provenance.body.${result.state}`);
  const nowUpdated = dayOf(result.externalUpdated, locale);
  return (
    <div role="status" className="flex flex-col gap-2 border-t border-edge-faint px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <SoftPill tone={STATE_TONE[result.state]}>{t(`tours.provenance.state.${result.state}`)}</SoftPill>
        {result.changes.map((part) => (
          <SoftPill key={part}>{t(`tours.provenance.change.${part}`)}</SoftPill>
        ))}
      </div>
      {body && (
        <p className="m-0 leading-snug text-content-muted" style={fs(12, 'body')}>
          {body}
        </p>
      )}
      {nowUpdated && (
        <p className="m-0 leading-snug text-content-faint" style={fs(11)}>
          {t('tours.provenance.nowUpdated', { date: nowUpdated })}
        </p>
      )}
      {check.canReimport && (
        <div>
          <CardAction
            icon={
              check.reimporting ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Download size={12} strokeWidth={2.2} />
              )
            }
            onClick={check.askReimport}
            disabled={check.reimporting}
          >
            {t('tours.provenance.reimport')}
          </CardAction>
        </div>
      )}
    </div>
  );
}

interface TourProvenanceSectionProps {
  provenance: TourProvenance;
  /** Given for a wanderer snapshot the user may change: the check of its source and the reimport. */
  check?: SourceCheck;
}

/**
 * P2C-02 in the tour's detail: where it came from (planned here, a GPX file,
 * a wanderer trail with its link), when, and how it stands here against what
 * came in. For a wanderer snapshot, MF-03: the check of its source, on purpose
 * and read only, and from a change the confirmed reimport as a new snapshot.
 */
export default function TourProvenanceSection({ provenance, check }: TourProvenanceSectionProps) {
  const { t, locale } = useTranslation();
  const { source } = provenance;
  const imported = source.kind !== 'trek';
  const importedAt = dayOf((source.kind === 'wanderer' ? source.importedAt : null) ?? provenance.createdAt, locale);
  const externalUpdated = source.kind === 'wanderer' ? dayOf(source.externalUpdated, locale) : null;
  const local = <LocalState provenance={provenance} t={t} />;
  const sourceIcon =
    source.kind === 'gpx' ? (
      <FileDown size={13} strokeWidth={2} />
    ) : source.kind === 'wanderer' ? (
      <WandererMark size={13} />
    ) : (
      <PenLine size={13} strokeWidth={2} />
    );

  return (
    <DialogSection
      className="flex-none"
      label={t('tours.provenance.label')}
      action={
        check && (
          <Tooltip label={t('tours.provenance.checkHint')}>
            <span className="inline-flex">
              <CardAction
                icon={
                  check.checking ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <RefreshCw size={12} strokeWidth={2.2} />
                  )
                }
                onClick={() => void check.check()}
                disabled={check.checking}
              >
                {t('tours.provenance.check')}
              </CardAction>
            </span>
          </Tooltip>
        )
      }
    >
      <div className={`${BOX} divide-y divide-edge-faint`}>
        <ProvenanceRow icon={sourceIcon} label={t('tours.provenance.source')}>
          <SourceValue provenance={provenance} t={t} />
        </ProvenanceRow>
        {importedAt && (
          <ProvenanceRow
            icon={<Download size={13} strokeWidth={2} />}
            label={t(imported ? 'tours.provenance.importedAt' : 'tours.provenance.createdAt')}
          >
            <span>{importedAt}</span>
          </ProvenanceRow>
        )}
        {externalUpdated && (
          <ProvenanceRow icon={<RefreshCw size={13} strokeWidth={2} />} label={t('tours.provenance.externalUpdated')}>
            <span>{externalUpdated}</span>
            <InfoDot
              label={t('tours.provenance.externalUpdated')}
              description={t('tours.provenance.externalUpdatedHint')}
            />
          </ProvenanceRow>
        )}
        {imported && (provenance.plannedOver || provenance.editedLocally !== null) && (
          <ProvenanceRow icon={<PenLine size={13} strokeWidth={2} />} label={t('tours.provenance.localState')}>
            {local}
          </ProvenanceRow>
        )}
        {check && <CheckResult check={check} locale={locale} t={t} />}
      </div>
      {check && (
        <ConfirmDialog
          isOpen={check.confirming}
          onClose={check.cancelReimport}
          onConfirm={() => void check.reimport()}
          title={t('tours.provenance.reimportTitle')}
          message={t('tours.provenance.reimportBody')}
          confirmLabel={t('tours.provenance.reimport')}
          danger={false}
        />
      )}
    </DialogSection>
  );
}

/**
 * The section as the tour's detail places it: reads the provenance with the
 * detail, and offers the source check only on a wanderer snapshot the user
 * may change, where a reimport has somewhere to go.
 */
export function TourProvenanceBlock({
  tripId,
  tour,
  canCheck,
  onReimported,
}: {
  tripId: number;
  tour: TourListItem;
  canCheck: boolean;
  onReimported?: (tour: TourListItem) => Promise<void> | void;
}) {
  const provenance = useTourProvenance(tripId, tour);
  const check = useSourceCheck({ tripId, placeId: tour.place_id, onReimported });
  if (!provenance) return null;
  const checkable = canCheck && provenance.origin === 'wanderer';
  return <TourProvenanceSection provenance={provenance} check={checkable ? check : undefined} />;
}
