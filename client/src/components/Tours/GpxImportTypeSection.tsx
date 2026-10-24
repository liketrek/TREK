import {
  BIKE_PROFILES,
  importableTourTypeSchema,
  type BikeProfile,
  type PaddleBoatType,
  type PaddleWaterContext,
} from '@trek/shared';
import { Info } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from '../../i18n';
import { LABEL, Segmented } from '../shared/dialogParts';
import { DialogSection } from '../shared/DialogShell';
import type { GpxImportChoicesState } from './gpxImportChoices';
import { RecordedRideFacts } from './horse/RecordedRideFacts';
import { TourTypeSelect } from './planner/TourTypeSelect';
import { RunProfileField } from './run/RunFields';
import { SkiClassificationFields } from './ski/SkiClassificationFields';
import { TourNotice } from './tourParts';

const BOATS: readonly PaddleBoatType[] = ['kayak', 'canoe', 'sup', 'other'];
const WATERS: readonly PaddleWaterContext[] = ['river', 'lake'];
/** Every type a GPX file can come in as: the planner's, and ski, which is only kept (SKI-02). */
const IMPORT_TYPES = importableTourTypeSchema.options;

/** A paddle import's boat and water, side by side, each chosen on purpose. */
function PaddleImportFields({ choices }: { choices: GpxImportChoicesState }) {
  const { t } = useTranslation();
  const { chosen } = choices;
  return (
    <>
      <div data-testid="gpx-preview-paddle" className="grid grid-cols-1 gap-3 sm:grid-cols-[3fr_2fr]">
        <div className="min-w-0">
          <span className={LABEL}>{t('tours.paddle.boat')}</span>
          <Segmented<PaddleBoatType>
            value={(chosen.boat ?? '') as PaddleBoatType}
            onChange={choices.setBoat}
            label={t('tours.paddle.boat')}
            fill
            options={BOATS.map((value) => ({ value, label: t(`tours.paddle.boat.${value}`) }))}
          />
        </div>
        <div className="min-w-0">
          <span className={LABEL}>{t('tours.paddle.water')}</span>
          <Segmented<PaddleWaterContext>
            value={(chosen.water ?? '') as PaddleWaterContext}
            onChange={choices.setWater}
            label={t('tours.paddle.water')}
            fill
            options={WATERS.map((value) => ({ value, label: t(`tours.paddle.water.${value}`) }))}
          />
        </div>
      </div>
      {(chosen.boat === null || chosen.water === null) && (
        <TourNotice role="status" icon={<Info size={13} strokeWidth={2} />}>
          {t('tours.paddle.chooseBoatImport')}
        </TourNotice>
      )}
    </>
  );
}

/**
 * The preview's "import as" section: the type, and below it what that type
 * names: a bike or run profile, a paddle tour's boat and water, a ski track's
 * discipline and technique (SKI-02), and for a ride (HOR-02) what the import
 * keeps and does not work out.
 */
export function GpxImportTypeSection({ choices }: { choices: GpxImportChoicesState }) {
  const { t } = useTranslation();
  const typeLabelId = useId();
  const { chosen } = choices;
  return (
    <DialogSection label={<span id={typeLabelId}>{t('tours.import.previewAs')}</span>}>
      <div className="flex flex-col gap-3">
        <TourTypeSelect value={chosen.type} onChange={choices.setType} labelId={typeLabelId} types={IMPORT_TYPES} />
        {chosen.type === 'bike' && (
          <div data-testid="gpx-preview-bike" className="min-w-0">
            <span className={LABEL}>{t('tours.bike.profile')}</span>
            <Segmented<BikeProfile>
              value={chosen.bikeProfile}
              onChange={choices.setBikeProfile}
              label={t('tours.bike.profile')}
              fill
              options={BIKE_PROFILES.map((value) => ({ value, label: t(`tours.bike.profile.${value}`) }))}
            />
          </div>
        )}
        {chosen.type === 'run' && <RunProfileField value={chosen.runProfile} onChange={choices.setRunProfile} />}
        {chosen.type === 'kayak' && <PaddleImportFields choices={choices} />}
        {chosen.type === 'ski' && <SkiClassificationFields choice={chosen.ski} onChange={choices.setSki} />}
        {chosen.type === 'horse' && (
          <div data-testid="gpx-preview-horse">
            <RecordedRideFacts />
          </div>
        )}
      </div>
    </DialogSection>
  );
}
