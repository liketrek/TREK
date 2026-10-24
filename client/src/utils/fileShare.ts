/**
 * Handing a file to the system's share sheet (the Web Share API), where the
 * platform takes files of that kind. Chrome takes only an allow-list of file
 * types, Safari and the phones most, so whether a share is offered is asked
 * per file name and type, never assumed from `navigator.share` alone. Where
 * the file is refused, a short text can still go to the same sheet.
 */

/** Whether this browser would hand a file of this name and type to the share sheet. */
export function canShareFile(name: string, type: string): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  if (typeof navigator.canShare !== 'function') return false;
  try {
    return navigator.canShare({ files: [new File([''], name, { type })] });
  } catch {
    // A browser that cannot even build the question cannot share the file either.
    return false;
  }
}

/**
 * How a share ended: `cancelled` when the sheet was closed without a target,
 * `needs-gesture` when the browser refused because the tap that asked lies too
 * far back (Safari, after the file had to be fetched first), `busy` when an
 * earlier sheet is still open (the browser's InvalidStateError), `failed`
 * otherwise.
 */
export type FileShareOutcome = 'shared' | 'cancelled' | 'needs-gesture' | 'busy' | 'failed';

/** Whether this browser has a share sheet for plain text, the fallback where it takes no such file. */
export function canShareText(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  // A browser without `canShare` predates the file question and shares text and links.
  if (typeof navigator.canShare !== 'function') return true;
  try {
    return navigator.canShare({ title: 'TREK', text: 'TREK' });
  } catch {
    return false;
  }
}

/** How a refused or closed share sheet ended, read off the error the browser threw. */
function outcomeOf(error: unknown): FileShareOutcome {
  if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
  if (error instanceof DOMException && error.name === 'NotAllowedError') return 'needs-gesture';
  if (error instanceof DOMException && error.name === 'InvalidStateError') return 'busy';
  return 'failed';
}

/** Opens the share sheet with the file; call it straight from the tap that asks for it. */
export async function shareFile(file: File, title: string): Promise<FileShareOutcome> {
  try {
    await navigator.share({ files: [file], title });
    return 'shared';
  } catch (error: unknown) {
    return outcomeOf(error);
  }
}

/** Opens the share sheet with a title and a text; call it straight from the tap that asks for it. */
export async function shareText(title: string, text: string): Promise<FileShareOutcome> {
  try {
    await navigator.share({ title, text });
    return 'shared';
  } catch (error: unknown) {
    return outcomeOf(error);
  }
}
