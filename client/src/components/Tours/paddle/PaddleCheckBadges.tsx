import type {
  ObstacleDecision,
  ObstacleEntryStatus,
  PaddleCheck,
  PaddleCheckData,
  PaddleObstacleKind,
  TourObstacleEntry,
} from '@trek/shared';
import { RotateCcw } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { TourDayRowPill } from '../TourDayRowFacts';
import { FigureBadge } from './FigureBadge';
import { PaddleGlyph } from './PaddleGlyph';
import { checkDataWord, formatCheckDate, paddleCheckFact } from './paddleCheckModel';
import { OBSTACLE_GLYPH } from './paddleGlyphPaths';
import { KNOWN_ACCESS_VALUES } from './paddleObstacleModel';
import { paddleKindCss } from './paddlePaint';

type Translate = (key: string, params?: Record<string, string | number>) => string;

const ACCESS_KEYS: readonly string[] = KNOWN_ACCESS_VALUES;

/** Why data that falls short of the route asks for a look of one's own, as the obstacle notice says it. */
const COVERAGE_INFO: Record<Exclude<PaddleCheckData, 'covered'>, (t: Translate, date: string) => string> = {
  partial: (t, date) => t('tours.paddle.obstacles.partial', { date }),
  none: (t) => t('tours.paddle.obstacles.none'),
  limited: (t) => t('tours.paddle.obstacles.truncated'),
  unavailable: (t) => t('tours.paddle.obstacles.error'),
};

/** How a status reads beside the decision it is about. */
interface StatusLook {
  /** The status in words; null where the decision alone says it. */
  word: (t: Translate, decision: ObstacleDecision | null) => string | null;
  info?: (t: Translate) => string;
  /** A decision kept about an object the data no longer holds steps back. */
  dimmed?: boolean;
}

const GONE: StatusLook = {
  word: (t) => t('tours.paddle.check.status.gone'),
  info: (t) => t('tours.paddle.check.goneInfo'),
};

/** Every status but review, which gets a badge for each thing that changed. */
const STATUS_LOOK: Record<Exclude<ObstacleEntryStatus, 'review'>, StatusLook> = {
  open: { word: (t) => t('tours.paddle.check.status.open') },
  decided: { word: () => null },
  // A choice whose plan is missing: no portage drawn yet, or the route still passes.
  todo: {
    word: (t, decision) =>
      t(
        decision === 'reroute' ? 'tours.paddle.check.status.reroutePending' : 'tours.paddle.check.status.portageMissing'
      ),
  },
  gone: GONE,
  kept: { ...GONE, dimmed: true },
  off_route: { word: (t) => t('tours.paddle.check.status.offRoute') },
  unknown: { word: (t) => t('tours.paddle.check.status.unknown') },
};

/**
 * The check bench of a paddle tour as one pill (PAD-09), in the badge the day
 * plan gives a tour's facts: the first rule that applies gives its value, and
 * its tooltip names the whole bench and that it is no clearance.
 */
export function PaddleCheckPill({ check }: { check: PaddleCheck }) {
  const { t } = useTranslation();
  const { icon, value, label } = paddleCheckFact(check, t);
  return <TourDayRowPill icon={icon} value={value} label={label} testId="plan-tour-paddle-check" />;
}

/**
 * How far the obstacle data of a bench reaches and how current it is: a badge
 * for data that does not cover the route, the date OpenStreetMap is current
 * to, and when TREK fetched it, which is never a check on site.
 */
export function PaddleCheckDataLine({ check }: { check: PaddleCheck }) {
  const { t, locale } = useTranslation();
  const word = checkDataWord(check.data, t);
  const asOf = check.data_as_of ? formatCheckDate(check.data_as_of, locale) : null;
  const coverage =
    check.data === 'covered' ? null : COVERAGE_INFO[check.data](t, asOf ?? t('tours.paddle.obstacles.dateUnknown'));
  return (
    <div data-testid="paddle-check-data" className="flex flex-wrap items-center gap-1">
      {word && coverage && (
        <FigureBadge
          testId="paddle-check-coverage"
          label={t('tours.paddle.check.dataLabel')}
          value={word}
          info={coverage}
        />
      )}
      <FigureBadge
        testId="paddle-check-as-of"
        label={t('tours.paddle.check.sourceDate')}
        value={asOf ?? t('tours.paddle.check.unknown')}
        info={
          asOf ? t('tours.paddle.obstacleCard.source', { date: asOf }) : t('tours.paddle.obstacleCard.sourceUndated')
        }
      />
      {check.read_at ? (
        <FigureBadge
          testId="paddle-check-read"
          label={t('tours.paddle.check.readDate')}
          value={formatCheckDate(check.read_at, locale)}
        />
      ) : null}
    </div>
  );
}

