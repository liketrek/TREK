/**
 * The Studio page images a running turn waits for (journey-studio.md 3.1), as
 * an injectable port. The turn streams a `data-trek-render-request` and waits
 * here; the Studio tab that holds the stream draws the page and uploads it to
 * the renders route, which hands it over. A turn waits a bounded time and
 * stops waiting with its own abort; an upload nobody waits for (too late,
 * another user's, never asked) is refused. The image lives in memory for that
 * one hand-over: nothing here keeps it. In memory today, like the running
 * turns themselves (AssistantStreamRegistry).
 */

/** A page image as the Studio uploaded it, checked by the renders route. */
export interface PageImage {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  data: Buffer;
  width: number;
  height: number;
}

/** Whose request an upload answers: the user, their journey and thread, and the request's own id. */
interface RenderKey {
  userId: number;
  journeyId: number;
  threadId: number;
  requestId: string;
}

/** A request a turn streamed: whose it is, and the page and book version it asked for. */
export interface RenderWait extends RenderKey {
  spreadId: string;
  bookVersion: number;
}

/**
 * What became of an upload: `taken` by the turn waiting for it, `unknown`
 * when no turn of this user waits for that request, `mismatch` when it shows
 * another page or version than the one asked for (the turn goes on waiting).
 */
type RenderDelivery = 'taken' | 'unknown' | 'mismatch';

export abstract class AssistantRenderRegistry {
  /** The image of a streamed request, or null once `timeoutMs` passed or `signal` aborted. */
  abstract wait(request: RenderWait, signal: AbortSignal, timeoutMs: number): Promise<PageImage | null>;
  /** Hands an upload to the turn waiting for it. */
  abstract deliver(key: RenderKey, page: { spreadId: string; bookVersion: number }, image: PageImage): RenderDelivery;
}

interface Waiting {
  request: RenderWait;
  settle: (image: PageImage | null) => void;
}

export class InMemoryAssistantRenderRegistry extends AssistantRenderRegistry {
  private readonly waiting = new Map<string, Waiting>();

  wait(request: RenderWait, signal: AbortSignal, timeoutMs: number): Promise<PageImage | null> {
    if (signal.aborted) return Promise.resolve(null);
    return new Promise((resolve) => {
      const settle = (image: PageImage | null) => {
        clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
        if (this.waiting.get(request.requestId)?.settle === settle) this.waiting.delete(request.requestId);
        resolve(image);
      };
      const onAbort = () => settle(null);
      const timer = setTimeout(() => settle(null), timeoutMs);
      signal.addEventListener('abort', onAbort, { once: true });
      this.waiting.set(request.requestId, { request, settle });
    });
  }

  deliver(key: RenderKey, page: { spreadId: string; bookVersion: number }, image: PageImage): RenderDelivery {
    const entry = this.waiting.get(key.requestId);
    const asked = entry?.request;
    if (!entry || !asked) return 'unknown';
    if (asked.userId !== key.userId || asked.journeyId !== key.journeyId || asked.threadId !== key.threadId) {
      return 'unknown';
    }
    if (asked.spreadId !== page.spreadId || asked.bookVersion !== page.bookVersion) return 'mismatch';
    entry.settle(image);
    return 'taken';
  }
}
