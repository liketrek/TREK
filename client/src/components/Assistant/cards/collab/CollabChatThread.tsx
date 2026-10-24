import type { CollabBubbleCard } from '@trek/shared';
import { Check, Clock, Paperclip, TriangleAlert } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { useSettingsStore } from '../../../../store/settingsStore';
import { avatarSrc } from '../../../../utils/avatarSrc';
import CollabAssistantBadge from '../../../Collab/CollabAssistantBadge';
import {
  ChatAvatar,
  ChatBigEmoji,
  ChatBubble,
  ChatDateSeparator,
  ChatReactions,
  ChatSenderName,
  ChatTime,
} from '../../../Collab/CollabChatBubble';
import { MessageText } from '../../../Collab/CollabChatMessageText';
import { TwemojiImg } from '../../../Collab/CollabChatTwemojiImg';
import { formatChatClockTime, formatChatDateSeparator, isEmojiOnlyText } from '../../../Collab/collabModel';
import { SoftPill } from '../../../Planner/planParts';
import { Tooltip } from '../../../shared/Tooltip';
import type { ChangeState } from '../../assistantParts';
import { useAssistantView } from '../../assistantViewContext';
import { useViewerId } from '../parts/useViewerId';
import { type BubbleSpot, bubbleStatus, isDropped, spotOf } from './collabCardModel';

/**
 * Messages of the trip chat drawn as the chat draws them, from the pieces the
 * Collab tab uses: the others on one side with their face and name, the
 * user's own on the other in the accent, a day between days, the reactions
 * floating under a bubble, the time under the last of a run. A read-only
 * copy: no hover actions, links read as words, only the tooltips answer. A
 * held change marks its bubble: a send says it is not sent yet (then sent or
 * not sent), a delete strikes it, a reaction rings the emoji it toggles (and
 * keeps a faint pill for one it takes away).
 */

/** One reaction as the chat's floating pill shows it, the names in its tooltip. */
function Reaction({ reaction, held }: { reaction: CollabBubbleCard['reactions'][number]; held: boolean }) {
  const names = reaction.names.join(', ');
  return (
    <Tooltip label={names || reaction.emoji}>
      <span
        aria-label={`${reaction.emoji} ${reaction.count}${names ? `: ${names}` : ''}`}
        className={`inline-flex items-center gap-0.5 rounded-full px-[3px] py-px ${held ? 'border border-dashed border-accent' : ''}`}
      >
        <TwemojiImg emoji={reaction.emoji} size={16} />
        {reaction.count > 1 && (
          <span className="min-w-2 text-caption font-bold tabular-nums text-content-muted">{reaction.count}</span>
        )}
      </span>
    </Tooltip>
  );
}

/**
 * The reaction a held toggle takes away when it was the user's only one on
 * that emoji: the server drops its pill, so the card keeps it faint in a
 * dashed ring until the change is applied, rather than showing nothing.
 */
function TakenBack({ emoji }: { emoji: string }) {
  const { t } = useTranslation();
  const label = t('assistant.card.collab.reactionRemoved', { emoji });
  return (
    <Tooltip label={label}>
      <span
        aria-label={label}
        className="inline-flex items-center rounded-full border border-dashed border-accent px-[3px] py-px opacity-40"
      >
        <TwemojiImg emoji={emoji} size={16} />
      </span>
    </Tooltip>
  );
}

/** A file sent with a message: an image in the bubble, any other file by its name. */
function ChatFile({ file, tripId }: { file: CollabBubbleCard['files'][number]; tripId: number }) {
  const { t } = useTranslation();
  if (file.image) {
    return (
      <img
        src={`/api/trips/${tripId}/files/${file.fileId}/download`}
        alt={file.name ?? t('collab.chat.attachedImage')}
        className="mt-1 block max-h-40 w-[140px] max-w-full rounded-[10px] object-cover"
      />
    );
  }
  return (
    <span className="mt-1 flex max-w-full" title={file.name ?? undefined}>
      <SoftPill icon={<Paperclip size={10} strokeWidth={2.2} aria-hidden="true" />} className="max-w-full">
        <bdi className="truncate">{file.name ?? t('collab.chat.attachedImage')}</bdi>
      </SoftPill>
    </span>
  );
}

/** The time slot under the last bubble of a run: the time, or how a held send stands. */
function Status({ bubble, state }: { bubble: CollabBubbleCard; state: ChangeState | null }) {
  const { t } = useTranslation();
  const is12h = useSettingsStore((s) => s.settings.time_format === '12h');
  const status = bubbleStatus(bubble, state);
  const time = bubble.at ? formatChatClockTime(bubble.at, is12h) : null;
  if (status === 'none') return null;
  if (status === 'waiting') {
    return (
      <ChatTime>
        <span className="inline-flex items-center gap-1">
          <Clock size={10} aria-hidden="true" />
          {t('assistant.card.collab.notSent')}
        </span>
      </ChatTime>
    );
  }
  if (status === 'failed') {
    return (
      <ChatTime>
        <span className="inline-flex items-center gap-1 text-danger">
          <TriangleAlert size={10} aria-hidden="true" />
          {t('assistant.card.collab.failed')}
        </span>
      </ChatTime>
    );
  }
  return (
    <ChatTime>
      <span className="inline-flex items-center gap-1">
        {time}
        {status === 'sent' && (
          <Check
            size={10}
            strokeWidth={2.6}
            role="img"
            aria-label={t('assistant.card.collab.sent')}
            className="text-success"
          />
        )}
      </span>
    </ChatTime>
  );
}

