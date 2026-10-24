import { deriveApp } from '../../../src/app-config/derive';
import { imageVersion, resetImageVersion } from '../../../src/app-config/image-version';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('imageVersion', () => {
  const dirs: string[] = [];
  const versionFile = (content: string): string => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-image-version-'));
    dirs.push(dir);
    const file = path.join(dir, 'VERSION');
    fs.writeFileSync(file, content);
    return file;
  };

  beforeEach(() => resetImageVersion());

  afterEach(() => {
    resetImageVersion();
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
  });

  it('IMGVER-001: reads the version the image was built as, trimmed', () => {
    expect(imageVersion(versionFile('4.4.0-pre.3\n'))).toBe('4.4.0-pre.3');
  });

  it('IMGVER-002: is null outside an image and for an empty file', () => {
    expect(imageVersion(path.join(os.tmpdir(), 'trek-no-such-dir', 'VERSION'))).toBeNull();
    resetImageVersion();
    expect(imageVersion(versionFile('  \n'))).toBeNull();
  });

  it('IMGVER-003: reads once, because the image does not change under a running process', () => {
    const file = versionFile('4.3.3');
    expect(imageVersion(file)).toBe('4.3.3');
    fs.writeFileSync(file, '9.9.9');
    expect(imageVersion(file)).toBe('4.3.3');
  });

  it("IMGVER-004: the image's version wins over an APP_VERSION a recreated container carried over", () => {
    imageVersion(versionFile('4.4.0'));
    expect(deriveApp({ APP_VERSION: '4.3.3' }).appVersion).toBe('4.4.0');
  });

  it('IMGVER-005: without an image file, APP_VERSION still decides', () => {
    imageVersion(path.join(os.tmpdir(), 'trek-no-such-dir', 'VERSION'));
    expect(deriveApp({ APP_VERSION: '4.3.3' }).appVersion).toBe('4.3.3');
  });
});
