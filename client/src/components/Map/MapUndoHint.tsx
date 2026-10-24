import { Check, Undo2 } from 'lucide-react';
import { fs } from '../shared/DialogShell';
import { MAP_CONTROL_SHADOW } from './mapControlShadow';

export interface MapUndoHintProps {
  message: string;
  undoLabel: string;
  onUndo: () => void;
  /** True while the pointer rests on the hint, so it does not vanish under it. */
  onHold?: (held: boolean) => void;
}

/**
 * A short note at the foot of the map that something just happened there, with
 * the way back: a glass pill like the map's other controls. The caller places it
 * and decides how long it stays.
 */
export function MapUndoHint({ message, undoLabel, onUndo, onHold }: Readonly<MapUndoHintProps>) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="map-undo-hint"
      className="trek-toast-enter pointer-events-auto flex max-w-full items-center gap-2 rounded-full p-1 ps-3 text-content"
      style={{
        background: 'var(--sidebar-bg)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: MAP_CONTROL_SHADOW,
      }}
      onMouseEnter={() => onHold?.(true)}
      onMouseLeave={() => onHold?.(false)}
      onFocus={() => onHold?.(true)}
      onBlur={() => onHold?.(false)}
    >
      <Check size={14} strokeWidth={2.4} className="flex-none text-accent" aria-hidden />
      <span className="min-w-0 truncate font-semibold" style={fs(12, 'body')}>
        {message}
      </span>
      <button
        type="button"
        onClick={onUndo}
        className="bg-accent-soft flex h-[30px] flex-none items-center gap-1.5 rounded-full px-3 font-semibold text-accent hover:opacity-90"
        style={fs(11)}
      >
        <Undo2 size={13} strokeWidth={2.2} aria-hidden />
        {undoLabel}
      </button>
    </div>
  );
}
