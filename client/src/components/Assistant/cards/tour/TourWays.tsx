import { useMemo } from 'react';

import { useTranslation } from '../../../../i18n';
import { chatOf, useAssistantStore } from '../../../../store/assistantStore';
import { useSettingsStore } from '../../../../store/settingsStore';
import { SacStepChip } from '../../../Tours/hike/SacStepChip';
import { variantPaintCss } from '../../../Tours/planner/legVariantPaint';
import { VariantDelta } from '../../../Tours/planner/LegVariantsCard';
import { VariantFigures, WayChoice } from '../../../Tours/planner/mapCardParts';
import { useAssistantView } from '../../assistantViewContext';
import CardFrame from '../parts/CardFrame';
import { TourRouteBody } from './TourRouteCard';
import { legVariantOf, profileSamples, type RouteEntry, WAY_KEYS } from './tourRouteModel';
import { useLineHover, useTourRouteCard } from './useTourRouteCard';

/** The ways of one answer with the chosen one known: its choices, then the chosen way's body. */
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

  const current = legVariantOf(chosen.card, chosenKey);
  // Side by side where the window is roomy; on the phone the ways stay rows, so a finger scrubs the profile freely.
  let columns = '';
  if (density === 'roomy' && variant !== 'fullscreen') columns = entries.length >= 3 ? 'grid-cols-3' : 'grid-cols-2';
  const title = t('assistant.card.tour.ways', { count: entries.length });
  return (
    <div {...route.handlers} className={`rounded-xl ${route.litFromMap ? 'ring-1 ring-accent' : ''}`}>
      <CardFrame label={title}>
        <p className="m-0 text-caption text-content-muted">{title}</p>
        <div role="radiogroup" aria-label={title} className={`mt-1.5 grid gap-1.5 ${columns}`}>
          {entries.map((entry, index) => {
            const key = WAY_KEYS[index] ?? 'a';
            const letter = key.toUpperCase();
            const way = legVariantOf(entry.card, key);
            const grades = entry.card.grades;
            return (
              <WayChoice
                key={entry.toolCallId}
                way={way}
                name={entry.card.label ?? t('tours.variants.option', { letter })}
                chosen={index === chosenIndex}
                aside={
                  <>
                    {index !== chosenIndex && (
                      <VariantDelta
                        variant={way}
                        current={current}
                        unit={unit}
                        t={t}
                        hint={t('assistant.card.tour.deltaTo', { letter: chosenKey.toUpperCase() })}
                      />
                    )}
                    {grades && <SacStepChip step={grades.highest} uncertain={grades.unknownShare >= 0.5} />}
                  </>
                }
                onSelect={() => pick(tripId, blockKey, entry.toolCallId)}
                onHover={(on) => hover(entry.toolCallId, on)}
              >
                <VariantFigures variant={way} unit={unit} t={t} />
              </WayChoice>
            );
          })}
        </div>
        <TourRouteBody
          toolCallId={chosen.toolCallId}
          card={chosen.card}
          route={route}
          color={variantPaintCss(chosenKey)}
          compare={compare}
          letter={chosenKey.toUpperCase()}
        />
      </CardFrame>
    </div>
  );
}

/**
 * Two or three ways of one route an answer proposed, as the planner offers a
 * section's ways: each a choice with its letter in the colour it is drawn in,
 * its own words, how it differs from the chosen one and its hardest grade,
 * its figures below. One profile holds them all, the chosen way filled and
 * the others thin on the same axes; under it the chosen way's stops, day and
 * warnings, and "Plan way B". A choice is kept per answer, and pointing at a
 * way lights its line on the map.
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
