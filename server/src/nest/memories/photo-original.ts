import { safeFetch, type SafeFetchOptions } from '../../utils/ssrfGuard';
import { DomainError } from '../common/domain-error';

import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';

/** Download bytes, never a preview or video playback rendition. The caller consumes/destroys the stream. */
export async function openPhotoOriginal(url: string, init: RequestInit, options: SafeFetchOptions) {
  try {
    const response = await safeFetch(url, init, { ...options, timeoutMs: 120_000, maxBytes: 512 * 1024 * 1024 });
    const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    // JSON/HTML error pages and archive downloads are not individual original assets.
    if (
      !response.ok ||
      response.status !== 200 ||
      !response.body ||
      !contentType ||
      !/^(image\/|video\/|application\/octet-stream$)/.test(contentType)
    ) {
      await response.body?.cancel();
      throw new Error('Original unavailable');
    }
    const sourceStamp = createHash('sha256')
      .update(
        JSON.stringify([
          url,
          [...new Headers(init.headers).entries()].sort(),
          options.rejectUnauthorized ?? true,
          response.headers.get('etag'),
          response.headers.get('last-modified'),
          response.headers.get('content-length'),
        ]),
      )
      .digest('hex');
    return { stream: Readable.fromWeb(response.body), contentType, sourceStamp };
  } catch {
    // Never expose upstream URLs (Synology session/passphrase) or credential-bearing errors.
    throw new DomainError(422, 'Photo provider did not supply an original file');
  }
}
