import { ActionBarPrimitive, AuiIf, MessagePrimitive } from '@assistant-ui/react';
import type { AssistantMessage as StoredMessage } from '@trek/shared';
import { Check, Copy, FileText, LoaderCircle, Share2 } from 'lucide-react';
import { useMemo } from 'react';

import { useTranslation } from '../../i18n';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { Tooltip } from '../shared/Tooltip';
import AssistantChangeCard from './AssistantChangeCard';
import AssistantFollowUps from './AssistantFollowUps';
import AssistantMarkdown from './AssistantMarkdown';
import AssistantMentionText from './AssistantMentionText';
import AssistantPlaceStrip from './AssistantPlaceStrip';
import AssistantShareDialog from './AssistantShareDialog';
import AssistantToolSteps from './AssistantToolSteps';
import AssistantWeatherStrip from './AssistantWeatherStrip';
import { messageBlocks } from './assistantParts';
import { useAssistantView } from './assistantViewContext';
import AssistantCardBlock from './cards/AssistantCardBlock';
import { useAssistantShare } from './useAssistantShare';

/**
 * One message of the chat. The user's question sits on the end side in a
 * quiet accent bubble; the answer runs as plain text across the column, with
 * its looked-up steps, the places and weather they found, the cards its
 * tools brought and the proposed changes in between, and a copy and a share
 * button that show on hover (always on the latest answer, and always on the
 * phone, which has no hover).
 */

const BAR_BUTTON =
  'rounded-md p-1 text-content-faint hover:bg-surface-hover hover:text-content-secondary disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent';

/** Posts the answer to the trip chat after a preview; a tick once it went. */
function ShareButton({ share }: { share: ReturnType<typeof useAssistantShare> }) {
  const { t } = useTranslation();
  if (share.shared) {
    return (
      <Tooltip label={t('assistant.share.shared')}>
        <span className="inline-flex p-1 text-content-faint">
          <Check size={14} aria-hidden="true" />
          <span className="sr-only">{t('assistant.share.shared')}</span>
        </span>
      </Tooltip>
    );
  }
  const label = share.offline ? t('assistant.error.offline') : t('assistant.share.button');
  return (
    <Tooltip label={label}>
      {/* The wrapper carries the tooltip while the button is off. */}
      <span className="inline-flex">
        <button
          type="button"
          onClick={share.open}
          disabled={share.offline || share.sending}
          aria-label={t('assistant.share.button')}
          className={BAR_BUTTON}
        >
          {share.sending ? (
            <LoaderCircle size={14} aria-hidden="true" className="animate-spin" />
          ) : (
            <Share2 size={14} aria-hidden="true" />
          )}
        </button>
      </span>
    </Tooltip>
  );
}

/** A file the user handed over, as a chip with what it is and how big. */
function AttachmentChip({ name, size }: { name: string; size: number }) {
  const kb = Math.max(1, Math.round(size / 1024));
  return (
    <span className="inline-flex max-w-full items-center gap-2.5 rounded-xl border border-edge-faint bg-surface-card py-2 pe-3.5 ps-2 shadow-card">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-content-secondary">
        <FileText size={16} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-col">
        <bdi className="truncate text-body font-medium text-content">{name}</bdi>
        <span className="text-caption tabular-nums text-content-muted">
          {kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`}
        </span>
      </span>
    </span>
  );
}

function Question({ message }: { message: StoredMessage }) {
  const text = message.parts.map((p) => (p.type === 'text' ? p.text : '')).join('');
  const files = message.parts.flatMap((p) => (p.type === 'attachment' ? [p] : []));
  const mentions = message.parts.flatMap((p) => (p.type === 'data-trek-mentions' ? p.data.items : []));
  return (
    <MessagePrimitive.Root className="trek-assistant-enter flex flex-col items-end gap-1.5 py-1.5">
      {files.map((f, i) => (
        <AttachmentChip key={`${f.name}-${i}`} name={f.name} size={f.size} />
      ))}
      {text && (
        <p
          dir="auto"
          className="m-0 max-w-[85%] whitespace-pre-wrap break-words rounded-xl bg-accent-subtle px-3.5 py-2 text-body text-content"
        >
          {mentions.length > 0 ? <AssistantMentionText text={text} items={mentions} /> : text}
        </p>
      )}
    </MessagePrimitive.Root>
  );
}

function Answer({ message }: { message: StoredMessage }) {
  const { t } = useTranslation();
  const { tripId, variant } = useAssistantView();
  const writing = useAssistantStore((s) => {
    const chat = chatOf(s, tripId);
    return chat.isRunning && chat.messages[chat.messages.length - 1]?.id === message.id;
  });
  const blocks = useMemo(() => messageBlocks(message, writing), [message, writing]);
  const share = useAssistantShare(tripId, message, writing);
  const last = blocks[blocks.length - 1];
  const hasText = blocks.some((b) => b.kind === 'text');

  return (
    <MessagePrimitive.Root className="trek-assistant-enter flex flex-col gap-2.5 py-2">
      {blocks.map((block) => {
        if (block.kind === 'text') {
          return <AssistantMarkdown key={block.key} text={block.text} writing={writing && block === last} />;
        }
        if (block.kind === 'steps') return <AssistantToolSteps key={block.key} steps={block.steps} />;
        if (block.kind === 'places') {
          return <AssistantPlaceStrip key={block.key} found={block.found} message={message} />;
        }
        if (block.kind === 'weather') return <AssistantWeatherStrip key={block.key} days={block.days} />;
        if (block.kind === 'cards') return <AssistantCardBlock key={block.key} block={block} message={message} />;
        return <AssistantChangeCard key={block.key} items={block.items} />;
      })}
      {/* Nothing below says the answer goes on: no words being written, no step running. */}
      {writing && last?.kind !== 'text' && last?.kind !== 'steps' && (
        <p role="status" className="m-0 text-caption">
          <span className="trek-assistant-shimmer">{t('assistant.step.working')}</span>
        </p>
      )}
      {hasText && !writing && (
        // The bar mounts on hover for older answers; the row keeps its height so nothing jumps.
        <div className="-mt-1 h-6">
          <ActionBarPrimitive.Root autohide={variant === 'fullscreen' ? 'never' : 'not-last'} className="-ms-1 flex">
            <ActionBarPrimitive.Copy aria-label={t('common.copy')} className={BAR_BUTTON}>
              <AuiIf condition={(s) => s.message.isCopied}>
                <Check size={14} aria-hidden="true" />
              </AuiIf>
              <AuiIf condition={(s) => !s.message.isCopied}>
                <Copy size={14} aria-hidden="true" />
              </AuiIf>
            </ActionBarPrimitive.Copy>
            {share.canShare && <ShareButton share={share} />}
          </ActionBarPrimitive.Root>
        </div>
      )}
      {share.canShare && <AssistantShareDialog share={share} />}
      <AssistantFollowUps message={message} />
    </MessagePrimitive.Root>
  );
}

export default function AssistantMessage({ message }: { message: StoredMessage }) {
  return message.role === 'user' ? <Question message={message} /> : <Answer message={message} />;
}
