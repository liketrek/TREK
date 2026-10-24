import { useTranslation } from '../../../i18n';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { TourCornerMark } from '../TourCornerMark';
import {
  SKI_DISCIPLINE_ICON,
  skiClassificationText,
  skiDisciplineOf,
  skiTechniqueOf,
  type SkiTour,
} from './skiDiscipline';

/**
 * SKI-02: a ski tour's discipline on the corner of its round tile, a frosted
 * badge carrying the discipline's own icon. Its tooltip names the discipline
 * and a cross-country technique.
 */
export function SkiCornerMark({ tour, size = 15 }: { tour: SkiTour; size?: number }) {
  const { t } = useTranslation();
  const discipline = skiDisciplineOf(tour);
  const label = skiClassificationText(tour, t);
  if (!discipline || !label) return null;
  return <TourCornerMark icon={SKI_DISCIPLINE_ICON[discipline]} label={label} size={size} testId="tour-ski-mark" />;
}

/**
 * SKI-02: a ski tour's discipline as a pill of a tour's head, beside its
 * type, a cross-country technique as a badge inside it. The tooltip says what
 * TREK does with the track and what it does not say.
 */
export function SkiHeadPill({ tour, className }: { tour: SkiTour; className: string }) {
  const { t } = useTranslation();
  const discipline = skiDisciplineOf(tour);
  if (!discipline) return null;
  const technique = skiTechniqueOf(tour);
  const Icon = SKI_DISCIPLINE_ICON[discipline];
  return (
    <Tooltip label={t('tours.ski.info')}>
      <span data-testid="tour-detail-ski" className={className} style={fs(10.5)}>
        <Icon size={11} strokeWidth={2} className="flex-none text-info" aria-hidden="true" />
        {t(`tours.ski.discipline.${discipline}`)}
        {technique && (
          <span
            data-testid="tour-detail-ski-technique"
            className="ms-0.5 inline-flex h-[16px] items-center rounded-full bg-surface-secondary px-1.5 text-content"
          >
            <span className="sr-only">{t('tours.ski.technique')}:</span>
            {t(`tours.ski.technique.${technique}`)}
          </span>
        )}
      </span>
    </Tooltip>
  );
}
