/**
 * Loading a book's photographs into its print view a few at a time.
 *
 * The sheets carry each photo's source in `PRINT_SRC_ATTR` rather than in
 * `src` (see bookRender.ts), so nothing loads until this hands the sources
 * over. A handful run at once: enough to keep the connection busy, few enough
 * that a book of several hundred originals does not exhaust the browser
 * (#3102). A photo that fails is asked for once more before it is left blank,
 * and one that never answers is given up on after a while, so the Save button
 * always comes on in the end.
 */

import { PRINT_SRC_ATTR } from './bookRender';

const PRINT_IMAGES = {
  concurrency: 4,
  timeoutMs: 60_000,
  retries: 1,
} as const;

export interface PrintImageOptions {
  concurrency?: number;
  timeoutMs?: number;
  /** Called after each photo has loaded or been given up on. */
  onProgress?: (done: number, total: number) => void;
}

/** Point `img` at `src` and resolve with whether it loaded, or false after `timeoutMs`. */
function loadOne(img: HTMLImageElement, src: string, timeoutMs: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const finish = (ok: boolean) => {
      clearTimeout(timer);
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
      resolve(ok);
    };
    const onLoad = () => finish(true);
    const onError = () => finish(false);
    const timer = setTimeout(() => finish(false), timeoutMs);
    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);
    img.src = src;
  });
}

/** What `loadPrintImages` reads off the print document, as `whenReady` does. */
interface PrintDocument {
  querySelectorAll?: (selector: string) => ArrayLike<Element>;
}

/** Resolves once every deferred photo in `doc` has loaded or been given up on. */
export async function loadPrintImages(doc: PrintDocument, options: PrintImageOptions = {}): Promise<void> {
  const concurrency = Math.max(1, options.concurrency ?? PRINT_IMAGES.concurrency);
  const timeoutMs = options.timeoutMs ?? PRINT_IMAGES.timeoutMs;
  const images = Array.from(doc.querySelectorAll?.(`img[${PRINT_SRC_ATTR}]`) ?? []) as HTMLImageElement[];
  const total = images.length;
  let next = 0;
  let done = 0;

  const worker = async () => {
    while (next < images.length) {
      const img = images[next++];
      const src = img.getAttribute(PRINT_SRC_ATTR) ?? '';
      img.removeAttribute(PRINT_SRC_ATTR);
      for (let attempt = 0; attempt <= PRINT_IMAGES.retries; attempt++) {
        if (await loadOne(img, src, timeoutMs)) break;
        // A second request for the same URL needs the attribute to change to fire again.
        img.removeAttribute('src');
      }
      done++;
      options.onProgress?.(done, total);
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, total) }, worker));
}
