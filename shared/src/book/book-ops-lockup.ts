import { addBookLockup, buildBookLockup, bookLockupBox, findBookLockup } from './book-lockups';
import { failOp, galleryPhoto, roomFor, type BookOpsContext } from './book-ops-core';
import type { BookAddLockupOp } from './book-text-ops.schema';
import type { BookElement, BookPageSetup, BookSpread } from './book.schema';

/**
 * `add_lockup`: the Studio's Text styles shelf, for the assistant. The same
 * builder sets the same lockup from the same words, so a lockup the assistant
 * placed looks exactly like one somebody picked from the shelf.
 */

interface LockupEnv {
  page: BookPageSetup;
  ctx: BookOpsContext;
  newId: (prefix: string) => string;
  opIndex: number;
}

export function opAddLockup(spread: BookSpread, op: BookAddLockupOp, env: LockupEnv): BookSpread {
  const lockup = findBookLockup(op.lockup);
  if (!lockup) throw failOp('invalid_op', `no lockup ${op.lockup}`, env.opIndex);
  if (op.photoId !== undefined) galleryPhoto(op.photoId, env.ctx, env.opIndex);
  const box = op.box ?? bookLockupBox(lockup, env.page, spread.role !== 'inner');
  const made = buildBookLockup(lockup, box, {
    words: op.words,
    palette: { ...(op.ink ? { ink: op.ink } : {}), ...(op.accent ? { accent: op.accent } : {}) },
    photoId: op.photoId ?? null,
    newId: env.newId,
  });
  if (!made.length) {
    throw failOp('text_required', `give the words for at least one of the texts of ${lockup.id}`, env.opIndex);
  }
  roomFor(spread, made.length, env.opIndex);
  return addBookLockup(spread, made, env.newId('g'));
}

/** A text's photo fill names a gallery photo, checked as a photo frame's photo is. */
export function checkTextFillPhoto(el: BookElement, env: { ctx: BookOpsContext; opIndex: number }): void {
  if (el.kind === 'text' && el.fillPaint?.type === 'photo') galleryPhoto(el.fillPaint.photoId, env.ctx, env.opIndex);
}
