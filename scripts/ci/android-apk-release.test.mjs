import { appMinimumApi, isReleaseRun, mayPublish, serverApi, universalDownloadId } from './android-apk-release.mjs';

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (path) => readFileSync(fileURLToPath(new URL(`../../${path}`, import.meta.url)), 'utf8');

describe('android-apk-release', () => {
  it('reads the native API the app needs and the one the server answers from the real files', () => {
    const appMinimum = appMinimumApi(read('client/src/native/serverAddress.ts'));
    const answered = serverApi(read('server/src/nest/health/features.controller.ts'));
    assert.ok(Number.isInteger(appMinimum) && appMinimum >= 1);
    // A commit never needs more than the server it ships with.
    assert.ok(answered >= appMinimum);
  });

  it('refuses to guess when a constant moved', () => {
    assert.throws(() => appMinimumApi('export const MIN_API = 3;'), /MIN_NATIVE_API not found/);
    assert.throws(() => serverApi('nativeApi = 3'), /nativeApi not found/);
  });

  it('holds back a build that needs a server not released yet', () => {
    assert.equal(mayPublish(3, 3), true);
    assert.equal(mayPublish(3, 4), true);
    assert.equal(mayPublish(4, 3), false);
  });

  it('publishes only for a pushed release tag', () => {
    assert.equal(isReleaseRun('push', 'refs/tags/v5.2.2'), true);
    assert.equal(isReleaseRun('push', 'refs/tags/v5.2.2-tf.1'), false);
    assert.equal(isReleaseRun('push', 'refs/heads/dev'), false);
    assert.equal(isReleaseRun('workflow_dispatch', 'refs/tags/v5.2.2'), false);
    assert.equal(isReleaseRun('workflow_dispatch', 'refs/heads/dev'), false);
    assert.equal(isReleaseRun('push', undefined), false);
  });

  it('finds the universal APK in a generatedApks answer, and nothing in one without it', () => {
    assert.equal(
      universalDownloadId({ generatedApks: [{ generatedSplitApks: [{}] }, { generatedUniversalApk: { downloadId: 'abc' } }] }),
      'abc',
    );
    assert.equal(universalDownloadId({ generatedApks: [{ generatedSplitApks: [{}] }] }), null);
    assert.equal(universalDownloadId({}), null);
    assert.equal(universalDownloadId(null), null);
  });
});
