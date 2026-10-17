import {
  OBSTACLE_DECISIONS,
  type ObstacleDecision,
  type ObstacleDecisionRecord,
  type TourObstacleEntry,
} from '@trek/shared';
import {
  ArrowRight,
  Ban,
  Check,
  LifeBuoy,
  MoveRight,
  Pencil,
  SearchX,
  Split,
  StickyNote,
  Trash2,
  Unlink,
  X,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { CardAction, InfoDot, TourNotice } from '../tourParts';
import { FigureBadge } from './FigureBadge';
import { ObstacleStatusBadges } from './PaddleCheckBadges';
import { PortageIcon } from './PaddleGlyph';
import { formatCheckDate } from './paddleCheckModel';
import type { PaddleChecklist } from './usePaddleChecklist';

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** The longest note a decision keeps, as the checklist contract allows it. */
const NOTE_MAX = 500;

/** The notices an entry can call for, in the order they are shown: a ban first, since no decision lifts it. */
const NOTICE_ORDER = ['bans', 'portage', 'sup'] as const;
type NoticeId = (typeof NOTICE_ORDER)[number];
/** The most notices the panel shows at once. */
const MAX_NOTICES = 2;

const CHOICE_ICON: Record<ObstacleDecision, ReactNode> = {
  pass: <MoveRight size={14} strokeWidth={2.2} className="rtl:rotate-180" />,
  portage: <PortageIcon size={14} />,
  reroute: <Split size={14} strokeWidth={2.2} />,
  not_affected: <Unlink size={14} strokeWidth={2.2} />,
};

/** How a choice looks: decided, decided before the route or the data changed, or not chosen. */
type ChoiceLook = 'chosen' | 'earlier' | 'idle';

const CHOICE_LOOK: Record<ChoiceLook, string> = {
  chosen: 'border-transparent bg-accent text-accent-text',
  earlier: 'border-dashed border-accent bg-surface-card text-content',
  idle: 'border-edge-faint bg-surface-card text-content-secondary enabled:hover:text-content',
};

const CHOICE =
  'flex min-w-0 items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-start font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-50';
const QUIET =
  'rounded-sm font-semibold text-content-muted underline-offset-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent enabled:hover:text-content enabled:hover:underline disabled:cursor-default disabled:opacity-40';
const ICON_BUTTON =
  'grid h-6 w-6 flex-none place-items-center rounded-full text-content-faint transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent enabled:hover:bg-surface-hover enabled:hover:text-content disabled:cursor-default disabled:opacity-40';
const SAVE_BUTTON =
  'inline-flex h-7 items-center gap-1.5 rounded-full bg-accent px-2.5 font-semibold text-accent-text shadow-sm transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent enabled:hover:opacity-90 disabled:cursor-default disabled:opacity-40';

/** The four choices as a radio group of two by two: the decided one filled, in review the earlier one dashed. */
function DecisionChoices({
  entry,
  label,
  disabled,
  onDecide,
}: {
  entry: TourObstacleEntry;
  label: string;
  disabled: boolean;
  onDecide: (decision: ObstacleDecision) => void;
}) {
  const { t } = useTranslation();
  const decided = entry.decision?.decision ?? null;
  // In review the earlier choice no longer holds: it is shown, not checked, and can be made again.
  const reviewing = entry.status === 'review';
  const lookOf = (choice: ObstacleDecision): ChoiceLook => {
    if (choice !== decided) return 'idle';
    return reviewing ? 'earlier' : 'chosen';
  };
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-1.5">
      {OBSTACLE_DECISIONS.map((choice) => {
        const look = lookOf(choice);
        return (
          <button
            key={choice}
            type="button"
            role="radio"
            aria-checked={look === 'chosen'}
            disabled={disabled}
            onClick={() => {
              if (look !== 'chosen') onDecide(choice);
            }}
            className={`${CHOICE} ${CHOICE_LOOK[look]}`}
            style={fs(11.5, 'body')}
          >
            <span className="flex-none">{CHOICE_ICON[choice]}</span>
            <span className="min-w-0 truncate">{t(`tours.paddle.check.decision.${choice}`)}</span>
            {/* The earlier choice is told apart by more than its dashed ring. */}
            {look === 'earlier' && <span className="sr-only">{`, ${t('tours.paddle.check.status.review')}`}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Which notices an entry calls for, at most MAX_NOTICES of them. */
function noticesOf(entry: TourObstacleEntry): NoticeId[] {
  const wanted: Record<NoticeId, boolean> = {
    bans: entry.access.forbidden || entry.access.private,
    portage: entry.status === 'todo' && entry.decision?.decision === 'portage',
    sup: entry.advice === 'sup_lock_portage',
  };
  return NOTICE_ORDER.filter((id) => wanted[id]).slice(0, MAX_NOTICES);
}

/** What stays true whatever was chosen: a ban in the data, a portage not planned yet, the SUP advice at a lock. */
function PanelNotices({ entry, onPlanPortage }: { entry: TourObstacleEntry; onPlanPortage: (() => void) | null }) {
  const { t } = useTranslation();
  const shown = noticesOf(entry);
  if (shown.length === 0) return null;
  const notices: Record<NoticeId, ReactNode> = {
    bans: (
      <TourNotice key="bans" icon={<Ban size={13} strokeWidth={2} />}>
        {t('tours.paddle.check.bansInfo')}
      </TourNotice>
    ),
    portage: (
      <TourNotice key="portage" icon={<PortageIcon size={13} />}>
        <div className="flex flex-col items-start gap-1.5">
          <span>{t('tours.paddle.check.portageMissingInfo')}</span>
          {onPlanPortage && (
            <CardAction icon={<PortageIcon size={12} />} onClick={onPlanPortage}>
              {t('tours.paddle.check.planPortage')}
            </CardAction>
          )}
        </div>
      </TourNotice>
    ),
    sup: (
      <TourNotice key="sup" icon={<LifeBuoy size={13} strokeWidth={2} />}>
        <div className="flex items-center gap-1">
          <span className="min-w-0">{t('tours.paddle.check.supLock')}</span>
          <span className="-my-1 flex-none">
            <InfoDot label={t('tours.paddle.check.supLock')} description={t('tours.paddle.check.supLockInfo')} />
          </span>
        </div>
      </TourNotice>
    ),
  };
  return (
    <div data-testid="obstacle-notices" className="flex flex-col gap-2">
      {shown.map((id) => notices[id])}
    </div>
  );
}

/** An entry the data no longer holds: why that proves nothing, and keeping or removing its decision. */
function GoneActions({ disabled, onKeep, onClear }: { disabled: boolean; onKeep: () => void; onClear: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <TourNotice icon={<SearchX size={13} strokeWidth={2} />}>{t('tours.paddle.check.goneInfo')}</TourNotice>
      <div className="flex flex-wrap items-center gap-1.5">
        <CardAction icon={<Check size={12} strokeWidth={2.4} />} onClick={onKeep} disabled={disabled}>
          {t('tours.paddle.check.keep')}
        </CardAction>
        <CardAction icon={<Trash2 size={12} strokeWidth={2.2} />} onClick={onClear} disabled={disabled}>
          {t('tours.paddle.check.clear')}
        </CardAction>
      </div>
    </div>
  );
}

/** Writing the note in two rows; Escape drops the edit without closing the map card or the dialog around it. */
function NoteEditor({
  draft,
  disabled,
  onChange,
  onSave,
  onCancel,
}: {
  draft: string;
  disabled: boolean;
  onChange: (draft: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const box = useRef<HTMLTextAreaElement>(null);
  // The note opens for writing, so it takes the focus once, when it opens.
  useEffect(() => {
    box.current?.focus();
  }, []);
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Escape') return;
    // The map card and the dialog close on Escape; inside the note it only ends the edit.
    event.preventDefault();
    event.stopPropagation();
    onCancel();
  };
  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        rows={2}
        maxLength={NOTE_MAX}
        ref={box}
        value={draft}
        aria-label={t('tours.paddle.check.note')}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        className="w-full resize-none rounded-[10px] border border-edge bg-surface-input px-2.5 py-1.5 text-content outline-none focus:border-accent"
        style={fs(12, 'body')}
      />
      <div className="flex items-center justify-end gap-1.5">
        <CardAction icon={<X size={12} strokeWidth={2.4} />} onClick={onCancel}>
          {t('common.cancel')}
        </CardAction>
        <button type="button" onClick={onSave} disabled={disabled} className={SAVE_BUTTON} style={fs(11.5, 'body')}>
          <Check size={12} strokeWidth={2.4} aria-hidden="true" />
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}

/** The decision's note: read clamped with a way to edit it, or a way to add one. */
function NoteBlock({
  note,
  disabled,
  onNote,
}: {
  note: string | null;
  disabled: boolean;
  /** Resolves to whether the note was saved; a failed save keeps the text being written. */
  onNote: (note: string | null) => Promise<boolean>;
}) {
  const { t } = useTranslation();
  // The text being written, or null while the note is only read.
  const [draft, setDraft] = useState<string | null>(null);
  const save = (text: string) => {
    const next = text.trim() || null;
    if (next === note) {
      setDraft(null);
      return;
    }
    void onNote(next).then((saved) => {
      if (saved) setDraft(null);
    });
  };
  if (draft !== null)
    return (
      <NoteEditor
        draft={draft}
        disabled={disabled}
        onChange={setDraft}
        onSave={() => save(draft)}
        onCancel={() => setDraft(null)}
      />
    );
  if (!note)
    return (
      <div>
        <CardAction icon={<StickyNote size={12} strokeWidth={2.2} />} onClick={() => setDraft('')} disabled={disabled}>
          {t('tours.paddle.check.note')}
        </CardAction>
      </div>
    );
  return (
    <div className="flex items-start gap-1.5">
      <p
        className="m-0 line-clamp-3 min-w-0 flex-1 break-words text-content-muted"
        style={fs(11.5, 'body')}
        title={note}
      >
        {note}
      </p>
      <Tooltip label={t('common.edit')}>
        <button
          type="button"
          aria-label={t('common.edit')}
          onClick={() => setDraft(note)}
          disabled={disabled}
          className={ICON_BUTTON}
        >
          <Pencil size={12} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </Tooltip>
    </div>
  );
}

/** Who decided and when: the trip member by name while they are on the trip, otherwise the date alone. */
function decidedLine(
  decision: ObstacleDecisionRecord,
  memberName: (id: number | null) => string | null,
  t: Translate,
  locale: string
): string {
  const date = formatCheckDate(decision.decided_at, locale);
  const name = memberName(decision.decided_by);
  return name ? t('tours.paddle.check.decidedBy', { date, name }) : t('tours.paddle.check.decidedAt', { date });
}

/** The foot of the panel: who decided when, removing the decision, and the way on to the next open entry. */
function MetaLine({
  decision,
  memberName,
  clearable,
  disabled,
  onClear,
  onNext,
}: {
  decision: ObstacleDecisionRecord | null;
  memberName: (id: number | null) => string | null;
  clearable: boolean;
  disabled: boolean;
  onClear: () => void;
  onNext: (() => void) | null;
}) {
  const { t, locale } = useTranslation();
  if (!decision && !onNext) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-content-faint" style={fs(10.5, 'body')}>
      {decision && <span className="min-w-0">{decidedLine(decision, memberName, t, locale)}</span>}
      {decision && clearable && (
        <button type="button" onClick={onClear} disabled={disabled} className={QUIET}>
          {t('tours.paddle.check.clear')}
        </button>
      )}
      {onNext && (
        <span className="ms-auto">
          <CardAction icon={<ArrowRight size={12} strokeWidth={2.4} className="rtl:rotate-180" />} onClick={onNext}>
            {t('tours.paddle.check.next')}
          </CardAction>
        </span>
      )}
    </div>
  );
}

/**
 * PAD-06: what the paddler decides about one obstacle of the checklist, below
 * its map card or in its dialog. The four choices, the notices that stay
 * whatever was chosen (a ban in the data, a portage not planned yet, the SUP
 * advice at a lock), the check on site the data records, a note, and who
 * decided when. An object the data no longer holds offers keeping or removing
 * its decision instead of the choices. A decision is the paddler's choice,
 * never a safety or legal clearance.
 */
export function ObstacleDecisionPanel({
  entry,
  canDecide,
  saving,
  memberName,
  onDecide,
  onNote,
  onClear,
  onKeep,
  onNext,
  onPlanPortage,
}: {
  entry: TourObstacleEntry;
  canDecide: boolean;
  /** This entry's change is on its way to the server. */
  saving: boolean;
  memberName: (id: number | null) => string | null;
  onDecide: (decision: ObstacleDecision) => void;
  onNote: (note: string | null) => Promise<boolean>;
  onClear: () => void;
  onKeep: () => void;
  /** Moves on to the next entry still asking for a look; null when there is none. */
  onNext: (() => void) | null;
  /** Starts planning the portage round the obstacle; null where that cannot be offered. */
  onPlanPortage: (() => void) | null;
}) {
  const { t, locale } = useTranslation();
  const locked = !canDecide || saving;
  const gone = entry.status === 'gone';
  const label = entry.name ?? t(`tours.paddle.obstacle.kind.${entry.kind}`);
  const root = useRef<HTMLDivElement>(null);
  const movedOn = useRef(false);
  // Moving on keeps the focus in the panel, also when the next entry has no Next button of its own.
  useLayoutEffect(() => {
    if (!movedOn.current) return;
    movedOn.current = false;
    if (!root.current?.contains(document.activeElement)) root.current?.focus({ preventScroll: true });
  });
  const next = onNext
    ? () => {
        movedOn.current = true;
        onNext();
      }
    : null;
  return (
    <div
      ref={root}
      tabIndex={-1}
      data-testid="obstacle-decision-panel"
      aria-busy={saving || undefined}
      className="flex flex-col gap-2.5 outline-none"
    >
      <div className="flex flex-wrap items-center gap-1.5 empty:hidden">
        <ObstacleStatusBadges entry={entry} />
      </div>
      {entry.relation !== null && <DecisionChoices entry={entry} label={label} disabled={locked} onDecide={onDecide} />}
      {gone && <GoneActions disabled={locked} onKeep={onKeep} onClear={onClear} />}
      <PanelNotices entry={entry} onPlanPortage={onPlanPortage} />
      <div className="flex">
        <FigureBadge
          testId="obstacle-on-site"
          label={t('tours.paddle.check.onSite')}
          value={entry.local_check ? formatCheckDate(entry.local_check, locale) : t('tours.paddle.check.unknown')}
        />
      </div>
      {entry.decision && <NoteBlock key={entry.key} note={entry.decision.note} disabled={locked} onNote={onNote} />}
      <MetaLine
        decision={entry.decision}
        memberName={memberName}
        clearable={!gone}
        disabled={locked}
        onClear={onClear}
        onNext={next}
      />
    </div>
  );
}

/** The decision panel of one checklist entry wired to the checklist; the map card and the entry dialog share it. */
export function ChecklistEntryPanel({ checklist, entry }: { checklist: PaddleChecklist; entry: TourObstacleEntry }) {
  return (
    <ObstacleDecisionPanel
      entry={entry}
      canDecide={checklist.canDecide}
      saving={checklist.savingKey === entry.key}
      memberName={checklist.memberName}
      onDecide={(decision) => void checklist.decide(entry, decision)}
      onNote={(note) => checklist.setNote(entry, note)}
      onClear={() => void checklist.clear(entry)}
      onKeep={() => void checklist.keep(entry)}
      onNext={checklist.nextOf(entry) ? () => checklist.next(entry) : null}
      onPlanPortage={checklist.canPlanPortage ? () => checklist.planPortage(entry) : null}
    />
  );
}

/**
 * The checklist's part of the map card of a paddle object (PAD-06): the
 * decision panel of the entry the object belongs to, below its facts, or
 * nothing while there is no checklist or it does not list the object.
 */
export function ChecklistObstaclePanel({ checklist, featureRef }: { checklist: PaddleChecklist; featureRef: string }) {
  // While the checklist reads again it keeps showing, locked, so the panel open on an object stays open.
  const entry = checklist.check ? checklist.entryForRef(featureRef) : null;
  if (!entry) return null;
  return (
    <div className="mt-3 border-t border-edge-faint pt-3">
      <ChecklistEntryPanel checklist={checklist} entry={entry} />
    </div>
  );
}
