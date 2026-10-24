import type { AssistantMessage, CollabPollCard, CollabPollsCard as PollsCard } from '@trek/shared';
import { BarChart3, Clock, Lock, TriangleAlert } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { avatarSrc } from '../../../../utils/avatarSrc';
import { formatPollCountdown } from '../../../Collab/collabModel';
import { PollChip, PollOptionRow } from '../../../Collab/CollabPollOption';
import { SoftPill } from '../../../Planner/planParts';
import { NEUTRAL_TINT } from '../../../shared/DialogShell';
import type { ChangeItem, ChangeState } from '../../assistantParts';
import type { CardEntry } from '../cardTypes';
import CardFrame from '../parts/CardFrame';
import CardHeader from '../parts/CardHeader';
import { CardOpenButton } from '../parts/CardOpen';
import { PersonFace } from '../parts/CardPeople';
import { CardMore } from '../parts/CardRows';
import { isOpen, pollOutcome, shareOf } from './collabCardModel';
import { POLLS_TARGET } from './collabLook';

/**
 * Polls of the trip in the assistant chat, drawn like the Collab tab's poll
 * cards: the question on a tinted band with its facts as chips, the options
 * with their bars, shares and voters once the user voted or the poll ended,
 * the winner of an ended poll in green. Nothing here votes: the options are
 * rows, not buttons. A held vote rings the option it toggles, a held poll
 * that does not exist yet says it is new, one about to go is struck.
 */

/** Why a held vote would be refused, in words. A table, so each key is named where it is read. */
const WARNING = {
  closed: { labelKey: 'assistant.card.collab.pollClosedWarning' },
  unknownOption: { labelKey: 'assistant.card.collab.unknownOption' },
} as const satisfies Record<NonNullable<CollabPollCard['warning']>, { labelKey: string }>;

function PollView({ poll, state }: { poll: CollabPollCard; state: ChangeState | null }) {
  const { t } = useTranslation();
  const { total, ended, showResults, top } = pollOutcome(poll);
  const remaining = formatPollCountdown(poll.deadline, t);
  const removing = poll.change === 'remove';
  const heldVote = poll.change === 'vote' && isOpen(state) && poll.warning === null;
  const marked = (index: number) =>
    heldVote && index === poll.votedIndex
      ? { label: t(poll.votedAdds ? 'assistant.card.collab.yourVote' : 'assistant.card.collab.voteTakenBack') }
      : null;
  return (
    <article
      aria-label={poll.question}
      className={`overflow-hidden rounded-2xl border border-edge-faint bg-surface-card ${removing ? 'opacity-60' : ''}`}
    >
      <div
        className="flex items-start gap-2 border-b border-edge-faint px-3 py-2.5"
        style={{ background: ended ? 'var(--bg-secondary)' : NEUTRAL_TINT }}
      >
        <div className="min-w-0 flex-1">
          <p
            className={`m-0 whitespace-pre-wrap break-words text-body font-bold leading-snug text-content ${removing ? 'line-through' : ''}`}
          >
            {poll.question}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {poll.change === 'create' && <PollChip tone="info">{t('assistant.card.collab.newPoll')}</PollChip>}
            {ended && <PollChip icon={<Lock size={9} strokeWidth={2.4} />}>{t('collab.polls.closed')}</PollChip>}
            {remaining && !ended && (
              <PollChip tone="warning" icon={<Clock size={9} strokeWidth={2.4} />}>
                {remaining}
              </PollChip>
            )}
            {poll.multiple && <PollChip>{t('collab.polls.multiChoice')}</PollChip>}
            <PollChip>{t('collab.polls.votes', { n: total })}</PollChip>
          </div>
        </div>
        {poll.author && <PersonFace person={poll.author} size={20} />}
      </div>
      {poll.warning && (
        <div className="px-3 pt-2.5">
          <SoftPill tone="warning" icon={<TriangleAlert size={10} strokeWidth={2.2} aria-hidden="true" />}>
            {t(WARNING[poll.warning].labelKey)}
          </SoftPill>
        </div>
      )}
      <div className="flex flex-col gap-1.5 p-3">
        {poll.options.map((option, index) => (
          <PollOptionRow
            key={`${index}-${option.text}`}
            as="div"
            text={option.text}
            pct={shareOf(option.votes, total)}
            mine={option.mine}
            winner={ended && option.votes > 0 && option.votes === top}
            showResults={showResults}
            voters={option.voters.map((voter) => ({
              key: voter.id,
              name: voter.name,
              src: avatarSrc(voter.avatarKey),
            }))}
            pending={marked(index)}
          />
        ))}
        {poll.moreOptions > 0 && (
          <p className="m-0 px-1 text-caption text-content-faint">
            {t('assistant.card.collab.moreOptions', { count: poll.moreOptions })}
          </p>
        )}
      </div>
    </article>
  );
}

/** The polls of an answer's reads, open ones first as they came, each once; the rest counted with a way to them. */
export default function CollabPollsBlock({ cards }: { cards: readonly CardEntry[]; message: AssistantMessage }) {
  const { t } = useTranslation();
  const seen = new Set<number>();
  const polls: CollabPollCard[] = [];
  let more = 0;
  for (const { card } of cards) {
    if (card.kind !== 'collabPolls') continue;
    more = Math.max(more, card.more);
    for (const poll of card.polls) {
      if (poll.pollId !== null && seen.has(poll.pollId)) continue;
      if (poll.pollId !== null) seen.add(poll.pollId);
      polls.push(poll);
    }
  }
  if (polls.length === 0) return null;
  const title = t('collab.tabs.polls');
  return (
    <CardFrame label={title}>
      <CardHeader
        icon={BarChart3}
        tone="info"
        title={title}
        count={polls.length + more}
        actions={<CardOpenButton target={POLLS_TARGET} labelKey="assistant.card.collab.openPolls" />}
      />
      <div className="mt-2 flex flex-col gap-2">
        {polls.map((poll, index) => (
          <PollView key={poll.pollId ?? `new-${index}`} poll={poll} state={null} />
        ))}
      </div>
      <CardMore count={more} labelKey="assistant.card.collab.morePolls" target={POLLS_TARGET} />
    </CardFrame>
  );
}

/** A change row's poll, after the change, marked by how it stands. */
export function CollabPollsBody({ card, item }: { card: PollsCard; item: ChangeItem }) {
  return (
    <div className="flex flex-col gap-2">
      {card.polls.map((poll, index) => (
        <PollView key={poll.pollId ?? `new-${index}`} poll={poll} state={item.state} />
      ))}
    </div>
  );
}
