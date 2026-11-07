/** The order with the entry at index moved one place up (-1) or down (1); the same order when it cannot move. */
export function moveEntry<T>(order: readonly T[], index: number, step: -1 | 1): T[] {
  const target = index + step;
  if (index < 0 || index >= order.length || target < 0 || target >= order.length) return [...order];
  const next = [...order];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** A stop's time span as the day plan prints it: "09:00–10:30", "09:00", or nothing. */
export function timeSpan(time: string | null, endTime: string | null): string | null {
  if (time && endTime) return `${time}–${endTime}`;
  return time || null;
}
