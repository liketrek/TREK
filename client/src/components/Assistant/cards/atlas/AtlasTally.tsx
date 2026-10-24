import { ArrowRight, Check, Globe2, MapPinned, Star } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { SoftPill } from '../../../Planner/planParts';
import type { ChangeItem } from '../../assistantParts';
import { useCardFormat } from '../parts/useCardFormat';
import { signedDelta, tallyLines, type TallyLine } from './atlasCardModel';
import { useAtlasCard } from './useAtlasCard';

/**
 * The counters over a run of atlas changes, the way the Atlas page puts its
 * numbers first: countries visited, the regions of a country, the bucket list,
 * each from what it is to what it will be. Ticking a row off moves the number
 * at once; while the changes are applied the new number shimmers, once they
 * are, it is the exact count the writes answered.
 */

const ICONS = { countries: Globe2, regions: MapPinned, wishes: Star } as const;

function TallyRow({ line }: { line: TallyLine }) {
  const { t } = useTranslation();
  const { countryName, locale } = useAtlasCard();
  const Icon = ICONS[line.what];
  const label =
    line.what === 'countries'
      ? t('assistant.card.atlas.tallyCountries')
      : line.what === 'regions'
        ? t('assistant.card.atlas.tallyRegions', { country: countryName(line.country ?? '') })
        : t('assistant.card.atlas.tallyWishes');
  const delta = line.after - line.before;
  const format = useCardFormat();
  return (
    <div className="flex items-center gap-2 rounded-lg bg-surface-secondary px-2.5 py-1.5">
      <Icon size={14} strokeWidth={2.1} aria-hidden="true" className="flex-none text-content-muted" />
      <span className="min-w-0 flex-1 truncate text-caption text-content-secondary">{label}</span>
      <span className="flex-none text-caption tabular-nums text-content-faint">{format.count(line.before)}</span>
      <ArrowRight size={12} aria-hidden="true" className="flex-none text-content-faint rtl:-scale-x-100" />
      <span
        className={`flex-none text-title font-semibold tabular-nums leading-none text-content ${
          line.phase === 'applying' ? 'trek-assistant-shimmer' : ''
        }`}
      >
        {format.count(line.after)}
      </span>
      {line.phase === 'applied' ? (
        <Check size={14} strokeWidth={2.4} aria-hidden="true" className="flex-none text-success" />
      ) : (
        delta !== 0 && <SoftPill tone={delta > 0 ? 'success' : 'danger'}>{signedDelta(delta, locale)}</SoftPill>
      )}
    </div>
  );
}

/** Heads a run of atlas changes with the counters they move; nothing under the run. */
export default function AtlasTallyGroup({
  items,
  excluded,
  place,
}: {
  items: readonly ChangeItem[];
  excluded: ReadonlySet<string>;
  place: 'head' | 'foot';
}) {
  if (place !== 'head') return null;
  const lines = tallyLines(items, excluded);
  if (lines.length === 0) return null;
  return (
    <div className="mb-1 flex flex-col gap-1">
      {lines.map((line) => (
        <TallyRow key={line.key} line={line} />
      ))}
    </div>
  );
}
