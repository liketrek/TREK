import { Info, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { formatDistance } from '../../../utils/units';
import { SoftPill } from '../../Planner/planParts';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { bikePaintCss } from '../bike/bikePaint';
import { FigureBadge } from '../paddle/FigureBadge';
import { CardAction } from '../tourParts';
import { facetPaint, isUnknownClass, type FacetRow } from './hikeFacets';
import { HIKE_FACETS, type HikeFacet } from './hikeFacetSpecs';
import { hikePaintCss } from './hikePaint';
import { sacStepOfClass } from './sacGrades';
import { GradeChip } from './SacStepChip';
import type { HikeWays } from './useHikeWays';

const percent = (share: number) => `${Math.round(share * 100)} %`;
const stepName = (step: number) => `T${step}`;

const sacKey = (name: string) => `tours.hike.sac.${name}`;
const surfaceKey = (name: string) => `tours.hike.surface.${name}`;
const wayKey = (name: string) => `tours.hike.way.${name}`;
const sharedKey = (name: string) => `tours.hike.ways.${name}`;

/** A facet's own texts; a way not matched or not asked reads the same in every facet. */
const FACET_KEY: Readonly<Record<HikeFacet, (name: string) => string>> = {
  sac: sacKey,
  surface: surfaceKey,
  way: wayKey,
};

/** The OpenStreetMap key a facet's values are written under, named in the tooltips. */
const FACET_TAG: Readonly<Record<HikeFacet, string>> = { sac: 'sac_scale', surface: 'surface', way: 'highway' };

function labelKey(facet: HikeFacet, key: string): string {
  return key === 'unmatched' || key === 'unasked' ? sharedKey(key) : FACET_KEY[facet](key);
}

/** The colour a class is drawn in on the map, as a CSS variable: its own, the grey of the unknown otherwise. */
function paintOf(facet: HikeFacet, key: string): string {
  const paint = facetPaint(HIKE_FACETS[facet], key);
  return paint === 'unknown' ? bikePaintCss('unknown') : hikePaintCss(paint);
}

/** What OpenStreetMap wrote for a row, as `key=value`, each once. */
const writtenTags = (facet: HikeFacet, row: FacetRow) => row.tags.map((tag) => `${FACET_TAG[facet]}=${tag}`).join(', ');

/**
 * A class as a small white chip: a dot in its map colour, with the step of an
 * SAC grade, or a question mark for the unknown.
 */
function ClassChip({ facet, row }: { facet: HikeFacet; row: FacetRow }) {
  const step = sacStepOfClass(row.key);
  const unknown = isUnknownClass(row.key);
  const text = step !== null ? stepName(step) : unknown ? '?' : null;
  return <GradeChip color={paintOf(facet, row.key)} text={text} faint={unknown} />;
}

/** Where a row's class comes from, said in its tooltip: what OpenStreetMap wrote, or why it is unknown. */
function useRowSource(facet: HikeFacet, row: FacetRow): string {
  const { t } = useTranslation();
  const step = sacStepOfClass(row.key);
  if (step !== null) return t('tours.hike.sac.stepTip', { step: stepName(step), tag: row.tags[0] ?? '' });
  if (row.key === 'untagged') return t(FACET_KEY[facet]('untaggedTip'));
  if (row.key === 'unmatched') return t('tours.hike.ways.unmatchedTip');
  if (row.key === 'unasked') return t('tours.hike.ways.unaskedTip');
  if (row.key === 'unclear' && facet === 'sac') return t('tours.hike.sac.unclearTip', { tags: row.tags.join(', ') });
  if (row.key === 'unclear') return t('tours.hike.ways.unclearTip', { tags: writtenTags(facet, row) });
  return t('tours.hike.ways.recordedTip', { tags: writtenTags(facet, row) });
}

/**
 * One class along the hike: its chip, its name, how far and how much of the
 * route it covers. Pressed, the map draws its stretches alone; pressed again,
 * every class again.
 */
function ClassRow({ row, ways, limit }: { row: FacetRow; ways: HikeWays; limit: number | null }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const source = useRowSource(ways.facet, row);
  const step = sacStepOfClass(row.key);
  const pressed = ways.focus === row.key;
  return (
    <li>
      <Tooltip label={source} disabled={!source} placement="top">
        <button
          type="button"
          aria-pressed={pressed}
          data-testid={`${ways.facet}-row-${row.key}`}
          onClick={() => ways.focusOn(row.key)}
          className={`flex w-full min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 text-start transition-colors hover:bg-surface-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${pressed ? 'bg-surface-tertiary' : ''}`}
        >
          <ClassChip facet={ways.facet} row={row} />
          <span
            className={`min-w-0 flex-1 truncate ${isUnknownClass(row.key) ? 'text-content-muted' : 'text-content'}`}
            style={fs(12, 'body')}
          >
            {t(labelKey(ways.facet, row.key))}
          </span>
          {step !== null && limit !== null && step > limit && (
            <SoftPill tone="warning">{t('tours.hike.sac.aboveLimit')}</SoftPill>
          )}
          <span className="flex-none font-geist tabular-nums text-content-faint" style={fs(11)}>
            {formatDistance(row.lengthM / 1000, unit)}
          </span>
          <span className="w-10 flex-none text-end font-geist tabular-nums text-content-secondary" style={fs(11)}>
            {percent(row.share)}
          </span>
        </button>
      </Tooltip>
    </li>
  );
}

/** The classes as one bar along the route's length, in the map's colours, so the mix reads at a glance. */
function ClassBar({ ways }: { ways: HikeWays }) {
  return (
    <span aria-hidden="true" className="flex h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
      {ways.rows.map((row) => (
        <span
          key={row.key}
          className="h-full"
          style={{ width: `${row.share * 100}%`, background: paintOf(ways.facet, row.key) }}
        />
      ))}
    </span>
  );
}

/**
 * What is known at a glance: how much of the route the facet knows, and the
 * class covering the most of it, or for the SAC grades the highest step and,
 * apart from it and marked as a setting, the routing limit the hike was
 * planned with, which says nothing about the ways themselves.
 */
function FacetSummary({ ways, limit }: { ways: HikeWays; limit: number | null }) {
  const { t } = useTranslation();
  const { facet } = ways;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <FigureBadge
        label={t('tours.hike.ways.known')}
        value={percent(ways.knownShare)}
        info={t(FACET_KEY[facet]('knownTip'))}
        testId={`${facet}-known`}
      />
      {facet !== 'sac' && ways.mostly && (
        <FigureBadge
          label={t('tours.hike.ways.mostly')}
          value={t(labelKey(facet, ways.mostly.key))}
          testId={`${facet}-mostly`}
        />
      )}
      {ways.highest !== null && (
        <FigureBadge label={t('tours.hike.sac.highest')} value={stepName(ways.highest)} testId="sac-highest" />
      )}
      {facet === 'sac' && limit !== null && (
        <FigureBadge
          label={t('tours.hike.sac.routingLimit')}
          value={stepName(limit)}
          icon={<SlidersHorizontal size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}
          info={t('tours.hike.sac.routingLimitTip')}
          testId="sac-routing-limit"
        />
      )}
    </div>
  );
}

