import { Injectable } from '@nestjs/common';
import type { ObstacleCandidate, PaddleCheck, PaddleCheckLine, TourOwnEntry } from '@trek/shared';

/** What reading the obstacle data along one line made of it, before the stored decisions are laid over it. */
export interface PaddleCheckEvaluation {
  line: PaddleCheckLine;
  candidates: ObstacleCandidate[];
  own: TourOwnEntry[];
  /** The checklist key of every object the read held, to tell a vanished object from one the route left. */
  dataKeys: ReadonlySet<string>;
  /** The data covers the whole line and nothing was cut, so a missing object is really missing. */
  complete: boolean;
  data: Pick<PaddleCheck, 'data' | 'data_as_of' | 'read_at'>;
}

/** A reading as kept: without its line, which the caller holds and the key already stands for. */
type CachedEvaluation = Omit<PaddleCheckEvaluation, 'line'>;

const MAX_ENTRIES = 64;

/**
 * The evaluations of the last lines read, keyed by the line and the boat,
 * so the tours list of a trip reads its paddle tours' obstacles once and not
 * on every call. Held in memory for one version of the obstacle data: a new
 * version empties it, since nothing read before can be served again.
 */
@Injectable()
export class PaddleCheckCache {
  private readonly entries = new Map<string, CachedEvaluation>();
  private version: string | null = null;

  /** The obstacle data's current version; a different one drops every reading kept. */
  atVersion(version: string): void {
    if (version === this.version) return;
    this.entries.clear();
    this.version = version;
  }

  get(key: string, line: PaddleCheckLine): PaddleCheckEvaluation | undefined {
    const hit = this.entries.get(key);
    if (!hit) return undefined;
    // Read again, kept longer: the map's order is the order of use.
    this.entries.delete(key);
    this.entries.set(key, hit);
    return { ...hit, line };
  }

  set(key: string, { line: _line, ...value }: PaddleCheckEvaluation): void {
    this.entries.delete(key);
    this.entries.set(key, value);
    if (this.entries.size > MAX_ENTRIES) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
  }
}
