import type {
  PaddleAccess,
  PaddleCheck,
  PaddleObstacleKind,
  TourObstacleCheck,
  TourObstacleEntry,
  TourOwnEntry,
} from '@trek/shared';
import { AlertTriangle, CloudOff, LifeBuoy, ListChecks, Loader2, PencilLine, Save, WifiOff } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { formatDistance } from '../../../utils/units';
import { SoftPill } from '../../Planner/planParts';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { FoldButton, RailCard, TourNotice } from '../tourParts';
import { FigureBadge } from './FigureBadge';
import { ObstacleEntryDialog } from './ObstacleEntryDialog';
import {
  ChecklistGlyph,
  ObstacleAccessBadge,
  ObstacleStatusBadges,
  PaddleCheckDataLine,
  PaddleCheckPill,
} from './PaddleCheckBadges';
import { checklistRows, formatCheckDate, type ChecklistRow } from './paddleCheckModel';
import { PaddleObstacleNotice } from './PaddleObstacleNotice';
import type { PaddleChecklist, PaddleChecklistStatus } from './usePaddleChecklist';

type Translate = ReturnType<typeof useTranslation>['t'];

/** What the card says above the rows: the tour's own state, unsaved changes, or an answer from the cache. */
type CheckNotice = Exclude<PaddleChecklistStatus, 'off' | 'ready'> | 'dirty' | 'stale';

const ICON = { size: 13, strokeWidth: 2 } as const;

/** Each state's sentence and icon; while the list loads it is a status with a spinner. */
const NOTICES: Record<CheckNotice, { textKey: string; icon: ReactNode; role?: 'status' }> = {
  new: { textKey: 'tours.paddle.check.saveFirst', icon: <Save {...ICON} /> },
  loading: {
    textKey: 'tours.paddle.obstacles.loading',
    icon: <Loader2 {...ICON} className="animate-spin" />,
    role: 'status',
  },
  'offline-empty': { textKey: 'tours.paddle.check.offlineEmpty', icon: <WifiOff {...ICON} /> },
  error: { textKey: 'tours.paddle.obstacles.error', icon: <AlertTriangle {...ICON} /> },
  dirty: { textKey: 'tours.paddle.check.unsaved', icon: <PencilLine {...ICON} /> },
  stale: { textKey: 'tours.paddle.check.stale', icon: <CloudOff {...ICON} /> },
};

/** A carrying way the data forbids (`access=no` or `portage:access=no`), as the access rule it runs into. */
const FORBIDDEN_WAY: PaddleAccess = { value: 'no', source: 'access', condition: null, forbidden: true, private: false };

const ROW =
  'flex w-full items-start gap-2 rounded-[10px] px-1.5 py-1.5 text-start transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';
const ROW_SELECTED = 'bg-surface-hover ring-1 ring-inset ring-accent';

/** The one notice that applies: the tour's state first, then unsaved route changes, then a list from the cache. */
function noticeOf({ status, dirty, stale }: Pick<PaddleChecklist, 'status' | 'dirty' | 'stale'>): CheckNotice | null {
  if (status === 'off') return null;
  if (status !== 'ready') return status;
  if (dirty) return 'dirty';
  return stale ? 'stale' : null;
}

function kindLabel(kind: PaddleObstacleKind, t: Translate): string {
  return t(`tours.paddle.obstacle.kind.${kind}`);
}

/** Metres along the route in the user's distance unit. */
function useDistanceLabel(): (metres: number) => string {
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  return (metres) => formatDistance(metres / 1000, unit);
}

function rowKey(row: ChecklistRow, index: number): string {
  return row.type === 'obstacle' ? row.entry.key : `own:${row.own.kind}:${row.own.from_m}:${index}`;
}

/** The sentence the checklist's state calls for. */
function CheckNoticeLine({ notice, evaluatedAt }: { notice: CheckNotice; evaluatedAt: string | null }) {
  const { t, locale } = useTranslation();
  const { textKey, icon, role } = NOTICES[notice];
  const time = evaluatedAt ? formatCheckDate(evaluatedAt, locale) : '';
  return (
    <TourNotice role={role} icon={icon}>
      {t(textKey, { time })}
    </TourNotice>
  );
}

/** A row of the checklist: one full width button with the glyph, the title and a line of badges that wraps between them. */
function CheckRowButton({
  selected = false,
  dimmed = false,
  onClick,
  glyph,
  title,
  children,
}: {
  selected?: boolean;
  dimmed?: boolean;
  onClick: () => void;
  glyph: ReactNode;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  // An entry picked on the map comes into view in the rail.
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView?.({ block: 'nearest' });
  }, [selected]);
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-current={selected ? 'true' : undefined}
      className={`${ROW} ${selected ? ROW_SELECTED : 'hover:bg-surface-hover'} ${dimmed ? 'opacity-60' : ''}`}
    >
      <span className="flex-none">{glyph}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate font-semibold text-content" style={fs(12.5, 'body')} title={title}>
          {title}
        </span>
        <span className="flex flex-wrap items-center gap-1">{children}</span>
      </span>
    </button>
  );
}

