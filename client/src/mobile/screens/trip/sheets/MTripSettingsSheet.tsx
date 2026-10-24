import {
  Check,
  Copy,
  Crown,
  Link2,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
  Trash2,
  UserMinus,
  UserPlus,
  UserRound,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import CustomSelect from '../../../../components/shared/CustomSelect';
import { TripJournalLinkSection } from '../../../../components/Trips/TripJournalLinkSection';
import { TripMemberAvatar } from '../../../../components/Trips/TripMemberAvatar';
import {
  SHARE_OPTIONS,
  SHARE_SECTIONS,
  useShareLink,
  useTripInviteLink,
  useTripMembers,
  type ListedMember,
} from '../../../../components/Trips/useTripShare';
import { useTranslation } from '../../../../i18n';
import MChip from '../../../components/MChip';
import MSheet from '../../../components/MSheet';
import MConfirmSheet from '../../settings/MConfirmSheet';
import { Eyebrow, INNER_CLS, TileHeader } from './MTripSheetUi';

interface MTripSettingsSheetProps {
  open: boolean;
  onClose: () => void;
  tripId: number;
  tripTitle?: string;
  onMembersChanged?: () => void;
}

type Question =
  | { kind: 'transfer'; id: number; name: string }
  | { kind: 'remove'; id: number; self: boolean }
  | { kind: 'guest'; id: number };

const FIELD =
  'h-[42px] min-w-0 flex-1 rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px] text-[length:calc(13px*var(--fs-scale-body,1))] font-medium text-m-ink outline-none placeholder:text-m-faint';
const PRIMARY =
  'flex h-[42px] flex-none items-center gap-1.5 rounded-full bg-m-act px-4 text-[length:calc(13px*var(--fs-scale-body,1))] font-semibold text-m-actfg disabled:opacity-40';
const ROUND =
  'flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted disabled:opacity-40';
const PILL =
  'flex h-[22px] flex-none items-center gap-[3px] rounded-full px-[8px] font-geist text-[length:calc(9.5px*var(--fs-scale-caption,1))] font-bold uppercase tracking-[.06em]';

/** A titled block of the sheet: the eyebrow, an optional line under it and the content on the inner surface. */
function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className={`rounded-[18px] p-3 ${INNER_CLS}`}>
      <Eyebrow className="uppercase">{title}</Eyebrow>
      {hint && (
        <p className="mt-1 font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] leading-snug text-m-muted">
          {hint}
        </p>
      )}
      <div className="mt-2.5 flex flex-col gap-2">{children}</div>
    </section>
  );
}

/** A person of the trip: the avatar, the name with its badges, and the round actions. */
function PersonRow({
  name,
  avatarUrl,
  badges,
  children,
}: {
  name: ReactNode;
  avatarUrl: string | null;
  badges?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-[44px] items-center gap-[10px]">
      <TripMemberAvatar username={typeof name === 'string' ? name : '?'} avatarUrl={avatarUrl} size={34} />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        <span className="min-w-0 truncate text-[length:calc(13.5px*var(--fs-scale-body,1))] font-semibold text-m-ink">
          {name}
        </span>
        {badges}
      </div>
      {children}
    </div>
  );
}

/** A link with its copy button, read-only, the way the phone shows one to hand on. */
function LinkField({
  url,
  copied,
  onCopy,
  t,
}: {
  url: string;
  copied: boolean;
  onCopy: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] py-1 pe-1 ps-[14px]">
      <input
        readOnly
        value={url}
        aria-label={url}
        className="min-w-0 flex-1 border-none bg-transparent font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] text-m-muted outline-none"
      />
      <button
        type="button"
        onClick={onCopy}
        className={`${PRIMARY} h-[32px] px-3 text-[length:calc(11.5px*var(--fs-scale-caption,1))]`}
      >
        {copied ? <Check size={13} strokeWidth={2.4} /> : <Copy size={13} strokeWidth={2.2} />}
        {copied ? t('common.copied') : t('common.copy')}
      </button>
    </div>
  );
}

