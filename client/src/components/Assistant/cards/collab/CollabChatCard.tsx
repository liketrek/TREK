import type { AssistantMessage, CollabChatCard as ChatCard } from '@trek/shared';
import { MessageCircle } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import type { ChangeItem } from '../../assistantParts';
import type { CardEntry } from '../cardTypes';
import CardFrame from '../parts/CardFrame';
import CardHeader from '../parts/CardHeader';
import { CardOpenButton } from '../parts/CardOpen';
import { mergedChat } from './collabCardModel';
import CollabChatThread from './CollabChatThread';
import { CHAT_TARGET } from './collabLook';

/**
 * The trip chat in the assistant chat: an answer as the last messages a read
 * found, on the chat panel's own quieter surface, with the older ones counted
 * and a way into the chat; a change row as the one bubble it sends, removes
 * or reacts to, as it will look.
 */

/** The messages of an answer's chat reads, in one thread. */
export default function CollabChatBlock({ cards }: { cards: readonly CardEntry[]; message: AssistantMessage }) {
  const { t } = useTranslation();
  const { messages, earlier } = mergedChat(cards);
  if (messages.length === 0) return null;
  const title = t('assistant.card.collab.chatTitle');
  return (
    <CardFrame label={title} surface="secondary">
      <CardHeader
        icon={MessageCircle}
        tone="info"
        title={title}
        actions={<CardOpenButton target={CHAT_TARGET} labelKey="assistant.card.collab.openChat" />}
      />
      <div className="mt-2 flex flex-col">
        {earlier > 0 && (
          <span className="self-center rounded-full bg-surface-card px-3 py-0.5 text-caption text-content-faint">
            {t('assistant.card.collab.earlier', { count: earlier })}
          </span>
        )}
        <CollabChatThread messages={messages} />
      </div>
    </CardFrame>
  );
}

/** A change row's bubble, on the chat panel's surface, marked by how the change stands. */
export function CollabChatBody({ card, item }: { card: ChatCard; item: ChangeItem }) {
  return (
    <div className="rounded-xl bg-surface-secondary px-2 pb-1.5 pt-0.5">
      <CollabChatThread messages={card.messages} state={item.state} />
    </div>
  );
}
