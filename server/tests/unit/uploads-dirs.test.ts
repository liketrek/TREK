import { CATEGORY_PREFIXES } from '../../src/nest/storage/storage-registry.service';

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

// Driver-owned roots are created by LocalDriver.init on every storage-registry
// load now (boot and reload()) — index.ts no longer mkdirs the uploads tree.
// The Dockerfile still pre-creates the subdirs (and chowns them) at image
// build, so its `mkdir -p` list must stay in sync with the category prefixes
// rooted under uploads/. Drift is invisible until a user on a host whose
// bind-mounted uploads dir isn't writable by node hits an EACCES on first
// upload to the missing dir (#1762), so pin the two lists together.
const repoRoot = path.resolve(__dirname, '../../..');

const readDockerfileSubdirs = (): Set<string> => {
  const source = fs.readFileSync(path.join(repoRoot, 'Dockerfile'), 'utf8');
  const found = new Set<string>();
  for (const m of source.matchAll(/\/app\/uploads\/([A-Za-z0-9_-]+)/g)) found.add(m[1]);
  return found;
};

describe('uploads subdirectory parity', () => {
  const fromDockerfile = readDockerfileSubdirs();
  // The registry's real values: every non-empty category prefix lives under
  // uploads/ (backups' empty prefix is rooted in data/, not uploads/), and the
  // nested cache prefixes (photos/google, photos/trek) collapse into their
  // top-level dir.
  const fromRegistry = new Set(
    Object.values(CATEGORY_PREFIXES)
      .filter((p) => p !== '')
      .map((p) => p.split('/')[0]),
  );

  it('finds the Dockerfile list (guards against the regex silently matching nothing)', () => {
    expect(fromDockerfile.size).toBeGreaterThan(0);
  });

  it('creates the same uploads subdirs in the Dockerfile and at registry init', () => {
    expect([...fromRegistry].sort()).toEqual([...fromDockerfile].sort());
  });

  it('covers every uploads subdir the server writes to', () => {
    expect([...fromRegistry].sort()).toEqual(['avatars', 'covers', 'files', 'journey', 'photos', 'places']);
  });
});
