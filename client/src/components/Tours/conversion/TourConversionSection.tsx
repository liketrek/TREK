import { AlertTriangle, CheckCircle2, CopyPlus, Loader2, Replace, Route, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { formatDistance } from '../../../utils/units';
import { DialogButton, fs } from '../../shared/DialogShell';
import { useToast } from '../../shared/Toast';
import { Tooltip } from '../../shared/Tooltip';
import { CardAction, RailCard, RailFacts, type TourMetricField } from '../tourParts';
import { CORRIDOR_M, FAITHFUL_SHARE } from './gpxConversion';
import type { GpxConversion } from './useGpxConversion';

/** The two lines of the comparison as the map draws them: the import dotted, the suggestion solid. */
function LineLegend() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-content-muted" style={fs(11, 'body')}>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="w-5 border-t-[3px] border-dotted border-info" />
        {t('tours.conversion.legendImport')}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="h-[3px] w-5 rounded-full bg-info" />
        {t('tours.conversion.legendSuggestion')}
      </span>
    </div>
  );
}

/** One line of status inside the card: an icon and a sentence. */
function StatusLine({
  icon,
  tone = 'muted',
  children,
}: {
  icon: ReactNode;
  tone?: 'muted' | 'warning';
  children: ReactNode;
}) {
  return (
    <p
      role="status"
      className={`m-0 flex items-start gap-2 leading-snug ${tone === 'warning' ? 'text-warning' : 'text-content-secondary'}`}
      style={fs(12, 'body')}
    >
      <span className="mt-[2px] flex-none">{icon}</span>
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/**
 * In the view of an import: plan an editable tour from it. Asked for, the
 * import's track turns into control points routed anew, and the card compares
 * that route to the track before anything is taken over. Taking it over either
 * plans the import over in place (its days and notes stay, the recorded track
 * is kept to go back to) or opens a new tour beside it. Both open in the editor
 * and are stored only when saved.
 */
export default function TourConversionSection({ conversion }: { conversion: GpxConversion }) {
  const { t } = useTranslation();
  const toast = useToast();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  if (!conversion.available) return null;

  const adopt = (how: 'replace' | 'new') => {
    if (conversion.adopt(how))
      toast.info(t(how === 'replace' ? 'tours.conversion.replacing' : 'tours.conversion.adopted'));
  };
  const card = (children: ReactNode) => (
    <RailCard icon={<Route size={14} strokeWidth={2} />} title={t('tours.conversion.title')}>
      {children}
    </RailCard>
  );

  if (conversion.status === 'idle') {
    return card(
      <div className="flex flex-col items-start gap-2.5">
        <p className="m-0 leading-snug text-content-secondary" style={fs(12, 'body')}>
          {t(conversion.paddle ? 'tours.conversion.introPaddle' : 'tours.conversion.intro')}
        </p>
        <CardAction onClick={() => void conversion.analyze()} icon={<Route size={12} strokeWidth={2.2} />}>
          {t('tours.conversion.analyze')}
        </CardAction>
      </div>
    );
  }

  if (conversion.status === 'analyzing') {
    return card(
      <StatusLine icon={<Loader2 size={13} strokeWidth={2} className="animate-spin text-content-faint" />}>
        {t('tours.conversion.analyzing', { count: conversion.points.length })}
      </StatusLine>
    );
  }

  if (conversion.status === 'failed' || !conversion.comparison) {
    return card(
      <div className="flex flex-col items-start gap-2">
        <StatusLine tone="warning" icon={<AlertTriangle size={13} strokeWidth={2.2} />}>
          {t(conversion.error === 'track' ? 'tours.conversion.failedTrack' : 'tours.conversion.failedRouting')}
        </StatusLine>
        <button
          type="button"
          onClick={() => void conversion.analyze()}
          className="font-semibold text-content underline"
          style={fs(12, 'body')}
        >
          {t('tours.planner.retry')}
        </button>
      </div>
    );
  }

  const { comparison } = conversion;
  const faithful = comparison.withinCorridor >= FAITHFUL_SHARE;
  const facts: TourMetricField[] = [
    { label: t('tours.conversion.importLength'), value: formatDistance(comparison.originalKm, unit) },
    { label: t('tours.conversion.suggestionLength'), value: formatDistance(comparison.suggestionKm, unit) },
    {
      label: t('tours.conversion.withinCorridor', { m: CORRIDOR_M }),
      value: `${Math.round(comparison.withinCorridor * 100)} %`,
    },
    { label: t('tours.conversion.maxDeviation'), value: `${Math.round(comparison.maxDeviationM)} m` },
    { label: t('tours.conversion.controlPoints'), value: String(conversion.points.length) },
  ];
  return card(
    <div className="flex flex-col gap-3">
      <LineLegend />
      <RailFacts facts={facts} />
      <StatusLine
        tone={faithful ? 'muted' : 'warning'}
        icon={
          faithful ? (
            <CheckCircle2 size={13} strokeWidth={2.2} className="text-success" />
          ) : (
            <AlertTriangle size={13} strokeWidth={2.2} />
          )
        }
      >
        {t(
          faithful
            ? conversion.paddle
              ? 'tours.conversion.closePaddle'
              : 'tours.conversion.close'
            : 'tours.conversion.different'
        )}
      </StatusLine>
      <div className="flex flex-col gap-2 border-t border-edge-faint pt-3">
        <Tooltip label={t('tours.conversion.replaceHint')}>
          <span className="flex [&>button]:flex-1">
            <DialogButton
              variant="primary"
              onClick={() => adopt('replace')}
              icon={<Replace size={14} strokeWidth={2} />}
            >
              {t('tours.conversion.replace')}
            </DialogButton>
          </span>
        </Tooltip>
        <div className="flex gap-2">
          <Tooltip label={t('tours.conversion.adoptHint')}>
            <span className="flex flex-1 [&>button]:flex-1">
              <DialogButton onClick={() => adopt('new')} icon={<CopyPlus size={14} strokeWidth={2} />}>
                {t('tours.conversion.adopt')}
              </DialogButton>
            </span>
          </Tooltip>
          <DialogButton onClick={conversion.cancel} icon={<X size={14} strokeWidth={2} />}>
            {t('tours.conversion.discard')}
          </DialogButton>
        </div>
      </div>
    </div>
  );
}