function ShareLinkSection({ tripId }: { tripId: number }) {
  const { t } = useTranslation();
  const link = useShareLink(tripId);
  if (link.loading) return null;
  return (
    <Section title={t('share.linkTitle')} hint={t('share.linkHint')}>
      <div className="flex flex-wrap gap-1.5">
        {[...SHARE_SECTIONS, ...SHARE_OPTIONS].map((option) => {
          const always = 'always' in option && !!option.always;
          const on = !!link.perms[option.key];
          return (
            <MChip
              key={option.key}
              active={on}
              pressable
              className={always ? 'opacity-70' : ''}
              onClick={() => {
                if (!always) void link.setPerm(option.key, !on);
              }}
            >
              {on && <Check size={12} strokeWidth={2.4} />}
              {t(option.label)}
            </MChip>
          );
        })}
      </div>
      {link.url ? (
        <>
          <LinkField url={link.url} copied={link.copied} onCopy={() => void link.copy()} t={t} />
          <button
            type="button"
            onClick={() => void link.remove()}
            className="flex h-[38px] items-center justify-center gap-1.5 rounded-full text-[length:calc(12px*var(--fs-scale-body,1))] font-semibold text-[color:var(--m-st-danger)]"
          >
            <Trash2 size={13} strokeWidth={2.2} /> {t('share.deleteLink')}
          </button>
        </>
      ) : (
        <button type="button" onClick={() => void link.create()} className={`${PRIMARY} justify-center`}>
          <Link2 size={14} strokeWidth={2.2} /> {t('share.createLink')}
        </button>
      )}
    </Section>
  );
}

function InviteLinkSection({ tripId }: { tripId: number }) {
  const { t } = useTranslation();
  const invite = useTripInviteLink(tripId);
  if (invite.loading) return null;
  return (
    <Section title={t('trip.invite.linkTitle')} hint={t('trip.invite.linkHint')}>
      {invite.url ? (
        <>
          <LinkField url={invite.url} copied={invite.copied} onCopy={() => void invite.copy()} t={t} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void invite.create()}
              disabled={invite.busy}
              className="flex h-[38px] flex-1 items-center justify-center gap-1.5 rounded-full bg-[color:var(--m-ic)] text-[length:calc(12px*var(--fs-scale-body,1))] font-semibold text-m-ink disabled:opacity-40"
            >
              <RefreshCw size={13} strokeWidth={2.2} /> {t('trip.invite.regenerate')}
            </button>
            <button
              type="button"
              onClick={() => void invite.remove()}
              disabled={invite.busy}
              className="flex h-[38px] flex-1 items-center justify-center gap-1.5 rounded-full bg-[color:var(--m-ic)] text-[length:calc(12px*var(--fs-scale-body,1))] font-semibold text-[color:var(--m-st-danger)] disabled:opacity-40"
            >
              <Trash2 size={13} strokeWidth={2.2} /> {t('trip.invite.disable')}
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => void invite.create()}
          disabled={invite.busy}
          className={`${PRIMARY} justify-center`}
        >
          <UserPlus size={14} strokeWidth={2.2} /> {t('trip.invite.create')}
        </button>
      )}
    </Section>
  );
}

type Members = ReturnType<typeof useTripMembers>;
type Translate = ReturnType<typeof useTranslation>['t'];
type Ask = (question: Question) => void;

/** What a question says and what its button does, by the kind of question. */
function questionWords(question: Question | null, t: Translate): { text: string; action: string } {
  if (!question) return { text: '', action: '' };
  if (question.kind === 'transfer')
    return { text: t('members.confirmTransfer', { name: question.name }), action: t('members.makeOwner') };
  if (question.kind === 'guest') return { text: t('members.confirmRemoveGuest'), action: t('members.removeAccess') };
  return question.self
    ? { text: t('members.confirmLeave'), action: t('members.leaveTrip') }
    : { text: t('members.confirmRemove'), action: t('members.removeAccess') };
}

