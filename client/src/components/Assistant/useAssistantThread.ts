import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useTranslation } from '../../i18n';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useToast } from '../shared/Toast';

/**
 * The chat around the messages, shared by the desktop window and the phone
 * screen: which conversation is open, the latest ones to switch to, starting
 * a new one or deleting this one, and how long chats are kept. Each view
 * draws its own header from it.
 *
 * Showing the chat resumes the trip's latest conversation; hiding it (the
 * window closed, the screen left) stops an answer still being written, so no
 * stream runs on with nobody watching.
 */
export function useAssistantThread(tripId: number) {
  const { t } = useTranslation();
  const toast = useToast();
  const { threadId, threads, isRunning } = useAssistantStore(
    useShallow((s) => {
      const chat = chatOf(s, tripId);
      return { threadId: chat.threadId, threads: chat.threads, isRunning: chat.isRunning };
    })
  );
  const retention = useAssistantStore((s) => s.status?.retention ?? null);
  const resume = useAssistantStore((s) => s.resume);
  const loadThreads = useAssistantStore((s) => s.loadThreads);
  const openThread = useAssistantStore((s) => s.openThread);
  const newThread = useAssistantStore((s) => s.newThread);
  const deleteThread = useAssistantStore((s) => s.deleteThread);
  const cancel = useAssistantStore((s) => s.cancel);

  useEffect(() => {
    void resume(tripId);
    return () => cancel(tripId);
  }, [tripId, resume, cancel]);

  const title = (threadId !== null && threads?.find((th) => th.id === threadId)?.title) || null;

  let retentionNote: string | null = null;
  if (retention?.mode === 'forever') retentionNote = t('assistant.history.forever');
  else if (retention?.mode === 'days') retentionNote = t('assistant.history.retention', { count: retention.days });

  const removeThread = async () => {
    if (threadId === null) return;
    try {
      await deleteThread(tripId, threadId);
    } catch {
      toast.error(t('assistant.error.generic'));
    }
  };

  return {
    threadId,
    /** The latest conversations of this trip; null until loaded. */
    threads,
    /** The open conversation's title; null for a new one. */
    title,
    isRunning,
    retentionNote,
    refreshThreads: () => void loadThreads(tripId),
    openThread: (id: number) => void openThread(tripId, id),
    newThread: () => newThread(tripId),
    removeThread,
    stop: () => cancel(tripId),
  };
}
