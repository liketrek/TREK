import { Info } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { useTourRouteHighlightStore } from '../../../store/tourRouteHighlightStore';
import { formatDistance } from '../../../utils/units';
import { fs } from '../../shared/DialogShell';
import { ReadStatusNotice } from '../ReadStatusNotice';
import { InfoDot } from '../tourParts';
import { bikePaintCss, surfacePaintKey, type BikePaintKey } from './bikePaint';
import {
  percent,
  sharesBy,
  stretchesOf,
  type ClassShare,
  type RouteWayEdge,
  type RouteWays,
  type SurfaceClass,
  type WayClass,
} from './routeWays';
import type { RouteWaysState } from './useRouteWays';

/**
 * BIK-01 to BIK-05, RUN-02: the pieces a card about what a route runs on is
 * built from, shared by the bike tour's card and the run's: a class's share
 * as a bar and as rows that point at its stretches on the map, the surfaces
 * and kinds of way, and how the reading went.
 */

interface ShareRowProps<C extends string> {
  id: string;
  row: ClassShare<C>;
  label: string;
  paint: BikePaintKey;
  /** A dot in the class's colour; a kind of way has none. */
  dot: boolean;
  ways: RouteWays;
  inClass: (edge: RouteWayEdge) => boolean;
}

/**
 * One class of the route: its share and length, and a switch that points at
 * its stretches on the map. Pressed again, or another row pressed, it lets go.
 */
function ShareRow<C extends string>({ id, row, label, paint, dot, ways, inClass }: ShareRowProps<C>) {
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const shown = useTourRouteHighlightStore((state) => state.highlight?.id === id);
  const toggle = () =>
    useTourRouteHighlightStore.getState().show(shown ? null : { id, lines: stretchesOf(ways, inClass), paint });
  return (
    <li>
      <button
        type="button"
        aria-pressed={shown}
        data-testid={`route-ways-row-${id}`}
        onClick={toggle}
        className={`flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-1 text-start hover:bg-surface-tertiary ${shown ? 'bg-surface-tertiary' : ''}`}
      >
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 flex-none rounded-full ${dot ? '' : 'border border-edge'}`}
          style={dot ? { background: bikePaintCss(paint) } : undefined}
        />
        <span className="min-w-0 flex-1 truncate text-content" style={fs(12, 'body')}>
          {label}
        </span>
        <span className="flex-none font-geist tabular-nums text-content-faint" style={fs(11)}>
          {formatDistance(row.lengthM / 1000, unit)}
        </span>
        <span className="w-10 flex-none text-end font-geist tabular-nums text-content-secondary" style={fs(11)}>
          {percent(row.share)}
        </span>
      </button>
    </li>
  );
}

/**
 * The classes of the route as rows, the largest first. With `paintOf` each
 * row has a dot in its class's colour and points at its stretches in it; a
 * kind of way has no colour and is pointed at in the accent.
 */
export function ShareList<C extends string>({
  ways,
  rows,
  idPrefix,
  classOf,
  labelOf,
  paintOf,
}: {
  ways: RouteWays;
  rows: ClassShare<C>[];
  idPrefix: string;
  classOf: (edge: RouteWayEdge) => C;
  labelOf: (key: C) => string;
  paintOf?: (key: C) => BikePaintKey;
}) {
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {rows.map((row) => (
        <ShareRow
          key={row.key}
          id={`${idPrefix}-${row.key}`}
          row={row}
          label={labelOf(row.key)}
          paint={paintOf ? paintOf(row.key) : 'way'}
          dot={!!paintOf}
          ways={ways}
          inClass={(edge) => classOf(edge) === row.key}
        />
      ))}
    </ul>
  );
}

/** The shares as one bar, in the classes' colours, so the mix reads at a glance. */
export function ShareBar<C extends string>({
  rows,
  paintOf,
}: {
  rows: ClassShare<C>[];
  paintOf: (key: C) => BikePaintKey;
}) {
  return (
    <span aria-hidden="true" className="flex h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
      {rows.map((row) => (
        <span
          key={row.key}
          className="h-full"
          style={{ width: `${row.share * 100}%`, background: bikePaintCss(paintOf(row.key)) }}
        />
      ))}
    </span>
  );
}

/** A labelled part of the card; `info` puts what the part means behind a dot rather than in a line of its own. */
export function WaysSection({
  label,
  info,
  children,
}: {
  label: string;
  info?: { label: string; description: string };
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="flex min-h-5 min-w-0 items-center gap-1">
        <span
          className="min-w-0 truncate font-geist font-bold uppercase tracking-[.08em] text-content-faint"
          style={fs(9.5, 'caption')}
        >
          {label}
        </span>
        {info && <InfoDot label={info.label} description={info.description} />}
      </span>
      {children}
    </div>
  );
}

const surfaceOf = (edge: RouteWayEdge) => edge.surface;
const wayClassOf = (edge: RouteWayEdge) => edge.way;

/** The surfaces under the route, the unknown named as such. */
export function SurfaceSection({ ways }: { ways: RouteWays }) {
  const { t } = useTranslation();
  const rows = useMemo(() => sharesBy<SurfaceClass>(ways, surfaceOf), [ways]);
  return (
    <WaysSection label={t('tours.bike.ways.surface')}>
      <ShareBar rows={rows} paintOf={surfacePaintKey} />
      <ShareList
        ways={ways}
        rows={rows}
        idPrefix="surface"
        classOf={surfaceOf}
        labelOf={(key) => t(`tours.bike.ways.surface.${key}`)}
        paintOf={surfacePaintKey}
      />
    </WaysSection>
  );
}

/** The kinds of way the route takes. */
export function WaySection({ ways }: { ways: RouteWays }) {
  const { t } = useTranslation();
  const rows = useMemo(() => sharesBy<WayClass>(ways, wayClassOf), [ways]);
  return (
    <WaysSection label={t('tours.bike.ways.way')}>
      <ShareList
        ways={ways}
        rows={rows}
        idPrefix="way"
        classOf={wayClassOf}
        labelOf={(key) => t(`tours.bike.ways.way.${key}`)}
      />
    </WaysSection>
  );
}

/** How reading the ways went while there are none to show: on its way, offline, or failed with a way to ask again. */
export function RouteWaysProgress({ state }: { state: Pick<RouteWaysState, 'status'> & { retry: () => void } }) {
  const { t } = useTranslation();
  return (
    <ReadStatusNotice
      status={state.status}
      messages={{
        loading: t('tours.bike.ways.loading'),
        offline: t('tours.bike.ways.offline'),
        failed: t('tours.bike.ways.failed'),
      }}
      onRetry={state.retry}
    />
  );
}

/** Where what the card shows comes from, and that a gap in it is unknown, not fine. */
export function RouteWaysSource() {
  const { t } = useTranslation();
  return (
    <span className="inline-flex gap-1.5 text-content-faint" style={fs(11, 'body')}>
      <Info size={12} strokeWidth={2} className="mt-0.5 flex-none" />
      {t('tours.bike.ways.source')}
    </span>
  );
}
