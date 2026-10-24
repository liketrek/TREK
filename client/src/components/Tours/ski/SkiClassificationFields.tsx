import { SKI_DISCIPLINES, SKI_TECHNIQUES, type SkiDiscipline, type SkiTechnique } from '@trek/shared';
import { Info } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { LABEL, Segmented } from '../../shared/dialogParts';
import { InfoDot, TourNotice } from '../tourParts';
import { skiChoiceMissing, type SkiChoice } from './skiChoice';
import { SKI_DISCIPLINE_ICON } from './skiDiscipline';

/**
 * SKI-02: what a ski tour is, chosen on purpose: the discipline, none until
 * one is picked, six of them in two columns, and for cross-country the
 * technique, Unknown among its answers. The technique stays in sight but
 * dimmed while another discipline is chosen. The info dot says what TREK does
 * with the tour. The GPX import, the classification dialog and the planner
 * share it; `planned` says the choice is asked for a tour to save rather than
 * a track to import.
 */
export function SkiClassificationFields({
  choice,
  onChange,
  planned = false,
}: {
  choice: SkiChoice;
  onChange: (choice: SkiChoice) => void;
  planned?: boolean;
}) {
  const { t } = useTranslation();
  const crossCountry = choice.discipline === 'cross_country';
  const missing = skiChoiceMissing(choice);
  return (
    <div data-testid="tour-ski-fields" className="flex min-w-0 flex-col gap-3">
      <div className="min-w-0">
        <div className="mb-[5px] flex min-h-5 min-w-0 items-center gap-1">
          <span className={`${LABEL} !mb-0 min-w-0 truncate leading-5`}>{t('tours.ski.discipline')}</span>
          <InfoDot label={t('tours.ski.infoLabel')} description={t('tours.ski.info')} />
        </div>
        <Segmented<SkiDiscipline>
          value={(choice.discipline ?? '') as SkiDiscipline}
          onChange={(discipline) => onChange({ ...choice, discipline })}
          label={t('tours.ski.discipline')}
          columns={2}
          options={SKI_DISCIPLINES.map((discipline) => {
            const Icon = SKI_DISCIPLINE_ICON[discipline];
            return {
              value: discipline,
              // Two columns in a narrow rail: a long name ends in an ellipsis rather than spilling out.
              label: <span className="min-w-0 truncate">{t(`tours.ski.discipline.${discipline}`)}</span>,
              icon: <Icon size={13} strokeWidth={2} aria-hidden="true" className="flex-none" />,
            };
          })}
        />
      </div>
      <fieldset
        data-testid="tour-ski-technique"
        disabled={!crossCountry}
        className={`m-0 min-w-0 border-0 p-0 transition-opacity ${crossCountry ? '' : 'opacity-50'}`}
      >
        <span className={LABEL}>{t('tours.ski.technique')}</span>
        <Segmented<SkiTechnique>
          value={(crossCountry ? (choice.technique ?? '') : '') as SkiTechnique}
          onChange={(technique) => onChange({ ...choice, technique })}
          label={t('tours.ski.technique')}
          fill
          options={SKI_TECHNIQUES.map((technique) => ({
            value: technique,
            label: t(`tours.ski.technique.${technique}`),
          }))}
        />
      </fieldset>
      {missing && (
        <TourNotice role="status" icon={<Info size={13} strokeWidth={2} />}>
          {t(
            missing === 'technique'
              ? 'tours.ski.chooseTechnique'
              : planned
                ? 'tours.ski.chooseDisciplineToSave'
                : 'tours.ski.chooseDiscipline'
          )}
        </TourNotice>
      )}
    </div>
  );
}
