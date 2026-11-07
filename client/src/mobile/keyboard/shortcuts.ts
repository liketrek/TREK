import { create } from 'zustand';
import type { NativeKeyCommand } from '../../native/trekShell';

/**
 * A hardware keyboard shortcut of the touch shell. The shell is what an iPad
 * shows, and an iPad often has a keyboard attached: there the app should
 * answer ⌘1 and ⌘N the way any iPad app does.
 */
export interface Shortcut {
  /** Stable id, also what the app's native key command reports back. */
  id: string;
  /** Its name, for the overlay a held ⌘ shows and the iPadOS menu bar. */
  title: string;
  /**
   * KeyboardEvent.key, lower case for letters ('n', '1', ',', 'ArrowLeft'). A
   * digit is matched by the key's place as well (KeyboardEvent.code), since a
   * French keyboard types '&' on the 1 key without Shift.
   */
  key: string;
  /** ⌘ on an iPad (and any Apple keyboard), Ctrl on Android. */
  mod?: boolean;
  shift?: boolean;
  alt?: boolean;
  /** The physical Control key on top of ⌘ (⌃⌘S). */
  ctrl?: boolean;
  run: () => void;
}

type KeyEventLike = Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'> &
  Partial<Pick<KeyboardEvent, 'code'>>;

/**
 * Whether an event is this shortcut. The command key is the platform's own: ⌘
 * on Apple keyboards, Ctrl elsewhere, never either one. Taking both made Ctrl+N
 * in a Mac text field (the "next line" binding) run ⌘N.
 */
export function matchesShortcut(e: KeyEventLike, s: Shortcut, apple = true): boolean {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const digitAt = /^[0-9]$/.test(s.key) && e.code === `Digit${s.key}`;
  if (key !== s.key && !digitAt) return false;
  if (s.ctrl) {
    if (!e.ctrlKey || !e.metaKey) return false;
  } else {
    const command = apple ? e.metaKey : e.ctrlKey;
    const other = apple ? e.ctrlKey : e.metaKey;
    if (!!s.mod !== command || other) return false;
  }
  return !!s.shift === e.shiftKey && !!s.alt === e.altKey;
}

/** Typing in a field keeps its keys: a shortcut without ⌘ never fires there. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/** The first shortcut of the lists (later ones first) that the event is. */
export function findShortcut(
  e: KeyEventLike & Pick<KeyboardEvent, 'target'>,
  lists: Shortcut[][],
  apple = true
): Shortcut | null {
  for (let i = lists.length - 1; i >= 0; i--) {
    for (const s of lists[i]) {
      if (!s.mod && !s.ctrl && isTypingTarget(e.target)) continue;
      if (matchesShortcut(e, s, apple)) return s;
    }
  }
  return null;
}

interface ShortcutRegistry {
  /** The lists that are live, by owner, in the order they were registered. */
  lists: { owner: string; shortcuts: Shortcut[] }[];
  set: (owner: string, shortcuts: Shortcut[]) => void;
  remove: (owner: string) => void;
}

/**
 * Every screen's live shortcuts in one place, so a single keydown listener and
 * the app's native key commands (NativeKeyCommands) answer for all of them, a
 * trip's own shortcuts ahead of the shell's.
 */
export const useShortcutRegistry = create<ShortcutRegistry>((set) => ({
  lists: [],
  set: (owner, shortcuts) =>
    set((state) => {
      const at = state.lists.findIndex((l) => l.owner === owner);
      if (at === -1) return { lists: [...state.lists, { owner, shortcuts }] };
      const lists = state.lists.slice();
      lists[at] = { owner, shortcuts };
      return { lists };
    }),
  remove: (owner) => set((state) => ({ lists: state.lists.filter((l) => l.owner !== owner) })),
}));

const NATIVE_KEYS: Record<string, string> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  Escape: 'escape',
};

/** A shortcut as the app's UIKeyCommand, under an id unique across screens. */
export function toNativeCommand(owner: string, s: Shortcut): NativeKeyCommand {
  const modifiers: string[] = [];
  if (s.mod || s.ctrl) modifiers.push('command');
  if (s.ctrl) modifiers.push('control');
  if (s.shift) modifiers.push('shift');
  if (s.alt) modifiers.push('option');
  return { id: `${owner}:${s.id}`, title: s.title, input: NATIVE_KEYS[s.key] ?? s.key, modifiers };
}
