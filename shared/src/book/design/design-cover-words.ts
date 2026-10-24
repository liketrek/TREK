/** The words a cover and the pages around the chapters are set from, and whose they are. */

export interface CoverWords {
  title: string;
  subtitle: string | null;
  ownTitle?: string;
  ownSubtitle?: string;
}

/** A title the journey owns, bound to it, or the person's own words, not bound. */
export function titleWords(own: string | undefined, journey: string): { words: string; bound: boolean } {
  return own !== undefined && own.trim() ? { words: own, bound: false } : { words: journey, bound: true };
}