/** A removed message once the removal was applied: the chat's own placeholder line. */
function Removed() {
  const { t } = useTranslation();
  return (
    <div className="flex justify-center py-1">
      <span className="text-caption italic text-content-faint">{t('assistant.card.collab.youDeleted')}</span>
    </div>
  );
}

/** What one bubble of a thread is drawn with. */
interface BubbleProps {
  bubble: CollabBubbleCard;
  spot: BubbleSpot;
  own: boolean;
  state: ChangeState | null;
}

/** The face beside someone else's bubble, on the last of their run; smaller on the phone. */
function Face({ bubble, spot }: Pick<BubbleProps, 'bubble' | 'spot'>) {
  const { variant } = useAssistantView();
  const size = variant === 'fullscreen' ? 24 : 28;
  return (
    <div className="flex-none self-end" style={{ width: size }}>
      {spot.lastInGroup && (
        <ChatAvatar name={bubble.author.name} src={avatarSrc(bubble.author.avatarKey)} size={size} />
      )}
    </div>
  );
}

/** The bubble itself (or emoji alone, drawn large) with its files. */
function Words({ bubble, spot, own }: Pick<BubbleProps, 'bubble' | 'spot' | 'own'>) {
  const { tripId } = useAssistantView();
  if (bubble.files.length === 0 && isEmojiOnlyText(bubble.text)) return <ChatBigEmoji>{bubble.text}</ChatBigEmoji>;
  return (
    <ChatBubble
      own={own}
      lastInGroup={spot.lastInGroup}
      reply={bubble.reply}
      text={<MessageText text={bubble.text} plain />}
    >
      {bubble.files.map((file) => (
        <ChatFile key={file.fileId} file={file} tripId={tripId} />
      ))}
    </ChatBubble>
  );
}

/** Everything in the column of one bubble: the name, the assistant mark, the bubble, its reactions and its time. */
function Column({ bubble, spot, own, state }: BubbleProps) {
  const { t } = useTranslation();
  const { variant } = useAssistantView();
  const reacting = bubble.change === 'react' && state !== 'applied';
  const held = (emoji: string) => reacting && emoji === bubble.reactEmoji;
  const takenBack =
    reacting && bubble.reactEmoji && !bubble.reactions.some((r) => r.emoji === bubble.reactEmoji)
      ? bubble.reactEmoji
      : null;
  return (
    <div
      className={`flex min-w-0 flex-col ${own ? 'items-end' : 'items-start'}`}
      style={{ maxWidth: variant === 'fullscreen' ? '85%' : '78%' }}
    >
      {!own && spot.newGroup && <ChatSenderName>{bubble.author.name}</ChatSenderName>}
      {bubble.fromAssistant && (
        <span className="mb-0.5 ps-1">
          <CollabAssistantBadge name={bubble.author.name} />
        </span>
      )}
      <div className={bubble.change === 'remove' ? 'line-through' : ''}>
        <Words bubble={bubble} spot={spot} own={own} />
      </div>
      {(bubble.reactions.length > 0 || takenBack) && (
        <ChatReactions own={own}>
          {bubble.reactions.map((reaction) => (
            <Reaction key={reaction.emoji} reaction={reaction} held={held(reaction.emoji)} />
          ))}
          {takenBack && <TakenBack emoji={takenBack} />}
        </ChatReactions>
      )}
      {bubble.cut && (
        <span className="px-1 text-caption text-content-faint">{t('assistant.card.collab.continues')}</span>
      )}
      {spot.lastInGroup && <Status bubble={bubble} state={state} />}
    </div>
  );
}

/** One message: the day before it when it changes, then its row on its sender's side. */
function BubbleRow({ bubble, spot, own, state }: BubbleProps) {
  const { t, locale } = useTranslation();
  const removing = bubble.change === 'remove';
  const day = spot.newDay && bubble.at && <ChatDateSeparator label={formatChatDateSeparator(bubble.at, t, locale)} />;
  if (removing && state === 'applied') {
    return (
      <>
        {day}
        <Removed />
      </>
    );
  }
  const dimmed = removing || (bubble.change === 'send' && isDropped(state));
  return (
    <>
      {day}
      <div
        className={`flex gap-1.5 ${own ? 'flex-row-reverse items-end' : 'flex-row items-start'} ${dimmed ? 'opacity-60' : ''}`}
        style={{ marginTop: spot.newGroup ? 10 : 1, paddingInlineStart: own ? 40 : 0, paddingInlineEnd: own ? 0 : 40 }}
      >
        {!own && <Face bubble={bubble} spot={spot} />}
        <Column bubble={bubble} spot={spot} own={own} state={state} />
      </div>
    </>
  );
}

export default function CollabChatThread({
  messages,
  state = null,
}: {
  messages: readonly CollabBubbleCard[];
  /** The decision on the change the thread shows; null for an answer. */
  state?: ChangeState | null;
}) {
  const viewerId = useViewerId();
  return (
    <div className="flex flex-col gap-px">
      {messages.map((bubble, index) => (
        <BubbleRow
          key={bubble.id ?? `new-${index}`}
          bubble={bubble}
          spot={spotOf(messages, index)}
          own={bubble.author.id === viewerId}
          state={state}
        />
      ))}
    </div>
  );
}
