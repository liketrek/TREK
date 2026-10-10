import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';

import { collabApi } from '../../api/client';
import { addListener, removeListener } from '../../api/websocket';
import type { useTranslation } from '../../i18n';
import type { useToast } from '../shared/Toast';
import type { ChatMessage, ChatReaction } from './collabModel';
import { MAX_CHAT_IMAGES, useChatImages } from './useChatImages';

/** A full page of messages; a shorter page means there is nothing older to load. */
const PAGE_SIZE = 100;

type MessagesResponse = ChatMessage[] | { messages?: ChatMessage[] };

function readMessages(data: MessagesResponse): ChatMessage[] {
  return (Array.isArray(data) ? data : data.messages || []).map((m) => (m.deleted ? { ...m, _deleted: true } : m));
}

export interface CollabChatDataOptions {
  tripId: number | string;
  t: ReturnType<typeof useTranslation>['t'];
  toast: ReturnType<typeof useToast>;
  /** The phone toasts a failed older page; the desktop panel stays quiet. */
  toastLoadMoreErrors?: boolean;
  /** The desktop panel scrolls down after a remote delete as it does after a new message. */
  scrollOnRemoteDelete?: boolean;
  /** The desktop panel reports how far an image upload got. */
  trackUploadProgress?: boolean;
  /** The phone refuses to send without the collab edit permission. */
  canSend?: boolean;
  /** Runs once a message went out, next to clearing the draft. */
  onSent?: () => void;
}

/**
 * The trip chat behind the desktop Collab panel and the phone's chat tab, which draw their
 * own message list and composer over it: the newest page on mount, older pages on demand,
 * the live WebSocket updates, the draft with its images and reply, and sending, deleting
 * and reacting. Collab has no store slice, so the messages live here.
 */
export function useCollabChatData({
  tripId,
  t,
  toast,
  toastLoadMoreErrors = false,
  scrollOnRemoteDelete = false,
  trackUploadProgress = false,
  canSend = true,
  onSent,
}: CollabChatDataOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const images = useChatImages();

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAtBottom = useRef(true);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior }));
  }, []);

  const checkAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    collabApi
      .getMessages(tripId)
      .then((data: MessagesResponse) => {
        if (cancelled) return;
        const msgs = readMessages(data);
        setMessages(msgs);
        setHasMore(msgs.length >= PAGE_SIZE);
        setLoading(false);
        setTimeout(() => scrollToBottom(), 30);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tripId, scrollToBottom]);

  useEffect(() => {
    const handler = (event: Record<string, unknown>) => {
      if (String(event.tripId) !== String(tripId)) return;
      if (event.type === 'collab:message:created') {
        const message = event.message as ChatMessage;
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
        if (isAtBottom.current) setTimeout(() => scrollToBottom('smooth'), 30);
      }
      if (event.type === 'collab:message:deleted') {
        const messageId = event.messageId as number;
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, _deleted: true } : m)));
        if (scrollOnRemoteDelete && isAtBottom.current) setTimeout(() => scrollToBottom('smooth'), 50);
      }
      if (event.type === 'collab:message:reacted') {
        const messageId = event.messageId as number;
        const reactions = event.reactions as ChatReaction[];
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
      }
    };
    addListener(handler);
    return () => removeListener(handler);
  }, [tripId, scrollToBottom, scrollOnRemoteDelete]);

  const handleLoadMore = useCallback(async () => {
    const current = messagesRef.current;
    if (loadingMore || current.length === 0) return;
    setLoadingMore(true);
    const el = scrollRef.current;
    const prevHeight = el ? el.scrollHeight : 0;
    try {
      const beforeId = current[0]?.id;
      const data: MessagesResponse = await collabApi.getMessages(
        tripId,
        beforeId != null ? String(beforeId) : undefined
      );
      const older = readMessages(data);
      if (older.length === 0) {
        setHasMore(false);
      } else {
        setMessages((prev) => [...older, ...prev]);
        setHasMore(older.length >= PAGE_SIZE);
        requestAnimationFrame(() => {
          if (el) el.scrollTop = el.scrollHeight - prevHeight;
        });
      }
    } catch {
      if (toastLoadMoreErrors) toast.error(t('common.error'));
    } finally {
      setLoadingMore(false);
    }
  }, [tripId, loadingMore, toastLoadMoreErrors, toast, t]);

  /** Keeps the draft box as tall as its text, up to 100px, then scrolls inside it. */
  const handleTextChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      const h = Math.min(ta.scrollHeight, 100);
      ta.style.height = `${h}px`;
      ta.style.overflowY = ta.scrollHeight > 100 ? 'auto' : 'hidden';
    }
  }, []);

  const addImageFiles = useCallback(
    (incoming: File[] | FileList) => {
      images.add(incoming, ({ rejected, overflow }) => {
        if (rejected) toast.error(t('collab.chat.imageRejected'));
        if (overflow) toast.error(t('collab.chat.imageLimit', { count: MAX_CHAT_IMAGES }));
      });
    },
    [images, toast, t]
  );

  const handleSend = useCallback(async () => {
    const body = text.trim();
    if ((!body && !images.files.length) || sending || !canSend) return;
    setSending(true);
    try {
      let data: { message?: ChatMessage } | undefined;
      if (images.files.length) {
        const form = new FormData();
        if (body) form.append('text', body);
        if (replyTo) form.append('reply_to', String(replyTo.id));
        images.files.forEach((file) => form.append('images', file));
        data = trackUploadProgress
          ? await collabApi.sendMessage(tripId, form, {
              onUploadProgress: (e) => setUploadProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
            })
          : await collabApi.sendMessage(tripId, form);
      } else {
        const payload: { text: string; reply_to?: number } = { text: body };
        if (replyTo) payload.reply_to = replyTo.id;
        data = await collabApi.sendMessage(tripId, payload);
      }
      const sent = data?.message;
      if (sent) {
        setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
      }
      setText('');
      setReplyTo(null);
      onSent?.();
      images.clear();
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      isAtBottom.current = true;
      setTimeout(() => scrollToBottom('smooth'), 50);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  }, [text, sending, canSend, replyTo, tripId, trackUploadProgress, onSent, scrollToBottom, toast, t, images]);

  /** Deletes a message on the server and leaves its "deleted" placeholder in the list. */
  const deleteMessage = useCallback(
    async (msgId: number) => {
      try {
        await collabApi.deleteMessage(tripId, msgId);
        setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, _deleted: true } : m)));
      } catch {
        toast.error(t('common.error'));
      }
    },
    [tripId, toast, t]
  );

  const reactToMessage = useCallback(
    async (msgId: number, emoji: string) => {
      try {
        const data = (await collabApi.reactMessage(tripId, msgId, emoji)) as { reactions: ChatReaction[] };
        setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, reactions: data.reactions } : m)));
      } catch {
        toast.error(t('common.error'));
      }
    },
    [tripId, toast, t]
  );

  // The setters, messagesRef and isAtBottom are only here because useCollabChat hands them
  // on in the return shape the desktop chat panel has always had; nothing writes them.
  return {
    messages,
    setMessages,
    loading,
    setLoading,
    hasMore,
    setHasMore,
    loadingMore,
    setLoadingMore,
    text,
    setText,
    replyTo,
    setReplyTo,
    sending,
    setSending,
    uploadProgress,
    images,
    scrollRef,
    textareaRef,
    isAtBottom,
    messagesRef,
    scrollToBottom,
    checkAtBottom,
    handleLoadMore,
    handleTextChange,
    addImageFiles,
    handleSend,
    deleteMessage,
    reactToMessage,
  };
}
