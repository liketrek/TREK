import type { TripJournalCandidate, TripJournalLinkRole } from '@trek/shared';
import { AlertTriangle, BookOpen, Link2, Unlink, Users } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from '../../i18n';
import ConfirmDialog from '../shared/ConfirmDialog';
import CustomSelect from '../shared/CustomSelect';
import { DialogButton, fs } from '../shared/DialogShell';
import { AddRowButton, PANEL } from '../shared/dialogParts';
import { TripMemberAvatar } from './TripMemberAvatar';
import { LinkCard } from './TripShareDialog';
import { useTripJournalLink, type JournalMemberChoice } from './useTripJournalLink';

const ROWS = 'flex flex-col gap-0.5 rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5';
const ROW = 'flex min-h-[48px] items-center gap-3 rounded-[10px] px-2.5 py-1.5';
const SEGMENT = 'rounded-full px-2.5 py-1 font-semibold';
/** The phone sheet's buttons, the round 38px ones its other areas use. */
const SHEET_BUTTON =
  'flex h-[38px] min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 [&>svg]:flex-none text-[length:calc(12px*var(--fs-scale-body,1))] font-semibold disabled:opacity-40';

const ROLES: { value: TripJournalLinkRole | null; labelKey: string }[] = [
  { value: null, labelKey: 'trip.journal.roleNone' },
  { value: 'viewer', labelKey: 'trip.journal.roleViewer' },
  { value: 'editor', labelKey: 'trip.journal.roleEditor' },
];

/**
 * The Journal part of the trip's Settings, for the desktop dialog and the phone
 * sheet alike: the journal the trip shows, and who of the trip it is open to.
 * Hidden with the Journey addon off, and for someone who can neither link one
 * nor see one that is linked.
 */
export function TripJournalLinkSection({ tripId, framed = true }: { tripId: number; framed?: boolean }) {
  const { t } = useTranslation();
  const j = useTripJournalLink(tripId);
  const [askUnlink, setAskUnlink] = useState(false);
  if (!j.visible) return null;

  // The desktop dialog names the area above it already; the phone sheet gets the card with its own title.
  const Frame = framed ? JournalCard : Bare;
  return (
    <>
      <Frame>
        {j.mode === 'view' && <JournalView j={j} framed={framed} onUnlink={() => setAskUnlink(true)} />}
        {j.mode === 'pick' && <JournalPicker j={j} />}
        {(j.mode === 'members' || (j.mode === 'pick' && j.pickedId != null)) && <MemberChooser j={j} />}
        {j.mode !== 'view' && (
          <div className="flex justify-end gap-2">
            <DialogButton onClick={j.cancel} disabled={j.busy}>
              {t('common.cancel')}
            </DialogButton>
            <DialogButton
              variant="primary"
              onClick={() => void j.save()}
              disabled={!j.canSave}
              icon={<Link2 size={14} strokeWidth={2.2} />}
            >
              {j.mode === 'pick' ? t('trip.journal.linkSubmit') : t('common.save')}
            </DialogButton>
          </div>
        )}
      </Frame>
      <ConfirmDialog
        isOpen={askUnlink}
        onClose={() => setAskUnlink(false)}
        onConfirm={() => {
          setAskUnlink(false);
          void j.unlink();
        }}
        title={t('trip.journal.unlinkTitle')}
        message={t('trip.journal.unlinkMessage')}
        confirmLabel={t('trip.journal.unlink')}
      />
    </>
  );
}

/**
 * The journal as it stands: the linked one, in the dialog's cards or the phone
 * card with its buttons, or the way to link one.
 */
function JournalView({ j, framed, onUnlink }: { j: JournalLink; framed: boolean; onUnlink: () => void }) {
  const { t } = useTranslation();
  if (!j.link) return j.canLink ? <AddRowButton onClick={j.startPick}>{t('trip.journal.link')}</AddRowButton> : null;
  if (!framed) return <LinkedJournalCards j={j} onUnlink={onUnlink} />;
  return (
    <>
      <LinkedJournal j={j} />
      <SheetActions j={j} onUnlink={onUnlink} />
    </>
  );
}

