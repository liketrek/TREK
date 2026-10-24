/**
 * `InMemoryBookDesignDraftStore` (JBDRAFT-*): a draft is one user's for one
 * journey, gone after six hours, three at most per user and fifty in all
 * (the oldest going first), refused past eight megabytes, and replaced by a
 * draft of the same id.
 */
import { catchDomainError, DomainError } from '../../../../src/nest/common/domain-error';
import {
  BOOK_DESIGN_DRAFTS,
  designExpired,
  InMemoryBookDesignDraftStore,
  type BookDesignDraft,
} from '../../../../src/nest/journey/book-design-draft.store';
import { blankBook } from '@trek/shared';

import { afterEach, describe, expect, it, vi } from 'vitest';

function draft(designId: string, userId = 1, journeyId = 10, over: Partial<BookDesignDraft> = {}): BookDesignDraft {
  return {
    designId,
    userId,
    journeyId,
    baseVersion: 3,
    base: null,
    doc: blankBook({ title: 'Lisbon' }),
    plan: [],
    selection: [],
    style: { style: 'classic', paper: '#ffffff', ink: '#1a1a1a', accent: '#c2410c', heading: 'sans', body: 'sans' },
    usedPhotos: 0,
    leftOut: [],
    findings: [],
    notes: [],
    expiresAt: Date.now() + BOOK_DESIGN_DRAFTS.ttlMs,
    ...over,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

/** Runs the calls one after another. */
async function inTurn<T>(items: readonly T[], run: (item: T) => Promise<unknown>): Promise<void> {
  await items.reduce<Promise<unknown>>((before, item) => before.then(() => run(item)), Promise.resolve());
}

/** The refusal a call ends in. */
async function refusal(pending: () => Promise<unknown>): Promise<DomainError> {
  const err = await catchDomainError(pending);
  if (!(err instanceof DomainError)) throw new Error('the call was not refused');
  return err;
}

describe('InMemoryBookDesignDraftStore', () => {
  it('JBDRAFT-001: a draft is found by its user, journey and id only, and a draft of the same id replaces it', async () => {
    const store = new InMemoryBookDesignDraftStore();
    await store.put(draft('d-1'));
    expect((await store.get(1, 10, 'd-1'))?.baseVersion).toBe(3);
    expect(await store.get(2, 10, 'd-1')).toBeNull();
    expect(await store.get(1, 11, 'd-1')).toBeNull();

    await store.put(draft('d-1', 1, 10, { baseVersion: 4 }));
    expect((await store.get(1, 10, 'd-1'))?.baseVersion).toBe(4);
    await store.remove(1, 10, 'd-1');
    expect(await store.get(1, 10, 'd-1')).toBeNull();
  });

  it('JBDRAFT-002: a draft whose six hours are up is gone', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-22T08:00:00Z'));
    const store = new InMemoryBookDesignDraftStore();
    await store.put(draft('d-1'));
    vi.setSystemTime(new Date('2026-10-22T13:59:00Z'));
    expect(await store.get(1, 10, 'd-1')).not.toBeNull();
    vi.setSystemTime(new Date('2026-10-22T14:00:01Z'));
    expect(await store.get(1, 10, 'd-1')).toBeNull();
  });

  it('JBDRAFT-003: a user keeps three drafts and the process fifty, the oldest going first', async () => {
    const store = new InMemoryBookDesignDraftStore();
    await inTurn(['d-1', 'd-2', 'd-3', 'd-4'], (id) => store.put(draft(id)));
    expect(await store.get(1, 10, 'd-1')).toBeNull();
    expect((await store.get(1, 10, 'd-4'))?.designId).toBe('d-4');

    const shared = new InMemoryBookDesignDraftStore();
    const users = Array.from({ length: BOOK_DESIGN_DRAFTS.total + 1 }, (_, i) => i + 1);
    await inTurn(users, (user) => shared.put(draft('d-x', user)));
    expect(await shared.get(1, 10, 'd-x')).toBeNull();
    expect(await shared.get(2, 10, 'd-x')).not.toBeNull();
    expect(await shared.get(BOOK_DESIGN_DRAFTS.total + 1, 10, 'd-x')).not.toBeNull();
  });

  it('JBDRAFT-004: a draft past eight megabytes is refused with a 422 that says how to make it smaller', async () => {
    const store = new InMemoryBookDesignDraftStore();
    const huge = blankBook({ title: 'x'.repeat(10) });
    const big = draft('d-big', 1, 10, { doc: { ...huge, title: 'x'.repeat(BOOK_DESIGN_DRAFTS.maxChars) } });
    const err = await refusal(() => store.put(big));
    expect([err.getStatus(), err.code]).toEqual([422, 'book_design_too_large']);
    expect(err.mcpMessage).toContain('pages.max');
    expect(await store.get(1, 10, 'd-big')).toBeNull();
  });

  it('JBDRAFT-005: a gone draft answers 410 and tells the model to design again', () => {
    const err = designExpired();
    expect([err.getStatus(), err.code]).toEqual([410, 'book_design_expired']);
    expect(err.mcpMessage).toContain('design_book again');
  });
});
