import type { TripJournalCandidate, TripJournalLinkRole } from '@trek/shared';
import { AlertTriangle, BookOpen, Link2, Unlink, Users } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from '../../i18n';
import ConfirmDialog from '../shared/ConfirmDialog';
import CustomSelect from '../shared/CustomSelect';
import { DialogButton, fs } from '../shared/DialogShell';
import { AddRowButton } from '../shared/dialogParts';
import { LinkedJournalIcon } from './LinkedJournalIcon';
import { TripMemberAvatar } from './TripMemberAvatar';
import { LinkCard } from './TripShareDialog';
import { useTripJournalLink, type JournalMemberChoice } from './useTripJournalLink';

const ROWS = 'flex flex-col gap-0.5 rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5';
const ROW = 'flex min-h-[48px] items-center gap-3 rounded-[10px] px-2.5 py-1.5';
const SEGMENT = 'rounded-full px-2.5 py-1 font-semibold';

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
        {j.mode === 'view' && j.link && <LinkedJournal j={j} />}
        {j.mode === 'view' && !j.link && j.canLink && (
          <AddRowButton onClick={j.startPick}>{t('trip.journal.link')}</AddRowButton>
        )}
        {j.mode === 'view' && j.link && (
          <div className="flex flex-wrap gap-2">
            {j.canEditMembers && (
              <DialogButton onClick={j.editMembers} icon={<Users size={14} strokeWidth={2.2} />}>
                {t('trip.journal.editMembers')}
              </DialogButton>
            )}
            {j.canLink && (
              <DialogButton onClick={j.startPick} icon={<BookOpen size={14} strokeWidth={2.2} />}>
                {t('trip.journal.change')}
              </DialogButton>
            )}
            {j.canUnlink && (
              <button
                type="button"
                onClick={() => setAskUnlink(true)}
                disabled={j.busy}
                className="inline-flex items-center gap-1.5 rounded-[10px] bg-surface-card px-3.5 py-2 font-medium text-danger shadow-sm ring-1 ring-edge-faint hover:bg-danger-soft disabled:opacity-50"
                style={fs(12.5, 'body')}
              >
                <Unlink size={13} strokeWidth={2.2} />
                {t('trip.journal.unlink')}
              </button>
            )}
          </div>
        )}
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

function JournalCard({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <LinkCard
      icon={<LinkedJournalIcon size={15} strokeWidth={2.2} />}
      title={t('trip.journal.title')}
      hint={t('trip.journal.hint')}
    >
      {children}
    </LinkCard>
  );
}

function Bare({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
}

type JournalLink = ReturnType<typeof useTripJournalLink>;

/** The linked journal: cover, title, what the reader may do in it, and who it is open to. */
function LinkedJournal({ j }: { j: JournalLink }) {
  const { t } = useTranslation();
  const link = j.link;
  if (!link) return null;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3 rounded-[14px] border border-edge-faint bg-surface-card p-2.5">
        <span className="grid h-11 w-11 flex-none place-items-center overflow-hidden rounded-[10px] bg-surface-tertiary text-content-muted">
          {link.cover_image ? (
            <img src={`/uploads/${link.cover_image}`} alt="" className="h-full w-full object-cover" />
          ) : (
            <BookOpen size={18} strokeWidth={2} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-content" style={fs(13.5, 'body')}>
            {link.title}
          </div>
          {link.my_role && (
            <div className="truncate text-content-faint" style={fs(11.5)}>
              {t(`trip.journal.yourRole.${link.my_role}`)}
            </div>
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
      {link.members && link.members.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {link.members.map((m) => (
            <span
              key={m.user_id}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-card py-[3px] pe-2.5 ps-[3px] shadow-sm ring-1 ring-edge-faint"
              style={fs(11.5)}
            >
              <TripMemberAvatar username={m.username} avatarUrl={m.avatar_url} size={20} />
              <span className="font-medium text-content">{m.username}</span>
              <span className="text-content-faint">
                {t(m.role === 'editor' ? 'trip.journal.roleEditor' : 'trip.journal.roleViewer')}
              </span>
            </span>
          ))}
        </div>
      )}
      {link.members && link.members.length === 0 && (
        <p className="m-0 text-content-faint" style={fs(11.5)}>
          {t('trip.journal.onlyYou')}
        </p>
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
