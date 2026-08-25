/**
 * The colour picker, shared by everything in the inspector that has a colour.
 *
 * Its own file because both the plain elements and the travel elements need it,
 * and the second copy of a swatch row is how two parts of one panel end up
 * offering different palettes.
 *
 * The palette is print ink rather than app chrome — it does not follow the
 * user's theme, because a book is printed once and read on paper, where an
 * accent chosen for a dark interface means nothing.
 */

const SWATCHES = [
  '#111111', '#ffffff', '#8a8578',
  '#c2410c', '#b45309', '#0f766e',
  '#1e3a8a', '#9f1239', '#4c1d95',
]

export function Swatches({ value, onPick }: { value: string; onPick: (c: string) => void }) {
  return (
    <div className="st-swatches">
      {SWATCHES.map(c => (
        <button type="button"
          key={c}
          className={`st-swatch ${value.toLowerCase() === c ? 'is-on' : ''}`}
          style={{ background: c }} // theme-lint-disable — a colour picker shows the colours themselves
          onClick={() => onPick(c)}
          aria-label={c}
        />
      ))}
      {/* Anything at all, for a book that has to match a cover or a brand. */}
      <label className="st-swatch st-swatch-custom">
        {/* Named by the colour it holds, the way the preset swatches above are. */}
        <input type="color" aria-label={value} value={value} onChange={e => onPick(e.target.value)} />
      </label>
    </div>
  )
}
