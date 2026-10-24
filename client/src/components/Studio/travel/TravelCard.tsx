import type { BookElement } from '@trek/shared';
import { TravelPreview } from '../TravelPreview';

/**
 * One card of the Travel panel: the element its click places, drawn through
 * the page's own renderer with this journey's numbers in it, and its name
 * under it. These elements differ by what they say rather than by their
 * shape, so a named row could not tell two of them apart; the thing itself
 * can.
 */
export function TravelCard({
  el,
  label,
  onPlace,
  minHeight,
  maxHeight,
  inset = 0,
  recommended = false,
  title,
}: {
  el: BookElement;
  label: string;
  onPlace: (el: BookElement) => void;
  minHeight: number;
  maxHeight: number;
  /** Room kept round the element in its tile, for one that reaches past its own edges. */
  inset?: number;
  /**
   * Marked as the one to reach for, with a ring rather than with words: the
   * label has about eighty pixels, and the tooltip carries the word.
   */
  recommended?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      className={`st-travel-card ${recommended ? 'is-recommended' : ''}`}
      onClick={() => onPlace(el)}
      title={title ? `${label}: ${title}` : label}
    >
      <TravelPreview el={el} minHeight={minHeight} maxHeight={maxHeight} inset={inset} />
      <span className="st-travel-card-label">{label}</span>
    </button>
  );
}