/** Make owner and remove (or leave) beside a member, as far as the reader may. */
function MemberActions({ member, m, ask }: { member: ListedMember; m: Members; ask: Ask }) {
  const { t } = useTranslation();
  const self = member.id === m.user?.id;
  const canRemove = self || (m.canManageMembers && member.role !== 'owner');
  return (
    <>
      {m.isCurrentOwner && member.role !== 'owner' && (
        <button
          type="button"
          aria-label={t('members.makeOwner')}
          disabled={m.transferringId === member.id}
          onClick={() => ask({ kind: 'transfer', id: member.id, name: member.username })}
          className={ROUND}
        >
          <Crown size={14} strokeWidth={2} />
        </button>
      )}
      {canRemove && (
        <button
          type="button"
          aria-label={self ? t('members.leaveTrip') : t('members.removeAccess')}
          disabled={m.removingId === member.id}
          onClick={() => ask({ kind: 'remove', id: member.id, self })}
          className={ROUND}
        >
          {self ? <LogOut size={14} strokeWidth={2} /> : <UserMinus size={14} strokeWidth={2} />}
        </button>
      )}
    </>
  );
}

/** The badges beside a member's name: you, and the owner's crown. */
function MemberBadges({ member, m }: { member: ListedMember; m: Members }) {
  const { t } = useTranslation();
  return (
    <>
      {member.id === m.user?.id && (
        <span className={`${PILL} bg-[color:var(--m-ic)] text-m-muted`}>{t('members.you')}</span>
      )}
      {member.role === 'owner' && (
        <span className={`${PILL} bg-m-act text-m-actfg`}>
          <Crown size={9} strokeWidth={2.4} />
          {t('members.owner')}
        </span>
      )}
    </>
  );
}

/** Who has access: the invite picker for those who may add people, then everyone with their badges. */
function AccessSection({ m, ask }: { m: Members; ask: Ask }) {
  const { t } = useTranslation();
  return (
    <Section title={`${t('members.access')} ${m.realMembers.length}`}>
      {m.canManageMembers && (
        <div className="flex gap-2">
          <CustomSelect
            value={m.selectedUserId}
            onChange={(value) => m.setSelectedUserId(String(value))}
            placeholder={t('members.selectUser')}
            options={[
              { value: '', label: t('members.selectUser') },
              ...m.availableUsers.map((u) => ({ value: String(u.id), label: u.username })),
            ]}
            searchable
            size="sm"
            style={{ flex: 1, minWidth: 0 }}
          />
          <button
            type="button"
            onClick={() => void m.add()}
            disabled={m.adding || !m.selectedUserId}
            aria-label={t('members.invite')}
            className={PRIMARY}
          >
            <UserPlus size={14} strokeWidth={2.2} />
          </button>
        </div>
      )}
      {m.canManageMembers && m.availableUsers.length === 0 && m.allUsers.length > 0 && (
        <p className="font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] text-m-faint">
          {t('members.allHaveAccess')}
        </p>
      )}
      {m.loading && m.realMembers.length === 0 ? (
        <div className="h-[44px] animate-pulse rounded-full bg-[color:var(--m-ic)]" />
      ) : (
        m.realMembers.map((member) => (
          <PersonRow
            key={member.id}
            name={member.username}
            avatarUrl={member.avatar_url ?? null}
            badges={<MemberBadges member={member} m={m} />}
          >
            <MemberActions member={member} m={m} ask={ask} />
          </PersonRow>
        ))
      )}
    </Section>
  );
}

