import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

import { fs } from '../shared/DialogShell';
import { Tooltip } from '../shared/Tooltip';

/**
 * The pieces a poll of the trip is drawn with, shared by the Collab tab and
 * the assistant chat's poll cards: an option with its bar, its check, its
 * voters and its share, a voter's face and a fact on the poll's head band.
 * An option is a button where it can be voted for and a plain row where it
 * only shows; a vote the assistant holds marks its option with a dashed
 * frame until it is decided.
 */

/** A voter as an option shows them: a name and the picture TREK serves, if any. */
interface PollVoterFace {
  key: string | number;
  name: string;
  src: string | null;
}

/** One voter's face; faces after the first overlap the one before. */
function VoterChip({ name, src, offset }: { name: string; src: string | null; offset: boolean }) {
  return (
    <Tooltip label={name || '?'}>
      <span
        className="grid h-[18px] w-[18px] flex-none place-items-center overflow-hidden rounded-full border-[1.5px] border-surface-card bg-surface-tertiary font-bold text-content-muted"
        style={{ ...fs(7), marginInlineStart: offset ? -5 : 0 }}
      >
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          (name || '?').charAt(0).toUpperCase()
        )}
      </span>
    </Tooltip>
  );
}

/** A fact about the poll on its head band, set like the type chip on a booking card. */
export function PollChip({
  icon,
  tone = 'muted',
  children,
}: {
  icon?: ReactNode;
  tone?: 'muted' | 'warning' | 'info';
  children: ReactNode;
}) {
  const color = tone === 'warning' ? 'text-warning' : tone === 'info' ? 'text-info' : 'text-content-muted';
  return (
    <span
      className={`inline-flex flex-none items-center gap-1 rounded-full border border-edge-faint bg-surface-card px-2 py-[2px] font-geist font-bold uppercase tracking-[.06em] ${color}`}
      style={fs(9.5)}
    >
      {icon}
      {children}
    </span>
  );
}

interface PollOptionRowProps {
  text: string;
  /** Its share of all votes, which the bar draws. */
  pct: number;
  /** The signed-in user voted for it. */
  mine: boolean;
  /** The poll ended and it has the most votes. */
  winner: boolean;
  /** Shares and voters show once the user voted or the poll ended. */
  showResults: boolean;
  voters: readonly PollVoterFace[];
  /** A button to vote with, or a row that only shows. */
  as?: 'button' | 'div';
  /** A vote waiting for its decision: the frame is dashed, and says so to a screen reader. */
  pending?: { label: string } | null;
  disabled?: boolean;
  onClick?: () => void;
}

/** One option of a poll, as the Collab tab draws it. */
export function PollOptionRow({
  text,
  pct,
  mine,
  winner,
  showResults,
  voters,
  as = 'button',
  pending = null,
  disabled = false,
  onClick,
}: PollOptionRowProps) {
  const frame = pending
    ? 'border-dashed border-accent'
    : mine
      ? 'border-accent'
      : 'border-edge-faint enabled:hover:border-edge';
  const body = (
    <>
      {/* The bar behind it: the user's choice in the accent, the winner in green. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 start-0 transition-[width] duration-500"
        style={{
          width: `${pct}%`,
          background: mine
            ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
            : winner
              ? 'var(--success-soft)'
              : 'var(--bg-tertiary)',
        }}
      />
      <span
        className={`relative grid h-5 w-5 flex-none place-items-center rounded-full border-2 transition-colors ${mine ? 'border-accent bg-accent text-accent-text' : 'border-edge bg-surface-card'}`}
      >
        {mine && <Check size={11} strokeWidth={3} />}
      </span>
      {/* Plain text, but a long or multiline option wraps instead of being clipped (#2177). */}
      <span
        className="relative z-[1] text-content"
        style={{
          flex: 1,
          minWidth: 0,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          lineHeight: 1.35,
          ...fs(13, 'body'),
          fontWeight: mine || winner ? 600 : 400,
        }}
      >
        {text}
      </span>
      {voters.length > 0 && showResults && (
        <span className="relative z-[1] flex">
          {voters.slice(0, 3).map((voter, index) => (
            <VoterChip key={voter.key} name={voter.name} src={voter.src} offset={index > 0} />
          ))}
        </span>
      )}
      {pending && <span className="sr-only">{pending.label}</span>}
      {showResults && (
        <span
          className={`relative z-[1] min-w-[32px] text-end font-geist font-bold tabular-nums ${mine ? 'text-content' : 'text-content-muted'}`}
          style={fs(12, 'body')}
        >
          {pct}%
        </span>
      )}
    </>
  );
  const look = `relative flex w-full items-start gap-2.5 overflow-hidden rounded-[10px] border bg-surface-secondary px-3 py-2.5 text-start transition-colors disabled:cursor-default ${frame}`;
  if (as === 'div') return <div className={look}>{body}</div>;
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={look}>
      {body}
    </button>
  );
}