/** The phone's ways to change who may open the journal, pick another or unlink it. */
function SheetActions({ j, onUnlink }: { j: JournalLink; onUnlink: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      {j.canEditMembers && (
        <button type="button" onClick={j.editMembers} className={`${SHEET_BUTTON} bg-m-act text-m-actfg`}>
          <Users size={14} strokeWidth={2.2} />
          {t('trip.journal.editMembers')}
        </button>
      )}
      {(j.canLink || j.canUnlink) && (
        <div className="flex gap-2">
          {j.canLink && (
            <button
              type="button"
              onClick={j.startPick}
              className={`${SHEET_BUTTON} flex-1 bg-[color:var(--m-ic)] text-m-ink`}
            >
              <BookOpen size={14} strokeWidth={2.2} />
              {t('trip.journal.change')}
            </button>
          )}
          {j.canUnlink && (
            <button
              type="button"
              onClick={onUnlink}
              disabled={j.busy}
              className={`${SHEET_BUTTON} flex-1 bg-[color:var(--m-ic)] text-[color:var(--m-st-danger)]`}
            >
              <Unlink size={14} strokeWidth={2.2} />
              {t('trip.journal.unlink')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** The phone sheet's card: what a linked journal does, then the journal and its people. */
function JournalCard({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col gap-3 rounded-[18px] border border-[color:var(--m-inbr)] bg-[color:var(--m-inner)] p-3">
      <p className="m-0 font-geist text-caption leading-snug text-m-muted">{t('trip.journal.hint')}</p>
      {children}
    </section>
  );
}

function Bare({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
}

type JournalLink = ReturnType<typeof useTripJournalLink>;

/**
 * The linked journal in the desktop settings, in cards like the Sharing area's:
 * the journal itself with the ways to change or unlink it, then who of the trip
 * may open it, as rows like the People area's.
 */
function LinkedJournalCards({ j, onUnlink }: { j: JournalLink; onUnlink: () => void }) {
  const { t } = useTranslation();
  const link = j.link;
  if (!link) return null;
  const members = link.members ?? [];
  return (
    <>
      <section className={PANEL}>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 flex-none place-items-center overflow-hidden rounded-[10px] bg-surface-card text-content-muted shadow-sm">
            {link.cover_image ? (
              <img src={`/uploads/${link.cover_image}`} alt="" className="h-full w-full object-cover" />
            ) : (
              <BookOpen size={18} strokeWidth={2} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="m-0 truncate font-semibold text-content" style={fs(13.5, 'body')}>
              {link.title}
            </h3>
            {link.my_role && (
              <p className="m-0 mt-0.5 truncate text-content-faint" style={fs(11.5)}>
                {t(`trip.journal.yourRole.${link.my_role}`)}
              </p>
            )}
          </div>
          <span
            className="inline-flex flex-none items-center gap-1 rounded-full bg-success-soft px-2 py-[2px] font-semibold text-success"
            style={fs(10.5)}
          >
            <Link2 size={10} strokeWidth={2.6} />
            {t('trip.journal.linkedBadge')}
          </span>
        </div>
        {(j.canLink || j.canUnlink) && (
          <div className="flex flex-wrap gap-2">
            {j.canLink && (
              <DialogButton variant="primary" onClick={j.startPick} icon={<BookOpen size={14} strokeWidth={2.2} />}>
                {t('trip.journal.change')}
              </DialogButton>
            )}
            {j.canUnlink && (
              <DialogButton
                variant="danger"
                onClick={onUnlink}
                disabled={j.busy}
                icon={<Unlink size={14} strokeWidth={2.2} />}
              >
                {t('trip.journal.unlink')}
              </DialogButton>
            )}
          </div>
        )}
      </section>
      <LinkCard
        icon={<Users size={15} strokeWidth={2.2} />}
        title={t('trip.journal.members')}
        hint={t('trip.journal.membersHint')}
      >
        {members.length > 0 ? (
          <div className={ROWS}>
            {members.map((m) => (
              <div key={m.user_id} className={ROW}>
                <TripMemberAvatar username={m.username} avatarUrl={m.avatar_url} />
                <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(13, 'body')}>
                  {m.username}
                </span>
                <span
                  className="flex-none rounded-full bg-surface-tertiary px-2 py-[2px] font-semibold text-content-muted"
                  style={fs(10.5)}
                >
                  {t(m.role === 'editor' ? 'trip.journal.roleEditor' : 'trip.journal.roleViewer')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="m-0 text-content-faint" style={fs(12)}>
            {t('trip.journal.onlyYou')}
          </p>
        )}
        {j.canEditMembers && (
          <div>
            <DialogButton variant="primary" onClick={j.editMembers} icon={<Users size={14} strokeWidth={2.2} />}>
              {t('trip.journal.editMembers')}
            </DialogButton>
          </div>
        )}
      </LinkCard>
    </>
  );
}

/** The linked journal on the phone: cover, title and role, then who of the trip may open it, as rows. */
function LinkedJournal({ j }: { j: JournalLink }) {
  const { t } = useTranslation();
  const link = j.link;
  if (!link) return null;
  const members = link.members ?? [];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 rounded-[14px] bg-[color:var(--m-ic)] p-2">
        <span className="grid h-11 w-11 flex-none place-items-center overflow-hidden rounded-[11px] bg-m-card text-m-muted">
          {link.cover_image ? (
            <img src={`/uploads/${link.cover_image}`} alt="" className="h-full w-full object-cover" />
          ) : (
            <BookOpen size={18} strokeWidth={2} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-body font-semibold text-m-ink">{link.title}</div>
          {link.my_role && (
            <div className="truncate font-geist text-caption text-m-muted">
              {t(`trip.journal.yourRole.${link.my_role}`)}
            </div>
          )}
        </div>
        <span className="flex flex-none items-center gap-1 rounded-full bg-[color:color-mix(in_srgb,var(--m-st-confirmed)_14%,transparent)] px-2 py-[2px] font-geist text-caption font-semibold text-[color:var(--m-st-confirmed)]">
          <Link2 size={11} strokeWidth={2.6} />
          {t('trip.journal.linkedBadge')}
        </span>
      </div>
      {members.length > 0 ? (
        <div className="flex flex-col">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-2.5 py-1.5">
              <TripMemberAvatar username={m.username} avatarUrl={m.avatar_url} size={30} />
              <span className="min-w-0 flex-1 truncate text-body font-semibold text-m-ink">{m.username}</span>
              <span className="flex-none rounded-full bg-[color:var(--m-ic)] px-2 py-[2px] font-geist text-caption font-semibold text-m-muted">
                {t(m.role === 'editor' ? 'trip.journal.roleEditor' : 'trip.journal.roleViewer')}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="m-0 font-geist text-caption text-m-muted">{t('trip.journal.onlyYou')}</p>
      )}
    </div>
  );
}

/** The journals of one's own to choose from; one only contributed to is not one's to give away. */
function JournalPicker({ j }: { j: JournalLink }) {
  const { t } = useTranslation();
  if (j.journals == null) return <div className="h-10 animate-pulse rounded-[10px] bg-surface-tertiary" />;
  if (j.journals.length === 0)
    return (
      <p className="m-0 text-content-faint" style={fs(12)}>
        {t('trip.journal.noJournals')}
      </p>
    );
  return (
    <CustomSelect
      value={j.pickedId == null ? '' : String(j.pickedId)}
      onChange={(value) => j.pickJournal(value === '' ? null : Number(value))}
      placeholder={t('trip.journal.pickPlaceholder')}
      options={[
        { value: '', label: t('trip.journal.pickPlaceholder') },
        ...j.journals.map((journal) => ({ value: String(journal.id), label: journal.title })),
      ]}
      searchable
      size="sm"
    />
  );
}

/**
 * Everyone of the trip, each with no access, read or edit. Before saving, the
 * people the link would let in for the first time are named: from then on they
 * see the journal in their own Journey list as well.
 */
function MemberChooser({ j }: { j: JournalLink }) {
  const { t } = useTranslation();
  if (j.candidates == null) return <div className="h-24 animate-pulse rounded-[14px] bg-surface-tertiary" />;
  if (j.candidates.length === 0)
    return (
      <p className="m-0 text-content-faint" style={fs(12)}>
        {t('trip.journal.noMembers')}
      </p>
    );
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-content-secondary" style={fs(12, 'body')}>
          {t('trip.journal.members')}
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => j.setAll('viewer')}
            className="text-content-muted hover:text-content"
            style={fs(11.5)}
          >
            {t('trip.journal.allRead')}
          </button>
          <span className="text-content-faint" aria-hidden>
            /
          </span>
          <button
            type="button"
            onClick={() => j.setAll(null)}
            className="text-content-muted hover:text-content"
            style={fs(11.5)}
          >
            {t('trip.journal.allNone')}
          </button>
        </div>
      </div>
      <div className={ROWS}>
        {j.candidates.map((c) => (
          <MemberRow key={c.user_id} c={c} choice={j.choice} onRole={j.setRole} showAccess={j.mode === 'pick'} />
        ))}
      </div>
      {j.newlyGranted.length > 0 && (
        <div role="note" className="flex items-start gap-2 rounded-[12px] bg-warning-soft px-3 py-2.5 text-warning">
          <AlertTriangle size={15} strokeWidth={2.2} className="mt-px flex-none" />
          <p className="m-0 leading-normal" style={fs(12)}>
            {t('trip.journal.warnNew', {
              count: j.newlyGranted.length,
              names: j.newlyGranted.map((c) => c.username).join(', '),
            })}
          </p>
        </div>
      )}
    </div>
  );
}

function MemberRow({
  c,
  choice,
  onRole,
  showAccess,
}: {
  c: TripJournalCandidate;
  choice: JournalMemberChoice;
  onRole: (userId: number, role: TripJournalLinkRole | null) => void;
  showAccess: boolean;
}) {
  const { t } = useTranslation();
  const current = choice[c.user_id] ?? null;
  return (
    <div className={ROW}>
      <TripMemberAvatar username={c.username} avatarUrl={c.avatar_url} />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        <span className="truncate font-semibold text-content" style={fs(13, 'body')}>
          {c.username}
        </span>
        {c.is_trip_owner && (
          <span
            className="rounded-full bg-surface-tertiary px-2 py-[2px] font-semibold text-content-muted"
            style={fs(10.5)}
          >
            {t('members.owner')}
          </span>
        )}
        {showAccess && c.access && (
          <span className="rounded-full bg-success-soft px-2 py-[2px] font-semibold text-success" style={fs(10.5)}>
            {t('trip.journal.hasAccess')}
          </span>
        )}
      </div>
      <div
        role="radiogroup"
        aria-label={c.username}
        className="flex flex-none gap-0.5 rounded-full bg-surface-card p-0.5 ring-1 ring-edge-faint"
      >
        {ROLES.map((r) => (
          <button
            key={r.labelKey}
            type="button"
            role="radio"
            aria-checked={current === r.value}
            onClick={() => onRole(c.user_id, r.value)}
            className={`${SEGMENT} ${current === r.value ? 'bg-accent text-accent-text' : 'text-content-muted hover:text-content'}`}
            style={fs(11, 'body')}
          >
            {t(r.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
