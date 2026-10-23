import type { ReactNode } from 'react';

import { bubbleRadius } from './collabModel';

/**
 * The pieces a message of the trip chat is drawn with, shared by the Collab
 * tab and the assistant chat's cards so a message looks the same in both:
 * the bubble with its tail and the quote it answers, the face beside it, the
 * name over a group, the day between groups, the floating reactions and the
 * time under the last message. Each piece only draws; what it does on a
 * click or a hover stays with the caller.
 */

/** A face beside the last message of a group: the picture, else the first letter. */
export function ChatAvatar({ name, src, size = 28 }: { name: string; src: string | null; size?: number }) {
  if (src) {
    return <img src={src} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'calc(11px * var(--fs-scale-caption, 1))',
        fontWeight: 700,
        color: 'var(--text-muted)',
      }}
    >
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

/** "Today", "Yesterday" or a date between two groups of messages. */
export function ChatDateSeparator({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 6px' }}>
      <span
        style={{
          fontSize: 'calc(10px * var(--fs-scale-caption, 1))',
          fontWeight: 600,
          color: 'var(--text-faint)',
          background: 'var(--bg-card)',
          padding: '3px 12px',
          borderRadius: 99,
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </div>
  );
}

/** The name over the first message of someone else's group. */
export function ChatSenderName({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontSize: 'calc(10px * var(--fs-scale-caption, 1))',
        fontWeight: 600,
        color: 'var(--text-faint)',
        marginBottom: 2,
        paddingInlineStart: 4,
      }}
    >
      {children}
    </span>
  );
}

/** One to three emoji alone, drawn large without a bubble. */
export function ChatBigEmoji({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 'calc(40px * var(--fs-scale-title, 1))', lineHeight: 1.2, padding: '2px 0' }}>
      {children}
    </div>
  );
}

/**
 * The bubble: the user's own in the accent with its tail on their side, the
 * others as cards on the tinted panel; the tail only on the last message of
 * a group. A reply carries the quote of the message it answers on top.
 */
export function ChatBubble({
  own,
  lastInGroup,
  reply,
  text,
  children,
}: {
  own: boolean;
  lastInGroup: boolean;
  reply: { name: string; text: string } | null;
  /** The message's words. */
  text: ReactNode;
  /** What comes under the words: images, a link preview. */
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        // Own messages in the accent, the others as cards on the tinted panel.
        background: own ? 'var(--accent)' : 'var(--bg-card)',
        color: own ? 'var(--accent-text)' : 'var(--text-primary)',
        border: own ? 'none' : '1px solid var(--border-faint)',
        ...bubbleRadius(own, lastInGroup),
        padding: reply ? '4px 4px 8px 4px' : '8px 14px',
        fontSize: 'calc(14px * var(--fs-scale-body, 1))',
        lineHeight: 1.4,
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }}
    >
      {reply && (
        <div
          style={{
            padding: '5px 10px',
            marginBottom: 4,
            borderRadius: 12,
            background: own ? 'color-mix(in srgb, var(--accent-text) 15%, transparent)' : 'var(--bg-secondary)',
            fontSize: 'calc(12px * var(--fs-scale-body, 1))',
            lineHeight: 1.3,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: 'calc(11px * var(--fs-scale-caption, 1))',
              opacity: 0.7,
              marginBottom: 1,
            }}
          >
            {reply.name}
          </div>
          <div style={{ opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {reply.text}
          </div>
        </div>
      )}
      {reply ? <div style={{ padding: '0 10px 4px' }}>{text}</div> : text}
      {children}
    </div>
  );
}

/** The reactions floating under a bubble, on its side, in one pill. */
export function ChatReactions({ own, children }: { own: boolean; children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 3,
        marginTop: -6,
        marginBottom: 4,
        justifyContent: own ? 'flex-end' : 'flex-start',
        paddingInlineStart: own ? 0 : 8,
        paddingInlineEnd: own ? 8 : 0,
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          padding: '3px 6px',
          borderRadius: 99,
          background: 'var(--bg-card)',
          boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
          border: '1px solid var(--border-faint)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** The time under the last message of a group, or what stands in its place. */
export function ChatTime({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontSize: 'calc(9px * var(--fs-scale-caption, 1))',
        color: 'var(--text-faint)',
        marginTop: 2,
        padding: '0 4px',
      }}
    >
      {children}
    </span>
  );
}
