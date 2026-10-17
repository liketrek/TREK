import { useState, useEffect, useRef, useCallback, type ClipboardEvent, type DragEvent } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { useCanDo } from '../../store/permissionsStore'
import { useTripStore } from '../../store/tripStore'
import { useTranslation } from '../../i18n'
import { useCollabChatData } from './useCollabChatData'
import { isEmojiOnlyText } from './collabModel'
import { useToast } from '../shared/Toast'

export function useCollabChat(tripId: any, currentUser: any) {
  const { t } = useTranslation()
  const toast = useToast()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  const can = useCanDo()
  const trip = useTripStore((s) => s.trip)
  const canEdit = can('collab_edit', trip)

  const [hoveredId, setHoveredId] = useState(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [reactMenu, setReactMenu] = useState(null) // { msgId, x, y }
  const [deletingIds, setDeletingIds] = useState(new Set())
  const deleteTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const hideEmoji = useCallback(() => setShowEmoji(false), [])
  const chat = useCollabChatData({
    tripId, t, toast, scrollOnRemoteDelete: true, trackUploadProgress: true, onSent: hideEmoji,
  })
  const {
    messages, setMessages, loading, setLoading, hasMore, setHasMore, loadingMore, setLoadingMore,
    text, setText, replyTo, setReplyTo, sending, setSending, images, uploadProgress, scrollRef, textareaRef,
    isAtBottom, messagesRef, scrollToBottom, checkAtBottom, handleLoadMore, handleTextChange, addImageFiles, handleSend,
    deleteMessage, reactToMessage,
  } = chat

  useEffect(() => {
    return () => { deleteTimersRef.current.forEach(clearTimeout) }
  }, [])

  const containerRef = useRef(null)
  const emojiBtnRef = useRef(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const removeImage = images.remove
  const handlePaste = useCallback((e: ClipboardEvent) => { if (e.clipboardData.files.length) addImageFiles(e.clipboardData.files) }, [addImageFiles])
  const handleDrop = useCallback((e: DragEvent) => { e.preventDefault(); addImageFiles(e.dataTransfer.files) }, [addImageFiles])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }, [handleSend])

  const handleDelete = useCallback(async (msgId) => {
    requestAnimationFrame(() => {
      setDeletingIds(prev => new Set(prev).add(msgId))
    })
    const timer = setTimeout(async () => {
      await deleteMessage(msgId)
      setDeletingIds(prev => { const s = new Set(prev); s.delete(msgId); return s })
    }, 400)
    deleteTimersRef.current.push(timer)
  }, [deleteMessage])

  const handleReact = useCallback(async (msgId, emoji) => {
    setReactMenu(null)
    await reactToMessage(msgId, emoji)
  }, [reactToMessage])

  const handleEmojiSelect = useCallback((emoji) => {
    setText(prev => prev + emoji)
    textareaRef.current?.focus()
  }, [setText, textareaRef])

  const isOwn = (msg) => String(msg.user_id) === String(currentUser.id)

  // Check if message is only emoji (1-3 emojis, no other text)
  const isEmojiOnly = isEmojiOnlyText

  return { currentUser, tripId, t, is12h, can, trip, canEdit, messages, setMessages, loading, setLoading, hasMore, setHasMore, loadingMore, setLoadingMore, text, setText, replyTo, setReplyTo, hoveredId, setHoveredId, sending, setSending, showEmoji, setShowEmoji, reactMenu, setReactMenu, deletingIds, setDeletingIds, deleteTimersRef, containerRef, messagesRef, scrollRef, textareaRef, emojiBtnRef, imageInputRef, imageFiles: images.files, imagePreviews: images.previews, uploadProgress, addImageFiles, removeImage, handlePaste, handleDrop, isAtBottom, scrollToBottom, checkAtBottom, handleLoadMore, handleTextChange, handleSend, handleKeyDown, handleDelete, handleReact, handleEmojiSelect, isOwn, isEmojiOnly }
}