/** The SUP advice at a lock: check a portage rather than lock through. */
function SupLockBadge() {
  const { t } = useTranslation();
  return (
    <SoftPill icon={<LifeBuoy size={10} strokeWidth={2.2} className="flex-none" />}>
      {t('tours.paddle.check.supLock')}
    </SoftPill>
  );
}

/** Marks a row as the paddler's own plan, never a fact from a data source. */
function OwnBadge() {
  const { t } = useTranslation();
  return (
    <Tooltip label={t('tours.paddle.check.ownInfo')}>
      <span className="inline-flex flex-none">
        <SoftPill>{t('tours.paddle.check.own')}</SoftPill>
      </span>
    </Tooltip>
  );
}

/** The obstacles an own portage carries round, each a small glyph its tooltip names. */
function CoveredChips({ keys, entries }: { keys: readonly string[]; entries: readonly TourObstacleEntry[] }) {
  const { t } = useTranslation();
  const covered = keys
    .map((key) => entries.find((entry) => entry.key === key))
    .filter((entry): entry is TourObstacleEntry => entry !== undefined);
  return (
    <>
      {covered.map((entry) => {
        const label = kindLabel(entry.kind, t);
        return (
          <Tooltip key={entry.key} label={label}>
            <span role="img" aria-label={label} className="inline-flex flex-none">
              <ChecklistGlyph kind={entry.kind} size={18} />
            </span>
          </Tooltip>
        );
      })}
    </>
  );
}

/** A carrying way the data records as private or forbidden, in the warning tone the obstacle card gives rules. */
function ConflictBadge({ conflict }: { conflict: NonNullable<TourOwnEntry['conflict']> }) {
  const { t } = useTranslation();
  if (conflict === 'forbidden') return <ObstacleAccessBadge access={FORBIDDEN_WAY} />;
  return <SoftPill tone="warning">{t('tours.paddle.obstacleCard.privateWay')}</SoftPill>;
}

/** One obstacle: what it is, where on the route, and where its decision stands. */
function PaddleCheckRow({
  entry,
  selected,
  onSelect,
}: {
  entry: TourObstacleEntry;
  selected: boolean;
  onSelect: (entry: TourObstacleEntry) => void;
}) {
  const { t } = useTranslation();
  const distance = useDistanceLabel();
  const near = entry.relation === 'near';
  return (
    <CheckRowButton
      selected={selected}
      onClick={() => onSelect(entry)}
      glyph={<ChecklistGlyph kind={entry.kind} dashed={near} />}
      title={entry.name ?? kindLabel(entry.kind, t)}
    >
      {entry.along_m !== null && <SoftPill className="tabular-nums">{distance(entry.along_m)}</SoftPill>}
      {near && <SoftPill>{t('tours.paddle.obstacleCard.near')}</SoftPill>}
      <ObstacleStatusBadges entry={entry} />
      <ObstacleAccessBadge access={entry.access} />
      {entry.advice !== null && <SupLockBadge />}
    </CheckRowButton>
  );
}

/**
 * The paddler's own portage or lock among the obstacles. A portage says how
 * far it carries and what it carries round; a lock the portage carries round
 * is dimmed and says so.
 */
function OwnCheckRow({
  own,
  entries,
  onSelect,
}: {
  own: TourOwnEntry;
  entries: readonly TourObstacleEntry[];
  onSelect: (own: TourOwnEntry) => void;
}) {
  const { t } = useTranslation();
  const distance = useDistanceLabel();
  const portage = own.kind === 'portage';
  const bypassed = !portage && own.bypassed;
  return (
    <CheckRowButton
      dimmed={bypassed}
      onClick={() => onSelect(own)}
      glyph={<ChecklistGlyph kind={own.kind} />}
      title={kindLabel(own.kind, t)}
    >
      <SoftPill className="tabular-nums">{distance(own.from_m)}</SoftPill>
      <OwnBadge />
      {portage && <FigureBadge label={t('tours.paddle.time.carry')} value={distance(own.to_m - own.from_m)} />}
      {portage && <CoveredChips keys={own.covers} entries={entries} />}
      {own.conflict && <ConflictBadge conflict={own.conflict} />}
      {bypassed && <SoftPill>{t('tours.paddle.lockBypassed')}</SoftPill>}
      {own.advice !== null && <SupLockBadge />}
    </CheckRowButton>
  );
}

/** One row along the route: an obstacle picks its entry, an own mark its place on the map. */
function RouteRow({
  row,
  checklist,
  entries,
}: {
  row: ChecklistRow;
  checklist: PaddleChecklist;
  entries: readonly TourObstacleEntry[];
}) {
  if (row.type === 'own') return <OwnCheckRow own={row.own} entries={entries} onSelect={checklist.selectOwn} />;
  return (
    <PaddleCheckRow entry={row.entry} selected={row.entry.key === checklist.selectedKey} onSelect={checklist.select} />
  );
}

