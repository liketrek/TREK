import { type Dispatch, type SetStateAction, useState } from 'react';

import type { ChangeItem } from '../assistantParts';
import { viewOf } from './cardViews';

/** The waiting changes whose view leaves them off at first, among those not seen yet. */
function startingOff(items: readonly ChangeItem[], seen: ReadonlySet<string>): string[] {
  return items.flatMap((item) =>
    item.state === 'pending' && item.card && !seen.has(item.toolCallId) && viewOf(item.card).startsExcluded?.(item.card)
      ? [item.toolCallId]
      : []
  );
}

/** The changes whose preview has arrived: from then on the user's choice is theirs alone. */
const arrived = (items: readonly ChangeItem[]) => items.flatMap((item) => (item.preview ? [item.toolCallId] : []));

/**
 * The changes the user left off on a card. A change whose view says it
 * starts off (an optional extra the user opts into) is left off once, when
 * its preview arrives; after that only the user switches it.
 */
export function useChangeExclusions(
  items: readonly ChangeItem[]
): [ReadonlySet<string>, Dispatch<SetStateAction<ReadonlySet<string>>>] {
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(() => new Set(startingOff(items, new Set())));
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set(arrived(items)));
  const fresh = arrived(items).filter((id) => !seen.has(id));
  if (fresh.length > 0) {
    const off = startingOff(items, seen);
    setSeen(new Set([...seen, ...fresh]));
    if (off.length > 0) setExcluded((prev) => new Set([...prev, ...off]));
  }
  return [excluded, setExcluded];
}
