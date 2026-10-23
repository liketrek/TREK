import type { TourRouteCard } from '@trek/shared';
import { Clock, Mountain, MoveHorizontal, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

import { useTranslation } from '../../../../i18n';
import { useSettingsStore } from '../../../../store/settingsStore';
import type { DistanceIndexedProfileSample, RouteProfileFocus } from '../../../../utils/routeGeometry';
import { WhiteBadge } from '../../../Planner/planParts';
import ElevationProfile from '../../../shared/ElevationProfile';
import { SacStepChip } from '../../../Tours/hike/SacStepChip';
import { profileFocusLabel } from '../../../Tours/tourPresentation';
import { useAssistantView } from '../../assistantViewContext';
import { useCardFormat } from '../parts/useCardFormat';
import { timeAt } from './tourRouteDayModel';
import { gradeAt, profileBands, profileGrades, profileMarks, sacAt, STEEP_GRADE } from './tourRouteModel';
import { routeName, SAC_WORDS } from './tourRouteWords';

/**
 * A route's height profile in its card: the hard grades (or else the steep
 * stretches) tinted, the named stops and stage ends marked, the other ways of
 * an answer drawn thin on the same axes. The spot in focus is the one the map
 * and the stop chips move too; its words add the time on the way and the
 * grade of the path there, or else how steep it is where it is steep. On
 * the phone a finger scrubs along it while the chat still scrolls, and the
 * spot is read in a row under it instead of a box over it. A route without
 * heights says so instead of drawing a flat line.
 */

interface ProfileProps {
  toolCallId: string;
  card: TourRouteCard;
  samples: DistanceIndexedProfileSample[];
  color: string;
  focus: RouteProfileFocus | null;
  onFocus: (focus: RouteProfileFocus | null) => void;
  compare?: ReadonlyArray<{ key: string; samples: readonly DistanceIndexedProfileSample[]; color: string }>;
}

/** What the phone's row under the profile says about the spot in focus. */
function ReadoutRow({
  card,
  focus,
  grade,
  sac,
}: {
  card: TourRouteCard;
  focus: RouteProfileFocus | null;
  grade: number | null;
  sac: number | null;
}) {
  const { t } = useTranslation();
  const format = useCardFormat();
  if (!focus) return <p className="m-0 mt-1 text-caption text-content-faint">{t('assistant.card.tour.scrubHint')}</p>;
  const time = timeAt(card, focus.distanceMeters);
  const glyph = 'flex-none text-content-faint';
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1" aria-live="polite" data-testid="tour-profile-readout">
      <WhiteBadge icon={<MoveHorizontal size={10} strokeWidth={2.2} className={glyph} />}>
        {format.distance(focus.distanceMeters / 1000)}
      </WhiteBadge>
      {focus.elevationMeters !== null && (
        <WhiteBadge icon={<Mountain size={10} strokeWidth={2.2} className={glyph} />}>
          {format.elevation(focus.elevationMeters)}
        </WhiteBadge>
      )}
      {time && (
        <WhiteBadge icon={<Clock size={10} strokeWidth={2.2} className={glyph} />}>
          {time.clock ? format.clock(time.clock) : format.minutes(time.minutes)}
        </WhiteBadge>
      )}
      {sac !== null && <SacStepChip step={sac} />}
      {sac === null && grade !== null && grade >= STEEP_GRADE && (
        <WhiteBadge icon={<TrendingUp size={10} strokeWidth={2.2} className={glyph} />}>
          {t('assistant.card.tour.steep', { grade: `${Math.round(grade)} %` })}
        </WhiteBadge>
      )}
    </div>
  );
}

export default function TourRouteProfile({ toolCallId, card, samples, color, focus, onFocus, compare }: ProfileProps) {
  const { t } = useTranslation();
  const { variant, density } = useAssistantView();
  const format = useCardFormat();
  const unit = useSettingsStore((s) => s.settings.distance_unit ?? 'metric');
  const grades = useMemo(() => profileGrades(samples), [samples]);
  const bands = useMemo(() => profileBands(card, samples), [card, samples]);
  if (samples.length < 2) {
    if (!card.routed) return null;
    return <p className="m-0 mt-2 text-caption text-content-faint">{t('assistant.card.tour.noHeights')}</p>;
  }
  const phone = variant === 'fullscreen';
  const focusGrade = focus ? gradeAt(grades, focus.distanceMeters) : null;
  const focusSac = focus ? sacAt(card, focus.distanceMeters) : null;

  /** The spot in words: how far, how high, about when, and the grade there, else how steep where it is steep. */
  const describe = (spot: RouteProfileFocus): string => {
    const time = timeAt(card, spot.distanceMeters);
    const text = time
      ? t('assistant.card.tour.focusTime', {
          distance: format.distance(spot.distanceMeters / 1000),
          elevation: spot.elevationMeters === null ? '-' : format.elevation(spot.elevationMeters),
          time: time.clock ? format.clock(time.clock) : format.minutes(time.minutes),
        })
      : profileFocusLabel(spot, t, unit);
    const sac = sacAt(card, spot.distanceMeters);
    const meaning = sac === null ? undefined : SAC_WORDS[sac - 1];
    if (meaning) return `${text}, T${sac} ${t(meaning.labelKey)}`;
    const grade = gradeAt(grades, spot.distanceMeters);
    if (grade === null || grade < STEEP_GRADE) return text;
    return `${text}, ${t('assistant.card.tour.steep', { grade: `${Math.round(grade)} %` })}`;
  };

  return (
    <div className="mt-2">
      <ElevationProfile
        samples={samples}
        color={color}
        height={phone || density === 'roomy' ? 64 : 52}
        gradientId={`assistant-tour-${toolCallId.replace(/[^\w-]/g, '-')}`}
        ariaLabel={t('assistant.card.tour.profile', { name: routeName(card, t) })}
        focus={focus}
        onFocusChange={onFocus}
        formatFocus={describe}
        bands={bands}
        marks={profileMarks(card)}
        compare={compare}
        readout={phone ? 'none' : 'tooltip'}
        keepFocusOnLift={phone}
      />
      {phone && <ReadoutRow card={card} focus={focus} grade={focusGrade} sac={focusSac} />}
    </div>
  );
}
