import { Ellipsis, History, Lightbulb, LightbulbOff, NotebookPen, Plus, Settings, Trash2, X } from 'lucide-react';
import { type HTMLAttributes, type MouseEvent, useState } from 'react';
import { useNavigate } from 'react-router';

import { useTranslation } from '../../i18n';
import { assistantScopeOf } from '../../store/assistantChatKey';
import { PopoverItem } from '../Packing/PackingPopover';
import ConfirmDialog from '../shared/ConfirmDialog';
import { ContextMenu, useContextMenu } from '../shared/ContextMenu';
import { NEUTRAL_TINT } from '../shared/DialogShell';
import Tooltip from '../shared/Tooltip';
import { PopoverListPanel } from '../shared/dialogParts';
import { usePopoverList } from '../shared/usePopoverList';
import AssistantMemoryDialog from './AssistantMemoryDialog';
import { AI_SETTINGS_PATH } from './assistantParts';
import { useAssistantHintsSetting } from './useAssistantHints';
import { useAssistantLiveStep } from './useAssistantLiveStep';
import type { useAssistantThread } from './useAssistantThread';
import { useTripMemory } from './useTripMemory';

// The round, raised buttons of TREK's dialog heads.
const ICON_BUTTON =
  'grid h-7 w-7 place-items-center rounded-full bg-surface-card text-content-muted shadow-sm transition-colors hover:text-content';

interface AssistantHeaderProps {
  tripId: number;
  thread: ReturnType<typeof useAssistantThread>;
  tripTitle: string;
  onClose: () => void;
  /** Moves the window: spread on the title, which is the part of the header to grab. */
  dragProps: HTMLAttributes<HTMLElement>;
}

/**
 * The window's head, in the look of TREK's dialog heads: a tinted band with
 * a small line naming the assistant over the conversation's name; the band is where the window is
 * grabbed to move it. On the end side the recent chats (a new chat starts at
 * the top of that list), more and close, as round raised buttons. Closing
 * keeps the conversation, and an answer being written goes on. The model is not picked here;
 * that lives in the settings. Notes are a trip's: a journey's chat in TREK Studio shows no notes button.
 */
