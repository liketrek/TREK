import { Search, X } from 'lucide-react';

/**
 * The search field of a Studio panel: the photos and entries of the journey,
 * the icon library, the stickers. One field, so the three look and behave
 * alike, the clear button included. It sits above the list it searches rather
 * than inside it, so it stays in reach while the list scrolls.
 *
 * A library with no tab of its own to count on (the icons, the stickers) gives
 * the field its count, and the field shows it while something is typed: how
 * many match is the first thing a search answers.
 */
export function StudioSearch({
  value,
  onChange,
  label,
  clearLabel,
  count,
}: {
  value: string;
  onChange: (value: string) => void;
  /** The placeholder and the field's accessible name. */
  label: string;
  clearLabel: string;
  /** How many the words match, shown beside them while there are any. */
  count?: number;
}) {
  return (
    <div className="st-search">
      <Search size={14} aria-hidden />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        aria-label={label}
        spellCheck={false}
      />
      {value.trim() !== '' && count != null && <output className="st-search-count">{count}</output>}
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label={clearLabel}>
          <X size={13} />
        </button>
      )}
    </div>
  );
}
