import { listCollabPollsOutputSchema } from '@trek/shared/mcp-apps';
import { useState } from 'react';
import type { Translate } from '../../lib/i18n';
import { optionText, orderPolls, voteShares, type Poll } from './pollModel';
import './poll.css';

export interface PollsProps {
  data: unknown;
  locale: string;
  t: Translate;
  /** Casts or takes back the reader's vote; resolves the poll as TREK has it now, or null when TREK refused. */
  onVote: (poll: Poll, optionIndex: number) => Promise<Poll | null>;
}

/** The polls as TREK last answered them: the tool result, with each poll a vote changed swapped in. */
function usePolls(initial: Poll[], onVote: PollsProps['onVote']) {
  const [updated, setUpdated] = useState<ReadonlyMap<number, Poll>>(new Map());
  const [failed, setFailed] = useState(false);
  // The polls with a vote out, by id: a vote on one poll leaves another's buttons as they are.
  const [busy, setBusy] = useState<ReadonlySet<number>>(new Set());
  const polls = orderPolls(initial.map((poll) => updated.get(poll.id) ?? poll));
  const vote = async (poll: Poll, optionIndex: number) => {
    setFailed(false);
    setBusy((previous) => new Set(previous).add(poll.id));
    const next = await onVote(poll, optionIndex);
    setBusy((previous) => {
      const rest = new Set(previous);
      rest.delete(poll.id);
      return rest;
    });
    if (next) setUpdated((previous) => new Map(previous).set(next.id, next));
    else setFailed(true);
  };
  return { polls, vote, failed, busy };
}

/** list_collab_polls' polls with their results; an open poll takes a vote through the host. */
export function Polls({ data, locale, t, onVote }: PollsProps) {
  const parsed = listCollabPollsOutputSchema.safeParse(data);
  const { polls, vote, failed, busy } = usePolls(parsed.success ? parsed.data.polls : [], onVote);
  if (!parsed.success) return <p className="trek-muted trek-state">{t('mcpApps.error')}</p>;
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
  return (
    <section className="trek-widget" aria-labelledby="polls-title">
      <h1 id="polls-title" className="trek-header__title poll__title">
        {t('mcpApps.polls.title')}
      </h1>
      {failed ? (
        <p role="alert" className="trek-error">
          {t('mcpApps.polls.voteError')}
        </p>
      ) : null}
      {polls.length === 0 ? (
        <p className="trek-muted">{t('mcpApps.polls.empty')}</p>
      ) : (
        <ul className="trek-list">
          {polls.map((poll) => {
            const shares = voteShares(poll);
            return (
              <li key={poll.id} className="poll">
                <h2 className="poll__question">{poll.question}</h2>
                {poll.is_closed ? <p className="trek-muted">{t('mcpApps.polls.closed')}</p> : null}
                <ul className="trek-list">
                  {poll.options.map((option, index) => (
                    <li key={index}>
                      <button
                        type="button"
                        className="poll__option trek-hit"
                        disabled={poll.is_closed || busy.has(poll.id)}
                        onClick={() => void vote(poll, index)}
                      >
                        <span
                          className="poll__bar"
                          aria-hidden="true"
                          style={{ inlineSize: `${shares[index] * 100}%` }}
                        />
                        <span className="poll__text">{optionText(option)}</span>
                        <span className="poll__share">
                          {percent.format(shares[index])} · {option.voters.length}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