/**
 * The symbol of a checklist row: the kind's glyph in a ring of its colour,
 * the ring dashed for an object only near the route. The paddler's own
 * portages and locks take the portage and lock kinds.
 */
export function ChecklistGlyph({
  kind,
  dashed = false,
  size = 24,
}: {
  kind: PaddleObstacleKind;
  /** An object only near the route: how it stands to it is uncertain. */
  dashed?: boolean;
  size?: number;
}) {
  const color = paddleKindCss(kind);
  return (
    <span
      data-testid="paddle-check-glyph"
      aria-hidden="true"
      className={`grid flex-none place-items-center rounded-full border-2 bg-surface-card ${dashed ? 'border-dashed' : 'border-solid'}`}
      style={{ width: size, height: size, color, borderColor: color }}
    >
      <PaddleGlyph kind={OBSTACLE_GLYPH[kind]} size={Math.round(size * 0.55)} strokeWidth={2.3} />
    </span>
  );
}

/** An entry to check again: one badge for each thing that changed since the decision. */
function ReviewBadges({ changed }: { changed: TourObstacleEntry['changed'] }) {
  const { t } = useTranslation();
  const review = t('tours.paddle.check.status.review');
  const icon = <RotateCcw size={10} strokeWidth={2.4} aria-hidden="true" className="flex-none" />;
  if (changed.length === 0) return <FigureBadge testId="paddle-check-status" value={review} icon={icon} />;
  return (
    <>
      {changed.map((reason) => (
        <FigureBadge
          key={reason}
          testId="paddle-check-status"
          label={review}
          value={t(`tours.paddle.check.changed.${reason}`)}
          icon={icon}
        />
      ))}
    </>
  );
}

/**
 * Where a checklist entry stands, as its row and its decision panel show it:
 * the decision with what still stands in its way, a badge for each change an
 * entry to check again has seen, and a decision kept about an object the data
 * no longer holds dimmed. The badges come without a box of their own, so they
 * flow on in the line they are put into.
 */
export function ObstacleStatusBadges({ entry }: { entry: TourObstacleEntry }) {
  const { t } = useTranslation();
  if (entry.status === 'review') return <ReviewBadges changed={entry.changed} />;
  const look = STATUS_LOOK[entry.status];
  const decision = entry.decision?.decision ?? null;
  const chosen = decision ? t(`tours.paddle.check.decision.${decision}`) : undefined;
  const word = look.word(t, decision);
  const value = word ?? chosen;
  if (!value) return null;
  const badge = (
    <FigureBadge testId="paddle-check-status" label={word ? chosen : undefined} value={value} info={look.info?.(t)} />
  );
  return look.dimmed ? <span className="inline-flex opacity-60">{badge}</span> : badge;
}

/** A rule's value in the user's words where TREK knows it, as the tags write it where it does not. */
function accessValueOf(value: string, t: Translate): string {
  return ACCESS_KEYS.includes(value) ? t(`tours.paddle.obstacleCard.accessValue.${value}`) : value;
}

/**
 * The paddling rule an obstacle's tags give, on its row only when it forbids,
 * makes the ground private or carries a condition. A rule that forbids or
 * makes it private takes the warning tone, as on the map card; a condition
 * without a value of its own is shown as written.
 */
export function ObstacleAccessBadge({ access }: { access: TourObstacleEntry['access'] }) {
  const { t } = useTranslation();
  if (!access.forbidden && !access.private && !access.condition) return null;
  const condition = t('tours.paddle.obstacleCard.condition');
  const { value } = access;
  return (
    <FigureBadge
      testId="paddle-check-access"
      label={value === null ? condition : t(`tours.paddle.obstacleCard.access.${access.source ?? 'access'}`)}
      value={value === null ? (access.condition ?? '') : accessValueOf(value, t)}
      info={access.condition ? `${condition}: ${access.condition}` : undefined}
      tone={access.forbidden || access.private ? 'warning' : 'neutral'}
    />
  );
}
