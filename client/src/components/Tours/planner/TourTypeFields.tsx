import {
  MAX_PADDLE_SPEED_KMH,
  type PaddleBoatType,
  type PaddleWaterContext,
  type PlannableTourType,
} from '@trek/shared';
import { AlertTriangle, Info, Mountain, Waves } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../../../i18n';
import { SoftPill } from '../../Planner/planParts';
import { INPUT, LABEL, Segmented } from '../../shared/dialogParts';
import { fs } from '../../shared/DialogShell';
import { TourNotice } from '../tourParts';
import type { TourPlannerController } from './useTourPlanner';

const BOATS: readonly PaddleBoatType[] = ['kayak', 'canoe', 'sup', 'other'];
const WATERS: readonly PaddleWaterContext[] = ['river', 'lake'];

interface TourTypeFieldsProps {
  planner: TourPlannerController;
  locked: boolean;
}

/** "4" or "4.5", as a speed is typed and read back. */
function speedText(value: number | null): string {
  return value === null || Number.isNaN(value) ? '' : String(Math.round(value * 10) / 10);
}

/**
 * The paddler's own speed. Empty means the boat's suggestion applies; text
 * that is no speed reaches the planner as NaN while it is typed, so the
 * planner marks it and holds Save back, and the text stays for the user to fix.
 */
function PaddleSpeedInput({ planner, locked }: TourTypeFieldsProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const { paddle } = planner;
  const commit = (text: string) => {
    const trimmed = text.trim().replace(',', '.');
    if (trimmed === '') return paddle.setSpeedKmh(null);
    const value = Number(trimmed);
    paddle.setSpeedKmh(Number.isFinite(value) ? value : Number.NaN);
  };
  return (
    <div className="relative">
      <input
        id="tour-planner-paddle-speed"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        maxLength={5}
        disabled={locked}
        placeholder={speedText(paddle.recommendedSpeedKmh)}
        value={draft ?? speedText(paddle.speedKmh)}
        onFocus={() => setDraft(speedText(paddle.speedKmh))}
        onChange={(event) => {
          setDraft(event.target.value);
          commit(event.target.value);
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        aria-invalid={planner.paddleSpeedInvalid || undefined}
        aria-describedby={planner.paddleSpeedInvalid ? 'tour-planner-paddle-speed-error' : undefined}
        className={`${INPUT} pe-12 tabular-nums`}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-content-faint"
        style={fs(12, 'body')}
      >
        km/h
      </span>
    </div>
  );
}

/**
 * PAD-01: what the tour is. A hike keeps its fields where they were; a paddle
 * tour asks for exactly one boat and the water it is on, and offers the
 * boat's planning speed beside the paddler's own. Nothing here routes the
 * tour or puts it on a day.
 */
export function TourTypeFields({ planner, locked }: TourTypeFieldsProps) {
  const { t } = useTranslation();
  const { paddle } = planner;
  const ownSpeed = paddle.speedKmh !== null;
  const suggestion = paddle.recommendedSpeedKmh;
  return (
    <fieldset disabled={locked} className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
      <div className="min-w-0">
        <span className={LABEL} id="tour-planner-type-label">
          {t('tours.planner.tourType')}
        </span>
        <Segmented<PlannableTourType>
          value={planner.tourType}
          onChange={planner.setTourType}
          label={t('tours.planner.tourType')}
          fill
          options={[
            { value: 'hike', label: t('tourTypes.hike'), icon: <Mountain size={13} strokeWidth={2} /> },
            { value: 'kayak', label: t('tourTypes.kayak'), icon: <Waves size={13} strokeWidth={2} /> },
          ]}
        />
      </div>

      {planner.isPaddle && (
        <div data-testid="tour-planner-paddle-fields" className="flex min-w-0 flex-col gap-3">
          <div className="min-w-0">
            <span className={LABEL}>{t('tours.paddle.boat')}</span>
            <Segmented<PaddleBoatType>
              value={(paddle.boatType ?? '') as PaddleBoatType}
              onChange={paddle.setBoatType}
              label={t('tours.paddle.boat')}
              fill
              options={BOATS.map((boat) => ({ value: boat, label: t(`tours.paddle.boat.${boat}`) }))}
            />
          </div>
          <div className="min-w-0">
            <span className={LABEL}>{t('tours.paddle.water')}</span>
            <Segmented<PaddleWaterContext>
              value={(paddle.waterContext ?? '') as PaddleWaterContext}
              onChange={paddle.setWaterContext}
              label={t('tours.paddle.water')}
              fill
              options={WATERS.map((water) => ({ value: water, label: t(`tours.paddle.water.${water}`) }))}
            />
          </div>
          <div className="min-w-0">
            <div className="mb-[5px] flex min-h-5 min-w-0 items-center gap-1.5">
              <label className={`${LABEL} !mb-0 min-w-0 truncate leading-5`} htmlFor="tour-planner-paddle-speed">
                {t('tours.paddle.speed')}
              </label>
              {ownSpeed && (
                <span className="ms-auto inline-flex min-w-0">
                  <SoftPill tone="info">{t('tours.paddle.speedOwn')}</SoftPill>
                </span>
              )}
            </div>
            <PaddleSpeedInput planner={planner} locked={locked} />
            {planner.paddleSpeedInvalid ? (
              <span id="tour-planner-paddle-speed-error" role="alert" className="mt-1 block text-danger" style={fs(11)}>
                {t('tours.paddle.speedInvalid', { max: MAX_PADDLE_SPEED_KMH })}
              </span>
            ) : ownSpeed && suggestion !== null && suggestion !== paddle.speedKmh ? (
              <button
                type="button"
                onClick={paddle.adoptRecommendedSpeed}
                className="mt-1 inline-flex items-center gap-1 rounded-full font-semibold text-accent hover:underline"
                style={fs(11.5, 'body')}
              >
                {t('tours.paddle.speedUseSuggestion', { speed: speedText(suggestion) })}
              </button>
            ) : (
              paddle.boatType === 'other' &&
              !ownSpeed && (
                <span className="mt-1 block text-content-faint" style={fs(11, 'body')}>
                  {t('tours.paddle.speedNeeded')}
                </span>
              )
            )}
          </div>
          {/* PAD-04: what the map does not know yet stays visible, never read as open water. */}
          <TourNotice icon={<AlertTriangle size={13} strokeWidth={2} />}>{t('tours.paddle.noWaterData')}</TourNotice>
          {planner.paddleIncomplete && (
            <TourNotice role="status" icon={<Info size={13} strokeWidth={2} />}>
              {t('tours.paddle.chooseBoat')}
            </TourNotice>
          )}
        </div>
      )}
    </fieldset>
  );
}