/**
 * MAP-03 and MAP-04: one facet of the hike laid out: the summary, the mix as
 * a bar, the known classes, the unknown apart under their own heading, and
 * where the values come from.
 */
export function HikeWaysList({ ways, limit }: { ways: HikeWays; limit: number | null }) {
  const { t } = useTranslation();
  const known = ways.rows.filter((row) => !isUnknownClass(row.key));
  const unknown = ways.rows.filter((row) => isUnknownClass(row.key));
  return (
    <>
      <FacetSummary ways={ways} limit={limit} />
      <ClassBar ways={ways} />
      {known.length > 0 && (
        <ul className="m-0 flex list-none flex-col p-0">
          {known.map((row) => (
            <ClassRow key={row.key} row={row} ways={ways} limit={limit} />
          ))}
        </ul>
      )}
      {unknown.length > 0 && (
        <div className="flex min-w-0 flex-col gap-1">
          <span
            className="font-geist font-bold uppercase tracking-[.08em] text-content-faint"
            style={fs(9.5, 'caption')}
          >
            {t('tours.hike.ways.unknown')}
          </span>
          <ul className="m-0 flex list-none flex-col p-0">
            {unknown.map((row) => (
              <ClassRow key={row.key} row={row} ways={ways} limit={limit} />
            ))}
          </ul>
          {/* Some ways could not be asked this time: they may be asked again without leaving the card. */}
          {unknown.some((row) => row.key === 'unasked') && (
            <span className="flex">
              <CardAction icon={<RefreshCw size={12} strokeWidth={2} />} onClick={ways.retry}>
                {t('common.errorRetry')}
              </CardAction>
            </span>
          )}
        </div>
      )}
      <span className="inline-flex gap-1.5 text-content-faint" style={fs(11, 'body')}>
        <Info size={12} strokeWidth={2} className="mt-0.5 flex-none" />
        {t(FACET_KEY[ways.facet]('source'))}
      </span>
    </>
  );
}