/** A guest's row, or the field its new name is typed into. */
function GuestRow({ guest, m, ask }: { guest: Members['guests'][number]; m: Members; ask: Ask }) {
  const { t } = useTranslation();
  if (m.renamingGuestId === guest.id) {
    return (
      <input
        autoFocus
        value={m.renameValue}
        maxLength={50}
        aria-label={t('common.rename')}
        onChange={(e) => m.setRenameValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void m.commitRename(guest.id);
          if (e.key === 'Escape') m.cancelRename();
        }}
        onBlur={() => void m.commitRename(guest.id)}
        className={FIELD}
      />
    );
  }
  return (
    <PersonRow
      name={guest.username}
      avatarUrl={null}
      badges={
        <span className={`${PILL} bg-[color:var(--m-ic)] text-m-muted`}>
          <UserRound size={9} strokeWidth={2.4} />
          {t('members.guest')}
        </span>
      }
    >
      {m.isCurrentOwner && (
        <>
          <button type="button" aria-label={t('common.rename')} onClick={() => m.startRename(guest)} className={ROUND}>
            <Pencil size={13} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label={t('members.removeAccess')}
            disabled={m.removingId === guest.id}
            onClick={() => ask({ kind: 'guest', id: guest.id })}
            className={ROUND}
          >
            <Trash2 size={13} strokeWidth={2} />
          </button>
        </>
      )}
    </PersonRow>
  );
}

/** The guests without an account, and for the owner the field that adds one. */
function GuestsSection({ m, ask }: { m: Members; ask: Ask }) {
  const { t } = useTranslation();
  if (!m.isCurrentOwner && m.guests.length === 0) return null;
  return (
    <Section
      title={m.guests.length > 0 ? `${t('members.guests')} ${m.guests.length}` : t('members.guests')}
      hint={t('members.guestsHint')}
    >
      {m.guests.map((guest) => (
        <GuestRow key={guest.id} guest={guest} m={m} ask={ask} />
      ))}
      {m.isCurrentOwner && (
        <div className="flex gap-2">
          <input
            value={m.newGuestName}
            maxLength={50}
            placeholder={t('members.guestNamePlaceholder')}
            onChange={(e) => m.setNewGuestName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void m.addGuest();
            }}
            className={FIELD}
          />
          <button
            type="button"
            onClick={() => void m.addGuest()}
            disabled={m.addingGuest || !m.newGuestName.trim()}
            aria-label={t('members.addGuest')}
            className={PRIMARY}
          >
            <Plus size={15} strokeWidth={2.2} />
          </button>
        </div>
      )}
    </Section>
  );
}

/**
 * The trip's settings on the phone (the Mehr sheet's "Trip settings"): who has
 * access, the guests without an account, the public link, the invite link and
 * the linked journal. The state is useTripShare's, the same the desktop share
 * dialog runs on; only the markup and the questions are the phone's own.
 */
export default function MTripSettingsSheet({
  open,
  onClose,
  tripId,
  tripTitle,
  onMembersChanged,
}: MTripSettingsSheetProps) {
  const { t } = useTranslation();
  const m = useTripMembers({ isOpen: open, tripId, onClose, onMembersChanged });
  const [question, setQuestion] = useState<Question | null>(null);
  const words = questionWords(question, t);

  const answer = () => {
    if (!question) return;
    if (question.kind === 'transfer') void m.transfer(question.id);
    else if (question.kind === 'remove') void m.remove(question.id, question.self);
    else void m.removeGuest(question.id);
    setQuestion(null);
  };

  return (
    <>
      <MSheet open={open} onClose={onClose} variant="card" material="glass" ariaLabel={t('trip.settings.title')}>
        <div className="flex-none px-[18px] pt-4">
          <TileHeader
            icon={<Settings2 size={19} strokeWidth={1.8} />}
            title={t('trip.settings.title')}
            sub={tripTitle}
            onClose={onClose}
            closeLabel={t('common.close')}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-[18px] pb-[18px] pt-3">
          <AccessSection m={m} ask={setQuestion} />
          <GuestsSection m={m} ask={setQuestion} />
          {m.canManageShare && <ShareLinkSection tripId={tripId} />}
          {m.canManageShare && <InviteLinkSection tripId={tripId} />}
          <TripJournalLinkSection tripId={tripId} />
        </div>
      </MSheet>

      <MConfirmSheet
        open={question != null}
        onClose={() => setQuestion(null)}
        title={words.action}
        message={words.text}
        confirmLabel={words.action}
        cancelLabel={t('common.cancel')}
        danger={question?.kind !== 'transfer'}
        onConfirm={answer}
      />
    </>
  );
}