/**
 * The decisions the route or the data no longer carries, folded away under
 * their count. A selection among them opens the fold, until the paddler folds
 * it again for that selection.
 */
function EarlierDecisions({
  entries,
  selectedKey,
  onSelect,
}: {
  entries: readonly TourObstacleEntry[];
  selectedKey: string | null;
  onSelect: (entry: TourObstacleEntry) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  const [choice, setChoice] = useState<{ open: boolean; key: string | null }>({ open: false, key: null });
  const holdsSelected = entries.some((entry) => entry.key === selectedKey);
  const expanded = (holdsSelected && choice.key !== selectedKey) || choice.open;
  const label = t('tours.paddle.check.earlier');
  return (
    <div data-testid="paddle-check-earlier" className="border-t border-edge-faint pt-1.5">
      <div className="flex items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate font-semibold text-content-secondary" style={fs(11.5, 'body')}>
          {label}
        </span>
        <SoftPill className="tabular-nums">{entries.length}</SoftPill>
        <FoldButton
          expanded={expanded}
          controls={id}
          label={label}
          onToggle={() => setChoice({ open: !expanded, key: selectedKey })}
        />
      </div>
      <ul id={id} hidden={!expanded} className="-mx-1.5 mt-1 list-none p-0">
        {expanded &&
          entries.map((entry) => (
            <li key={entry.key}>
              <PaddleCheckRow entry={entry} selected={entry.key === selectedKey} onSelect={onSelect} />
            </li>
          ))}
      </ul>
    </div>
  );
}

/** A route without rows: nothing known where the data covers it, no data where there is none; else the data line speaks. */
function EmptyLine({ summary }: { summary: PaddleCheck | null }) {
  const { t, locale } = useTranslation();
  let text: string | null = null;
  if (summary?.data === 'none') text = t('tours.paddle.obstacles.none');
  else if (summary?.data === 'covered') {
    const date = summary.data_as_of
      ? formatCheckDate(summary.data_as_of, locale)
      : t('tours.paddle.obstacles.dateUnknown');
    text = t('tours.paddle.obstacles.coveredEmpty', { date });
  }
  if (!text) return null;
  return (
    <p className="m-0 text-content-muted" style={fs(12, 'body')}>
      {text}
    </p>
  );
}

/** The rows along the route, then the earlier decisions; dimmed, never hidden, while they may not match the route. */
function CheckList({ checklist, check }: { checklist: PaddleChecklist; check: TourObstacleCheck }) {
  const { rows, earlier } = useMemo(() => checklistRows(check), [check]);
  // Dimmed while it may not match the route, and while the list it came from reads again.
  const dimmed = checklist.dirty || checklist.stale || checklist.status === 'loading';
  return (
    <div data-testid="paddle-check-list" className={`flex flex-col gap-1.5 ${dimmed ? 'opacity-60' : ''}`}>
      {rows.length > 0 ? (
        <ul data-testid="paddle-check-rows" className="-mx-1.5 flex list-none flex-col gap-0.5 p-0">
          {rows.map((row, index) => (
            <li key={rowKey(row, index)}>
              <RouteRow row={row} checklist={checklist} entries={check.entries} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyLine summary={checklist.summary} />
      )}
      {earlier.length > 0 && (
        <EarlierDecisions entries={earlier} selectedKey={checklist.selectedKey} onSelect={checklist.select} />
      )}
    </div>
  );
}

/**
 * PAD-06 in the planner rail: the obstacle checklist of the open paddle tour.
 * The obstacles and the paddler's own portages and locks stand in route
 * order, each a row that picks it on the map. One line says what state the
 * list is in; while the route has unsaved changes or the list comes from the
 * cache, the rows stay readable but dimmed. The card closes on the line that
 * a checklist is no safety or legal clearance, and opens an entry the map
 * cannot show in a dialog of its own.
 */
export function PaddleCheckCard({ checklist }: { checklist: PaddleChecklist }) {
  const { t } = useTranslation();
  if (checklist.status === 'off') return null;
  const notice = noticeOf(checklist);
  const { summary, check } = checklist;
  return (
    <>
      <RailCard
        icon={<ListChecks size={14} strokeWidth={2} />}
        title={t('tours.paddle.check.title')}
        foldId="paddle-check"
        aside={summary ? <PaddleCheckPill check={summary} /> : null}
      >
        <div data-testid="paddle-check-card" className="flex flex-col gap-2.5">
          {notice && <CheckNoticeLine notice={notice} evaluatedAt={check?.evaluated_at ?? null} />}
          {notice === 'new' && <PaddleObstacleNotice />}
          {summary && <PaddleCheckDataLine check={summary} />}
          {check && <CheckList checklist={checklist} check={check} />}
          <p className="m-0 text-content-faint" style={fs(10.5, 'body')}>
            {t('tours.paddle.check.notClearance')}
          </p>
        </div>
      </RailCard>
      {/* Outside the card's body: an obstacle picked on the map opens its entry with the card folded too. */}
      {checklist.dialogKey !== null && <ObstacleEntryDialog checklist={checklist} />}
    </>
  );
}