export default function AssistantHeader({ tripId, thread, tripTitle, onClose, dragProps }: AssistantHeaderProps) {
  const { t, locale } = useTranslation();
  const live = useAssistantLiveStep(tripId);
  const memory = useTripMemory(tripId);
  // Trip notes belong to a trip: a journey's turns never read them (assistant-scope.ts turnOf).
  const tripChat = assistantScopeOf(tripId).kind === 'trip';
  const [memoryOpen, setMemoryOpen] = useState(false);
  const navigate = useNavigate();
  const menu = useContextMenu();
  const [confirming, setConfirming] = useState(false);
  const threads = thread.threads ?? [];
  const history = usePopoverList(threads.findIndex((th) => th.id === thread.threadId) + 1);
  const { open: historyOpen, triggerRef: historyTrigger, listId: historyListId } = history;
  const hints = useAssistantHintsSetting();

  const openHistory = () => {
    if (!history.open) thread.refreshThreads();
    history.toggle();
  };

  const pick = (run: () => void) => {
    history.close();
    run();
  };

  const openMenu = (e: MouseEvent) =>
    menu.open(
      e,
      [
        {
          label: t('assistant.history.new'),
          icon: Plus,
          disabled: thread.threadId === null && !thread.isRunning,
          onClick: thread.newThread,
        },
        {
          label: t(hints.on ? 'assistant.hint.menuOff' : 'assistant.hint.menuOn'),
          icon: hints.on ? LightbulbOff : Lightbulb,
          onClick: hints.toggle,
        },
        { label: t('assistant.window.settings'), icon: Settings, onClick: () => void navigate(AI_SETTINGS_PATH) },
        {
          label: t('assistant.window.deleteThread'),
          icon: Trash2,
          danger: true,
          disabled: thread.threadId === null || thread.isRunning,
          onClick: () => setConfirming(true),
        },
      ],
      true
    );

  return (
    <header
      className="flex flex-shrink-0 items-center gap-2 border-b border-edge-faint py-2.5 pe-2.5 ps-4"
      style={{ background: NEUTRAL_TINT }}
    >
      <div
        {...dragProps}
        className="flex min-w-0 flex-1 cursor-grab touch-none select-none items-center active:cursor-grabbing"
      >
        <div className="min-w-0 flex-1">
          {thread.isRunning ? (
            // While it works, the line over the title says what it does right now.
            <p role="status" className="m-0 flex min-w-0 items-center gap-1.5 text-caption font-medium">
              <span
                aria-hidden="true"
                className="trek-assistant-pulse h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent"
              />
              <span className="trek-assistant-shimmer truncate">{live?.text ?? t('assistant.step.working')}</span>
            </p>
          ) : (
            <p className="m-0 truncate font-geist text-caption font-bold uppercase tracking-[.08em] text-content-muted">
              {t('assistant.launcher.tooltip')}
            </p>
          )}
          <h2 className="m-0 truncate text-body font-bold tracking-[-0.01em] text-content">
            <bdi>{thread.title ?? tripTitle}</bdi>
          </h2>
        </div>
      </div>
      {/* Buttons are no place to start a drag from. */}
      <div
        className="flex flex-shrink-0 items-center gap-1"
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        {tripChat && (
          <Tooltip label={t(memory.has ? 'assistant.memory.edit' : 'assistant.memory.title')}>
            <button
              type="button"
              onClick={() => setMemoryOpen(true)}
              aria-label={t('assistant.memory.title')}
              className={`relative ${ICON_BUTTON}`}
            >
              <NotebookPen size={13} aria-hidden="true" />
              {memory.has && (
                <span
                  aria-hidden="true"
                  className="absolute -end-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-[color:var(--bg-elevated)]"
                />
              )}
            </button>
          </Tooltip>
        )}
        <Tooltip label={t('assistant.history.open')}>
          <button
            ref={historyTrigger}
            type="button"
            onClick={openHistory}
            aria-label={t('assistant.history.open')}
            aria-expanded={historyOpen}
            aria-controls={historyOpen ? historyListId : undefined}
            className={ICON_BUTTON}
          >
            <History size={13} aria-hidden="true" />
          </button>
        </Tooltip>
        <Tooltip label={t('assistant.window.menu')}>
          <button
            type="button"
            onClick={openMenu}
            aria-label={t('assistant.window.menu')}
            aria-haspopup="menu"
            className={ICON_BUTTON}
          >
            <Ellipsis size={14} aria-hidden="true" />
          </button>
        </Tooltip>
        <Tooltip label={t('common.close')}>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className={ICON_BUTTON}>
            <X size={14} aria-hidden="true" />
          </button>
        </Tooltip>
      </div>

      <PopoverListPanel list={history} label={t('assistant.history.open')} className="w-72">
        <PopoverItem
          icon={<Plus size={14} />}
          label={t('assistant.history.new')}
          onClick={() => pick(thread.newThread)}
        />
        {threads.length === 0 ? (
          <p className="m-0 px-2.5 py-2 text-caption text-content-muted">{t('assistant.history.empty')}</p>
        ) : (
          threads.map((th) => (
            <PopoverItem
              key={th.id}
              icon={null}
              label={th.title}
              active={th.id === thread.threadId}
              onClick={() => pick(() => thread.openThread(th.id))}
              trailing={
                <span className="flex-shrink-0 text-caption text-content-faint">
                  {new Date(th.lastMessageAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                </span>
              }
            />
          ))
        )}
        {thread.retentionNote && (
          <p className="m-0 border-t border-edge-faint px-2.5 pb-1 pt-2 text-caption text-content-faint">
            {thread.retentionNote}
          </p>
        )}
      </PopoverListPanel>

      <ContextMenu menu={menu.menu} onClose={menu.close} />
      {memoryOpen && <AssistantMemoryDialog tripId={tripId} onClose={() => setMemoryOpen(false)} />}
      <ConfirmDialog
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          void thread.removeThread();
        }}
        title={t('assistant.window.deleteThread')}
        message={t('assistant.window.deleteConfirm')}
        confirmLabel={t('common.delete')}
      />
    </header>
  );
}
