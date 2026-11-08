import { callTrekTool } from '../../lib/host';
import { useTrekApp } from '../../lib/useTrekApp';
import { WidgetState } from '../../lib/WidgetState';
import { votedPoll } from './pollModel';
import { Polls } from './Polls';

/**
 * The poll widget: list_collab_polls' polls, voted on through vote_collab_poll
 * on the host's own session. The question and options are other travellers'
 * words; they are only shown, never sent anywhere in the reader's name.
 */
export function App() {
  const state = useTrekApp('poll');
  const { app, locale, t } = state;
  return (
    <WidgetState state={state}>
      {(result) => (
        <Polls
          data={result.structuredContent}
          locale={locale}
          t={t}
          onVote={async (poll, optionIndex) => {
            const answer = await callTrekTool(app, 'vote_collab_poll', {
              tripId: poll.trip_id,
              pollId: poll.id,
              optionIndex,
            });
            const text = answer?.content.find((block) => block.type === 'text');
            return answer ? votedPoll(text?.type === 'text' ? text.text : undefined) : null;
          }}
        />
      )}
    </WidgetState>
  );
}
