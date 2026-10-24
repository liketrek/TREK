/**
 * The packed count of a multi-piece item (#2296) and its checkbox, kept in step.
 *
 * `packed_quantity` only holds a partial count: zero is stored as null, and a count
 * that reaches the quantity is the checked box itself. That keeps one truth for
 * "done" and lets every older client keep reading `checked`.
 */
export interface PackedState {
  checked: number;
  packed_quantity: number | null;
}

interface PackedInput {
  /** The keys the write actually named, as the update's presence protocol has them. */
  bodyKeys: string[];
  checked?: number;
  packed_quantity?: number | null;
  /** The quantity after the write. */
  quantity: number;
}

export function resolvePackedState(current: PackedState, input: PackedInput): PackedState {
  const { bodyKeys, quantity } = input;
  if (bodyKeys.includes('packed_quantity')) {
    const count = Math.max(0, Math.min(quantity, Math.floor(Number(input.packed_quantity) || 0)));
    if (count >= quantity) return { checked: 1, packed_quantity: null };
    return { checked: 0, packed_quantity: count > 0 ? count : null };
  }
  // Ticking or unticking the box is a decision about the whole item.
  if (bodyKeys.includes('checked')) return { checked: input.checked ? 1 : 0, packed_quantity: null };
  // A lowered quantity the count already reaches finishes the item.
  if (current.packed_quantity != null && current.packed_quantity >= quantity)
    return { checked: 1, packed_quantity: null };
  return current;
}
