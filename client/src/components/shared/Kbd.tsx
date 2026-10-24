/**
 * A keyboard shortcut as the keys to press, one quiet chip per key: ["⌘", "K"]
 * reads as two keys, not as the text "⌘K". The chips take the colour of the
 * text around them, so the same shortcut sits in a tooltip, a menu row or a
 * button without a palette of its own.
 */
export default function Kbd({ keys, className = '' }: { keys: readonly string[]; className?: string }) {
  return (
    <kbd className={`inline-flex items-center gap-0.5 font-[inherit] ${className}`}>
      {keys.map((key, i) => (
        <span
          key={`${key}-${i}`}
          className="inline-flex min-w-[1.5em] items-center justify-center rounded border border-edge-secondary px-1 text-caption leading-[1.5] opacity-80"
        >
          {key}
        </span>
      ))}
    </kbd>
  );
}
