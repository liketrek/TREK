import type { TourRouteCard as Route } from '@trek/shared';
import { Route as RouteIcon } from 'lucide-react';
import { useMemo } from 'react';

import { useTranslation } from '../../../../i18n';
import { chatOf, useAssistantStore } from '../../../../store/assistantStore';
import { useSettingsStore } from '../../../../store/settingsStore';
import type { DistanceUnit } from '../../../../types';
import { formatDistance, formatElevation } from '../../../../utils/units';
import { SacStepChip } from '../../../Tours/hike/SacStepChip';
import { variantPaintCss } from '../../../Tours/planner/legVariantPaint';
import { type LegVariant, variantDelta } from '../../../Tours/planner/legVariants';
import { VariantMark } from '../../../Tours/planner/mapCardParts';
import { formatTourDuration } from '../../../Tours/planner/tourDurationInput';
import { useAssistantView } from '../../assistantViewContext';
import CardFrame from '../parts/CardFrame';
import CardHeader from '../parts/CardHeader';
import { CardSection } from '../parts/CardSection';
import WayFigures from './TourFigureLine';
import { TourRouteBody } from './TourRouteCard';
import { TourGrade } from './TourRouteHead';
import { legVariantOf, profileSamples, type RouteEntry, WAY_KEYS } from './tourRouteModel';
import { routeName, TOUR_TYPE_WORDS } from './tourRouteWords';
import { useLineHover, useTourRouteCard } from './useTourRouteCard';

/** A signed difference: a plus for more, a minus sign for less, nothing for none worth printing. */
function signed(value: number, format: (absolute: number) => string): string | null {
  const text = format(Math.abs(value));
  if (Math.abs(value) < 1e-9 || /^0\s/.test(text)) return null;
  return `${value > 0 ? '+' : '−'}${text}`;
}

/** How a way differs from the chosen one, as one faint line: "Compared with way A: −4.3 km −178 m −1 h 33 min". */
function WayDelta({
  way,
  chosen,
  letter,
  unit,
}: {
  way: LegVariant;
  chosen: LegVariant;
  letter: string;
  unit: DistanceUnit;
}) {
  const { t } = useTranslation();
  const delta = variantDelta(way, chosen);
  const parts = [
    signed(delta.distanceM / 1000, (km) => formatDistance(km, unit)),
    delta.gainM === null ? null : signed(delta.gainM, (m) => formatElevation(m, unit)),
    delta.minutes === null ? null : signed(delta.minutes, formatTourDuration),
  ].filter((part): part is string => part !== null);
  if (parts.length === 0) return null;
  return (
    <span
      className="flex flex-wrap items-center gap-x-2 text-caption text-content-faint"
      data-testid="leg-variant-delta"
    >
      <span>{t('assistant.card.tour.deltaTo', { letter })}</span>
      {parts.map((part) => (
        <span key={part} className="tabular-nums text-content-muted">
          {part}
        </span>
      ))}
    </span>
  );
}

/** One way to choose: its letter in the colour it is drawn in, its name and grade, its figures, how it differs. */
function WayOption({
  entry,
  index,
  chosen,
  chosenWay,
  chosenLetter,
  unit,
  onSelect,
  onHover,
}: {
  entry: RouteEntry;
  index: number;
  chosen: boolean;
  chosenWay: LegVariant;
  chosenLetter: string;
  unit: DistanceUnit;
  onSelect: () => void;
  onHover: (on: boolean) => void;
}) {
  const { t } = useTranslation();
  const key = WAY_KEYS[index] ?? 'a';
  const letter = key.toUpperCase();
  const way = legVariantOf(entry.card, key);
  const grades = entry.card.grades;
  const name = entry.card.label ?? t('tours.variants.option', { letter });
  return (
    <button
      type="button"
      role="radio"
      aria-checked={chosen}
      aria-label={name}
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      className={`flex w-full items-start gap-2.5 rounded-[12px] border px-2.5 py-2 text-start transition-colors ${
        chosen
          ? 'border-accent bg-surface-card shadow-sm'
          : 'border-edge-faint bg-surface-secondary hover:border-edge hover:bg-surface-card'
      }`}
    >
      <VariantMark variant={way} chosen={chosen} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex min-w-0 items-center gap-2">
          <bdi className="min-w-0 flex-1 truncate text-body font-semibold leading-tight text-content">{name}</bdi>
          {grades && grades.highest !== null && (
            <SacStepChip step={grades.highest} uncertain={grades.unknownShare >= 0.5} />
          )}
          {/* Ways of a ride or a run may differ by profile: each says its own. */}
          {entry.card.routingProfile && <TourGrade card={entry.card} />}
        </span>
        <WayFigures way={way} unit={unit} />
        {!chosen && <WayDelta way={way} chosen={chosenWay} letter={chosenLetter} unit={unit} />}
      </span>
    </button>
  );
}

