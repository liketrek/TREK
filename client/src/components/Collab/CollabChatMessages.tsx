import React from 'react'
import { Trash2, Reply, ChevronUp } from 'lucide-react'
import { Tooltip } from '../shared/Tooltip'
import { URL_REGEX } from './CollabChat.constants'
import { formatChatClockTime, formatChatDateSeparator, isFromAssistant, shouldShowChatDateSeparator } from './collabModel'
import CollabAssistantBadge from './CollabAssistantBadge'
import { ChatAvatar, ChatBigEmoji, ChatBubble, ChatDateSeparator, ChatReactions, ChatSenderName, ChatTime } from './CollabChatBubble'
import { MessageText } from './CollabChatMessageText'
import { CollabChatAttachment } from './CollabChatAttachment'
import { LinkPreview } from './CollabChatLinkPreview'
import { ReactionBadge } from './CollabChatReactionBadge'
import EmptyState from '../shared/EmptyState'

export function ChatMessages(props: any) {
  const { currentUser, tripId, t, is12h, can, trip, canEdit, messages, setMessages, loading, setLoading, hasMore, setHasMore, loadingMore, setLoadingMore, text, setText, replyTo, setReplyTo, hoveredId, setHoveredId, sending, setSending, showEmoji, setShowEmoji, reactMenu, setReactMenu, deletingIds, setDeletingIds, deleteTimersRef, containerRef, messagesRef, scrollRef, textareaRef, emojiBtnRef, isAtBottom, scrollToBottom, checkAtBottom, handleLoadMore, handleTextChange, handleSend, handleKeyDown, handleDelete, handleReact, handleEmojiSelect, isOwn, isEmojiOnly } = props
  return (
    <>
      {/* Messages */}
      {messages.length === 0 ? (
        // flex-1, like the message list it stands in for: without it the empty
        // state was only as tall as its own content and the composer rode up to
        // sit right under the mascot, with the rest of the panel left blank.
        <EmptyState scene="chat" title={t('collab.chat.empty')} className="min-h-0 flex-1" />
      ) : (
        <div ref={scrollRef} onScroll={checkAtBottom} className="chat-scroll" style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 14px 4px', WebkitOverflowScrolling: 'touch',
          display: 'flex', flexDirection: 'column', gap: 1,
        }}>
          {hasMore && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 10px' }}>
              <button type="button" onClick={handleLoadMore} disabled={loadingMore} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600,
                color: 'var(--text-muted)', background: 'var(--bg-secondary)', border: '1px solid var(--border-faint)',
                borderRadius: 99, padding: '5px 14px', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <ChevronUp size={13} />
                {loadingMore ? '...' : t('collab.chat.loadMore')}
              </button>
            </div>
          )}

          {messages.map((msg, idx) => {
            const own = isOwn(msg)
            const prevMsg = messages[idx - 1]
            const nextMsg = messages[idx + 1]
            const isNewGroup = idx === 0 || String(prevMsg?.user_id) !== String(msg.user_id)
            const isLastInGroup = !nextMsg || String(nextMsg?.user_id) !== String(msg.user_id)
            const showDate = shouldShowChatDateSeparator(msg, prevMsg)
            const showAvatar = !own && isLastInGroup
            const bigEmoji = isEmojiOnly(msg.text)
            const hasReply = msg.reply_text || msg.reply_to
            // Deleted message placeholder
            if (msg._deleted) {
              return (
                <React.Fragment key={msg.id}>
                  {showDate && <ChatDateSeparator label={formatChatDateSeparator(msg.created_at, t)} />}
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                    <span style={{ display: 'inline-flex', gap: 6, fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', fontStyle: 'italic' }}>
                      <span>{msg.username} {t('collab.chat.deletedMessage') || 'deleted a message'}</span>
                      <span style={{ fontStyle: 'normal' }}>{formatChatClockTime(msg.created_at, is12h)}</span>
                    </span>
                  </div>
                </React.Fragment>
              )
            }

            return (
              <React.Fragment key={msg.id}>
                {/* Date separator */}
                {showDate && <ChatDateSeparator label={formatChatDateSeparator(msg.created_at, t)} />}

                <div style={{
                  display: 'flex', alignItems: own ? 'flex-end' : 'flex-start',
                  flexDirection: own ? 'row-reverse' : 'row',
                  gap: 6, marginTop: isNewGroup ? 10 : 1,
                  paddingInlineStart: own ? 40 : 0, paddingInlineEnd: own ? 0 : 40,
                  transition: 'transform 0.3s ease, opacity 0.3s ease, max-height 0.3s ease',
                  ...(deletingIds.has(msg.id) ? { transform: 'scale(0.3)', opacity: 0, maxHeight: 0, marginTop: 0, overflow: 'hidden' } : {}),
                }}>
                  {/* Avatar slot for others */}
                  {!own && (
                    <div style={{ width: 28, flexShrink: 0, alignSelf: 'flex-end' }}>
                      {showAvatar && <ChatAvatar name={msg.username} src={msg.user_avatar || null} />}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: own ? 'flex-end' : 'flex-start', maxWidth: '78%', minWidth: 0 }}>
                    {/* Username for others at group start */}
                    {!own && isNewGroup && <ChatSenderName>{msg.username}</ChatSenderName>}
                    {isFromAssistant(msg) && (
                      <span className="mb-0.5 ps-1">
                        <CollabAssistantBadge name={msg.username} />
                      </span>
                    )}

                    {/* Bubble */}
                    <div
                      style={{ position: 'relative' }}
                      onMouseEnter={() => setHoveredId(msg.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onContextMenu={e => { e.preventDefault(); if (canEdit) setReactMenu({ msgId: msg.id, x: e.clientX, y: e.clientY }) }}
                      onTouchEnd={e => {
                        const now = Date.now()
                        const lastTap = Number(e.currentTarget.dataset.lastTap) || 0
                        if (now - lastTap < 300 && canEdit) {
                          e.preventDefault()
                          const touch = e.changedTouches?.[0]
                          if (touch) setReactMenu({ msgId: msg.id, x: touch.clientX, y: touch.clientY })
                        }
                        e.currentTarget.dataset.lastTap = String(now)
                      }}
                    >
                      {bigEmoji ? (
                        <ChatBigEmoji>{msg.text}</ChatBigEmoji>
                      ) : (
                        <ChatBubble
                          own={own}
                          lastInGroup={isLastInGroup}
                          reply={hasReply ? { name: msg.reply_username || '', text: (msg.reply_text || '').slice(0, 80) } : null}
                          text={<MessageText text={msg.text} />}
                        >
                          {msg.attachments?.map((attachment: any) => <CollabChatAttachment key={attachment.id} attachment={attachment} />)}
                          {(msg.text.match(URL_REGEX) || []).slice(0, 1).map(url => (
                            <LinkPreview key={url} url={url} tripId={tripId} own={own} onLoad={() => { if (isAtBottom.current) setTimeout(() => scrollToBottom('smooth'), 50) }} />
                          ))}
                        </ChatBubble>
                      )}

                      {/* Hover actions: above the reactions of the message before, which reach into this row */}
                      <div style={{
                        position: 'absolute', top: -14, zIndex: 3,
                        display: 'flex', gap: 2,
                        opacity: hoveredId === msg.id ? 1 : 0,
                        pointerEvents: hoveredId === msg.id ? 'auto' : 'none',
                        transition: 'opacity .1s',
                        ...(own ? { insetInlineStart: -6 } : { insetInlineEnd: -6 }),
                      }}>
                        <Tooltip label={t('collab.chat.reply')}>
                        <button type="button" onClick={() => setReplyTo(msg)} aria-label={t('collab.chat.reply')} style={{
                          width: 24, height: 24, borderRadius: '50%', border: 'none',
                          background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: 'var(--accent-text)', padding: 0,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'transform 0.12s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2)' }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                        >
                          <Reply size={11} />
                        </button>
                        </Tooltip>
                        {own && canEdit && (
                          <Tooltip label={t('common.delete')}>
                          <button type="button" onClick={() => handleDelete(msg.id)} aria-label={t('common.delete')} style={{
                            width: 24, height: 24, borderRadius: '50%', border: 'none',
                            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'var(--accent-text)', padding: 0,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'transform 0.12s, background 0.15s, color 0.15s',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2)'; e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff' }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-text)' }}
                          >
                            <Trash2 size={11} />
                          </button>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    {/* Reactions — iMessage style floating badge */}
                    {msg.reactions?.length > 0 && (
                      <ChatReactions own={own}>
                        {msg.reactions.map(r => (
                          <ReactionBadge key={r.emoji} reaction={r} currentUserId={currentUser.id} onReact={() => { if (canEdit) handleReact(msg.id, r.emoji) }} />
                        ))}
                      </ChatReactions>
                    )}

                    {/* Timestamp — only on last message of group */}
                    {isLastInGroup && <ChatTime>{formatChatClockTime(msg.created_at, is12h)}</ChatTime>}
                  </div>
                </div>
              </React.Fragment>
            )
          })}
        </div>
      )}

    </>
  )
}
