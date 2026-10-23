import { DocSyncTransferService } from '../doc-sync/doc-sync-transfer.service';
import { PhotoResolverService } from '../memories/photo-resolver.service';
import { fail, MAX_ORIGINAL } from './transfer-wire';
import { Injectable } from '@nestjs/common';

import { createHash } from 'node:crypto';
import type { Readable } from 'node:stream';

/** No public/cache URL and no preview fallback. Even a cached TREK ACL never replaces the provider request. */
@Injectable()
export class TransferPhotoFiles {
  constructor(
    private readonly photos: PhotoResolverService,
    private readonly documents: DocSyncTransferService,
  ) {}
  async consume(user: number, id: number, range?: { offset: number; limit: number }) {
    const { stream } = await this.photos.openOriginal(user, id);
    const result = await this.consumeStream(stream, range);
    await this.photos.checkOriginalAccess(user, id);
    return result;
  }
  async document(user: number, trip: number, id: number, range?: { offset: number; limit: number }) {
    const original = await this.documents.openOriginal(user, trip, id);
    const result = await this.consumeStream(original.stream, range);
    if (
      (original.expectedSize !== null && result.size !== original.expectedSize) ||
      (original.expectedDigest && original.expectedDigest !== result.digest)
    )
      fail('External original changed during transfer');
    await original.check();
    return result;
  }
  private async consumeStream(stream: Readable, range?: { offset: number; limit: number }) {
    const hash = createHash('sha256'),
      parts: Buffer[] = [];
    let size = 0;
    try {
      for await (const chunk of stream) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        const start = size;
        size += bytes.length;
        if (size > MAX_ORIGINAL) fail('Photo original exceeds transfer limit', 413);
        hash.update(bytes);
        if (range && start < range.offset + range.limit && size > range.offset)
          parts.push(
            Buffer.from(bytes.subarray(Math.max(0, range.offset - start), range.offset + range.limit - start)),
          );
      }
    } catch {
      // Stream errors may contain provider URLs or credential-bearing diagnostics.
      fail('Photo original could not be read completely', 422);
    } finally {
      stream.destroy();
    }
    return { size, digest: hash.digest('hex'), bytes: Buffer.concat(parts) };
  }
}
