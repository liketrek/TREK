import { describe, beforeAll, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import awsLite from '@aws-lite/client';
import { MULTIPART_THRESHOLD, S3Driver } from '../../../../src/nest/storage/drivers/s3.driver';
import { describeStorageDriver, type DriverHarness } from './storage-driver.contract';

/**
 * Env-gated: engages only when TREK_TEST_S3_* is set (manual-only, via
 * `docker compose -f docker-compose.minio-test.yml up`). Local runs stay
 * hermetic. Deviation from local/mirror's bare top-level call: the gate must
 * wrap describeStorageDriver because the contract file owns its own describe.
 */
const endpoint = process.env.TREK_TEST_S3_ENDPOINT;
const bucket = process.env.TREK_TEST_S3_BUCKET ?? 'trek-test';
const accessKeyId = process.env.TREK_TEST_S3_ACCESS_KEY_ID ?? 'trekci';
const secretAccessKey = process.env.TREK_TEST_S3_SECRET_ACCESS_KEY ?? 'trekci-secret';

describe.skipIf(!endpoint)('S3Driver against MinIO', () => {
  beforeAll(async () => {
    // Idempotent bucket setup — raw client, driver stays bucket-agnostic.
    const client = await awsLite({
      accessKeyId,
      secretAccessKey,
      region: 'us-east-1',
      endpoint: endpoint!,
      retries: 1,
      keepAlive: false,
      plugins: [await import('@aws-lite/s3')],
    });
    await client.S3.CreateBucket({ Bucket: bucket }).catch((err: { code?: string; statusCode?: number }) => {
      if (err.code !== 'BucketAlreadyOwnedByYou' && err.statusCode !== 409) throw err;
    });
  });

  async function makeHarness(): Promise<DriverHarness> {
    // Fresh namespace per test (makeHarness runs in beforeEach) — reruns
    // against a shared MinIO never collide; cleanup removes everything.
    const keyPrefix = `contract-${randomUUID()}`;
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'trek-s3-contract-'));
    const driver = new S3Driver({
      id: 's3-contract',
      endpoint: endpoint!,
      region: 'us-east-1',
      bucket,
      keyPrefix,
      accessKeyId,
      secretAccessKey,
      retries: 1,
      timeoutMs: 10000,
      keepAlive: false, // vitest forks must exit promptly
    });
    let counter = 0;
    return {
      driver,
      async makeTempFile(contents) {
        const p = path.join(tmpDir, `src-${counter++}.bin`);
        await fs.promises.writeFile(p, contents);
        return p;
      },
      async cleanup() {
        for await (const stat of driver.list('')) await driver.delete(stat.key);
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
      },
    };
  }

  describeStorageDriver('S3Driver', makeHarness);

  // The generic contract suite never crosses MULTIPART_THRESHOLD, so the
  // aws-lite Upload path only runs HERE against a real server. A contentType
  // is load-bearing: upstream Upload leaks it into its CompleteMultipartUpload
  // headers, which (unworked-around) turns the parts XML into JSON and draws
  // 400 MalformedXML — the exact shape of every real backup/photo put.
  it(
    'round-trips a multipart put carrying a contentType (upstream MalformedXML regression)',
    async () => {
      const harness = await makeHarness();
      try {
        const chunk = Buffer.alloc(MULTIPART_THRESHOLD / 2 + 1024 * 1024, 9);
        await harness.driver.put('mp/big.zip', Readable.from([chunk, chunk, chunk]), {
          contentType: 'application/zip',
        });
        const stat = await harness.driver.stat('mp/big.zip');
        expect(stat?.size).toBe(3 * chunk.length);
      } finally {
        await harness.cleanup();
      }
    },
    60_000,
  );
});
