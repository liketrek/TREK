/** Which way a binding syncs: into the trip, out to the provider, or both. */
export type SyncDirection = 'both' | 'pull' | 'push';

/**
 * The direction after switching one lane of a binding on or off, or null when that would
 * switch off the last one. The desktop flow bar and the phone's two lane buttons both
 * ask this.
 */
export function toggledDirection(direction: SyncDirection, lane: 'push' | 'pull'): SyncDirection | null {
  const pushOn = direction === 'both' || direction === 'push';
  const pullOn = direction === 'both' || direction === 'pull';
  const nextPush = lane === 'push' ? !pushOn : pushOn;
  const nextPull = lane === 'pull' ? !pullOn : pullOn;
  if (!nextPush && !nextPull) return null;
  return nextPush && nextPull ? 'both' : nextPush ? 'push' : 'pull';
}

/**
 * A folder name from the trip's own title, so nobody has to invent one.
 *
 * The id is appended because two trips can share a title and a folder cannot.
 */
export function slugFor(title: string | undefined, tripId: number | string): string {
  const base = (title || 'trek')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    // The step above leaves at most one dash at either end.
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${base || 'trek'}-${tripId}`;
}
