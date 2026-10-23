import { DomainError } from '../common/domain-error';
import { Injectable } from '@nestjs/common';
import type { BookDesignLeftOut, BookDesignPlanRow, BookDesignStyleOut, BookDocument, BookFinding } from '@trek/shared';

/**
 * Whole-book designs waiting for the person's yes (journey-studio-wp13.md
 * 6.1): `design_book` keeps the book it composed here, `revise_book_design`
 * changes it, the proposal card reads and narrows it, `apply_book_design`
 * writes it. A draft is one user's, for one journey, and lives six hours; a
 * user keeps three at most and the process fifty, the oldest going first.
 * Nothing here is written to the database: a restart forgets every draft,
 * and design_book makes the same one again from the same book and seed.
 */

export const BOOK_DESIGN_DRAFTS = {
  ttlMs: 6 * 60 * 60 * 1000,
  perUser: 3,
  total: 50,
  /** The draft's book and the base it was made over, as JSON. */
  maxChars: 8 * 1024 * 1024,
} as const;

export interface BookDesignDraft {
  designId: string;
  userId: number;
  journeyId: number;
  /** The book's version the design was made against; null for a journey without a book. */
  baseVersion: number | null;
  /** The stored book as the design found it, to tell a page changed since from one nobody touched. */
  base: BookDocument | null;
  /** The designed book. */
  doc: BookDocument;
  plan: BookDesignPlanRow[];
  /** The plan pages the apply writes (and drops); every page that is not kept, until the person narrows it. */
  selection: string[];
  style: BookDesignStyleOut;
  usedPhotos: number;
  leftOut: BookDesignLeftOut[];
  findings: BookFinding[];
  notes: string[];
  /** Epoch milliseconds. */
  expiresAt: number;
}

/** Where drafts are kept: in this process today, behind a port so a shared store can take over. */
export abstract class BookDesignDraftStore {
  /** Keeps a draft, replacing one of the same id, and makes room under the caps. */
  abstract put(draft: BookDesignDraft): Promise<void>;
  /** The user's draft for that journey, or null when there is none (any more). */
  abstract get(userId: number, journeyId: number, designId: string): Promise<BookDesignDraft | null>;
  abstract remove(userId: number, journeyId: number, designId: string): Promise<void>;
}

const keyOf = (userId: number, journeyId: number, designId: string) => `${userId}:${journeyId}:${designId}`;

/** A draft that is gone: its six hours passed, the server restarted, or it was never this user's. */
export function designExpired(): DomainError {
  return new DomainError(410, 'This design is no longer kept', {
    code: 'book_design_expired',
    mcpMessage:
      'This design is no longer kept (a draft lasts six hours and a restart of TREK forgets it): ' +
      'run design_book again; the same directives and seed give the same design while the book and the journey ' +
      'are unchanged.',
  });
}

@Injectable()
export class InMemoryBookDesignDraftStore extends BookDesignDraftStore {
  /** In the order they were kept, the oldest first. */
  private readonly drafts = new Map<string, BookDesignDraft>();

  put(draft: BookDesignDraft): Promise<void> {
    const size = JSON.stringify(draft.doc).length + (draft.base ? JSON.stringify(draft.base).length : 0);
    if (size > BOOK_DESIGN_DRAFTS.maxChars) {
      return Promise.reject(
        new DomainError(422, 'This design is too large to keep', {
          code: 'book_design_too_large',
          mcpMessage: 'This design is too large to keep as a draft: design fewer pages (pages.max) or a scope.',
        }),
      );
    }
    this.sweep();
    const key = keyOf(draft.userId, draft.journeyId, draft.designId);
    this.drafts.delete(key);
    const own = [...this.drafts.entries()].filter(([, d]) => d.userId === draft.userId);
    for (const [old] of own.slice(0, Math.max(0, own.length - (BOOK_DESIGN_DRAFTS.perUser - 1)))) {
      this.drafts.delete(old);
    }
    for (const old of [...this.drafts.keys()]) {
      if (this.drafts.size < BOOK_DESIGN_DRAFTS.total) break;
      this.drafts.delete(old);
    }
    this.drafts.set(key, draft);
    return Promise.resolve();
  }

  get(userId: number, journeyId: number, designId: string): Promise<BookDesignDraft | null> {
    this.sweep();
    return Promise.resolve(this.drafts.get(keyOf(userId, journeyId, designId)) ?? null);
  }

  remove(userId: number, journeyId: number, designId: string): Promise<void> {
    this.drafts.delete(keyOf(userId, journeyId, designId));
    return Promise.resolve();
  }

  /** Forgets the drafts whose time is up. */
  private sweep(): void {
    const now = Date.now();
    for (const [key, draft] of this.drafts) if (draft.expiresAt <= now) this.drafts.delete(key);
  }
}
