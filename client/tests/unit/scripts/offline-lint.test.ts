import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { bypasses, check } from '../../../scripts/lib/offline.mjs';
import { RatchetError } from '../../../scripts/lib/ratchet.mjs';
import { ratchetTree, type RatchetTree } from '../../helpers/ratchetFixture';

let tree: RatchetTree;
afterEach(() => tree?.remove());

const BASELINE = 'scripts/offline-baseline.json';
const DIRECT = "import { tripsApi } from '../../api/client'\n";

function run(baseline: string[], files: Record<string, string>, update = false) {
  tree = ratchetTree({
    [BASELINE]: JSON.stringify(baseline),
    'src/api/client.ts': 'export const tripsApi = {}\n',
    ...files,
  });
  return check({ root: tree.root, baselinePath: tree.path(BASELINE), update, ...tree.out });
}

describe('lint:offline', () => {
  it('OFFLINE-001: finds view files that import src/api/ for more than types', () => {
    tree = ratchetTree({
      'src/components/A/A.tsx': DIRECT,
      'src/mobile/M.tsx': "import { connect } from '../api/websocket'\n",
      'src/pages/p/usePage.ts': "const load = () => import('../../api/client')\n",
      'src/hooks/useTypes.ts': "import type { Trip } from '../api/client'\n",
      'src/hooks/useMixed.ts': "import { type Trip, tripsApi } from '../api/client'\n",
      'src/store/s.ts': "import { tripsApi } from '../api/client'\n",
      'src/repo/r.ts': "import { tripsApi } from '../api/client'\n",
      'src/components/A/A.test.tsx': DIRECT,
      'src/components/B.tsx': "import { tripRepo } from '../repo/tripRepo'\n",
    });
    expect(bypasses(tree.root)).toEqual({
      'src/components/A/A.tsx': ["1: '../../api/client'"],
      'src/hooks/useMixed.ts': ["1: '../api/client'"],
      'src/mobile/M.tsx': ["1: '../api/websocket'"],
      'src/pages/p/usePage.ts': ["1: '../../api/client'"],
    });
  });

  it('OFFLINE-002: passes the listed files and fails a new one', () => {
    expect(run(['src/components/A/A.tsx'], { 'src/components/A/A.tsx': DIRECT })).toBe(0);
    tree.remove();
    expect(
      run(['src/components/A/A.tsx'], { 'src/components/A/A.tsx': DIRECT, 'src/components/B/B.tsx': DIRECT })
    ).toBe(1);
    expect(tree.error.join('\n')).toMatch(/src\/components\/B\/B\.tsx imports src\/api\/ directly/);
    expect(tree.error.join('\n')).not.toMatch(/A\.tsx imports/);
  });

  it('OFFLINE-003: fails a listed file that stopped, until --update takes it off', () => {
    const files = { 'src/components/A/A.tsx': "import { tripRepo } from '../../repo/tripRepo'\n" };
    expect(run(['src/components/A/A.tsx'], files)).toBe(1);
    expect(tree.error.join('\n')).toMatch(/A\.tsx is listed .* no longer imports src\/api\//);
    tree.remove();
    expect(run(['src/components/A/A.tsx'], files, true)).toBe(0);
    expect(JSON.parse(readFileSync(tree.path(BASELINE), 'utf8'))).toEqual([]);
  });

  it('OFFLINE-004: --update never puts a file on the list', () => {
    expect(run([], { 'src/hooks/useX.ts': "import { tripsApi } from '../api/client'\n" }, true)).toBe(1);
    expect(JSON.parse(readFileSync(tree.path(BASELINE), 'utf8'))).toEqual([]);
  });

  it('OFFLINE-005: a broken baseline stops the check', () => {
    tree = ratchetTree({ [BASELINE]: '{"src/a.ts": 1}', 'src/a.ts': '' });
    expect(() => check({ root: tree.root, baselinePath: tree.path(BASELINE), ...tree.out })).toThrow(RatchetError);
  });
});