/** The ways of one answer with the chosen one known: the band, the choices, then the chosen way's body. */
function WaysCard({
  entries,
  chosen,
  chosenIndex,
  blockKey,
}: {
  entries: readonly RouteEntry[];
  chosen: RouteEntry;
  chosenIndex: number;
  blockKey: string;
}) {
  const { t } = useTranslation();
  const { tripId, variant, density } = useAssistantView();
  const unit = useSettingsStore((s) => s.settings.distance_unit ?? 'metric');
  const pick = useAssistantStore((s) => s.pick);
  const hover = useLineHover();
  const all = useMemo(() => entries.map((entry) => entry.card), [entries]);
  const route = useTourRouteCard(chosen.toolCallId, chosen.card, all);
  const chosenKey = WAY_KEYS[chosenIndex] ?? 'a';

  const compare = useMemo(
    () =>
      entries.flatMap((entry, index) => {
        const samples = profileSamples(entry.card);
        if (index === chosenIndex || samples.length < 2) return [];
        return [{ key: entry.toolCallId, samples, color: variantPaintCss(WAY_KEYS[index] ?? 'a') }];
      }),
    [entries, chosenIndex]
  );

  const chosenWay = legVariantOf(chosen.card, chosenKey);
  // Side by side where the window is roomy; on the phone the ways stay rows, so a finger scrubs the profile freely.
  let columns = '';
  if (density === 'roomy' && variant !== 'fullscreen') columns = entries.length >= 3 ? 'grid-cols-3' : 'grid-cols-2';
  const title = t('assistant.card.tour.ways', { count: entries.length });
  const card: Route = chosen.card;
  return (
    <div {...route.handlers} className={`rounded-[16px] ${route.litFromMap ? 'ring-1 ring-accent' : ''}`}>
      <CardFrame label={title}>
        <CardHeader
          icon={RouteIcon}
          tone="info"
          eyebrow={t(TOUR_TYPE_WORDS[card.activity].labelKey)}
          title={routeName(card, t)}
          meta={title}
        />
        <CardSection label={t('assistant.card.tour.waysPick')}>
          <div role="radiogroup" aria-label={title} className={`grid gap-1.5 ${columns}`}>
            {entries.map((entry, index) => (
              <WayOption
                key={entry.toolCallId}
                entry={entry}
                index={index}
                chosen={index === chosenIndex}
                chosenWay={chosenWay}
                chosenLetter={chosenKey.toUpperCase()}
                unit={unit}
                onSelect={() => pick(tripId, blockKey, entry.toolCallId)}
                onHover={(on) => hover(entry.toolCallId, on)}
              />
            ))}
          </div>
        </CardSection>
        <div className="mt-3">
          <TourRouteBody
            toolCallId={chosen.toolCallId}
            card={chosen.card}
            route={route}
            color={variantPaintCss(chosenKey)}
            compare={compare}
            letter={chosenKey.toUpperCase()}
          />
        </div>
      </CardFrame>
    </div>
  );
}

/**
 * Two or three ways of one route an answer proposed, as the planner offers a
 * section's ways: a band naming the route, each way a choice with its letter
 * in the colour it is drawn in, its name and hardest grade, its figures and
 * how it differs from the chosen one; one profile holds them all, the chosen
 * way filled and the others thin on the same axes; under it the chosen way's
 * figures, stops, day and warnings, and "Plan way B". A choice is kept per
 * answer, and pointing at a way lights its line on the map.
 */
export default function TourWays({ entries }: { entries: readonly RouteEntry[] }) {
  const { tripId } = useAssistantView();
  const blockKey = `tour:${entries[0]?.toolCallId ?? ''}`;
  const picked = useAssistantStore((s) => chatOf(s, tripId).picks[blockKey] ?? null);
  const index = entries.findIndex((entry) => entry.toolCallId === picked);
  const chosenIndex = index < 0 ? 0 : index;
  const chosen = entries[chosenIndex];
  if (!chosen) return null;
  return <WaysCard entries={entries} chosen={chosen} chosenIndex={chosenIndex} blockKey={blockKey} />;
}
