import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// The set of uploads subdirectories is hand-mirrored between the image build and
// the boot-time mkdir in server/src/index.ts. Drift is invisible until a user on
// a host whose bind-mounted uploads dir isn't writable by node hits an EACCES on
// first upload to the missing dir (#1762), so pin the two copies together.
const repoRoot = path.resolve(__dirname, '../../..');

const readSubdirs = (file: string, pattern: RegExp): Set<string> => {
  const source = fs.readFileSync(path.join(repoRoot, file), 'utf8');
  const found = new Set<string>();
  for (const m of source.matchAll(pattern)) found.add(m[1]);
  return found;
};

describe('uploads subdirectory parity', () => {
  const fromDockerfile = readSubdirs('Dockerfile', /\/app\/uploads\/([A-Za-z0-9_-]+)/g);
  const fromBoot = readSubdirs('server/src/index.ts', /path\.join\(uploadsDir, '([A-Za-z0-9_-]+)'\)/g);

  it('finds both lists (guards against the regexes silently matching nothing)', () => {
    expect(fromDockerfile.size).toBeGreaterThan(0);
    expect(fromBoot.size).toBeGreaterThan(0);
  });

  it('creates the same uploads subdirs in the Dockerfile and at boot', () => {
    expect([...fromBoot].sort()).toEqual([...fromDockerfile].sort());
  });

  it('covers every uploads subdir the server writes to', () => {
    // journey/ and places/ are written by journey.controller.ts and
    // services/placeImage.ts; the rest are the long-standing upload stores.
    expect([...fromBoot].sort()).toEqual([
      'avatars',
      'covers',
      'files',
      'journey',
      'photos',
      'places',
    ]);
  });
});
