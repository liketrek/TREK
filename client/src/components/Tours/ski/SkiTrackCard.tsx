import { MountainSnow, Pencil } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { fs } from '../../shared/DialogShell';
import { FigureBadge } from '../paddle/FigureBadge';
import { CardAction, InfoDot, RailCard, RailFacts } from '../tourParts';
import { SkiClassifyDialog } from './SkiClassifyDialog';
import { SKI_DISCIPLINE_ICON, skiDisciplineOf, skiTechniqueOf } from './skiDiscipline';
import type { SkiClassification } from './useSkiClassification';

/**
 * SKI-02: a ski track in the planner's rail: its discipline on a tinted tile,
 * a cross-country technique as a badge beside it, and the ski time said as
 * not worked out rather than left blank or filled with a hike's estimate (the
 * recorded time when the track has one). The classification changes in a
 * dialog; a viewer who may not edit sees the action dimmed. Distance and heights are the inspector's below, as recorded.
 */
export function SkiTrackCard({ ski }: { ski: SkiClassification }) {
  const { t } = useTranslation();
  const { tour } = ski;
  if (!tour) return null;
  const discipline = skiDisciplineOf(tour);
  const technique = skiTechniqueOf(tour);
  const Icon = discipline ? SKI_DISCIPLINE_ICON[discipline] : MountainSnow;
  return (
    <>
      <RailCard
        icon={<MountainSnow size={14} strokeWidth={2} />}
        title={t('tours.ski.title')}
        aside={<InfoDot label={t('tours.ski.infoLabel')} description={t('tours.ski.info')} />}
      >
        <div data-testid="ski-track-card" className="flex flex-col gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 flex-none place-items-center rounded-full bg-info-soft text-info ring-1 ring-inset ring-edge-faint"
            >
              <Icon size={15} strokeWidth={2} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
              <span
                data-testid="ski-track-discipline"
                className={`block max-w-full truncate font-semibold ${discipline ? 'text-content' : 'text-content-muted'}`}
                style={fs(13, 'body')}
              >
                {discipline ? t(`tours.ski.discipline.${discipline}`) : t('tours.ski.chooseDiscipline')}
              </span>
              {technique && (
                <FigureBadge
                  label={t('tours.ski.technique')}
                  value={t(`tours.ski.technique.${technique}`)}
                  testId="ski-track-technique"
                />
              )}
            </span>
            <CardAction icon={<Pencil size={12} strokeWidth={2.2} />} onClick={ski.open} disabled={!ski.canEdit}>
              {t('common.change')}
            </CardAction>
          </div>
          <RailFacts
            facts={[
              {
                label: t('tours.ski.time'),
                value:
                  tour.duration != null
                    ? t('tours.durationMinutes', { count: Math.max(1, Math.round(tour.duration)) })
                    : t('tours.ski.timeUnknown'),
              },
            ]}
          />
        </div>
      </RailCard>
      <SkiClassifyDialog ski={ski} />
    </>
  );
}
