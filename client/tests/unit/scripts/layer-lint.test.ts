import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { importsOf, layerOf, layerOfPath } from '../../../scripts/lib/imports.mjs';
import { check, RULES, violations } from '../../../scripts/lib/layers.mjs';
import { RatchetError } from '../../../scripts/lib/ratchet.mjs';
import { ratchetTree, type RatchetTree } from '../../helpers/ratchetFixture';

let tree: RatchetTree;
afterEach(() => tree?.remove());

const BASELINE = 'scripts/layers-baseline.json';

function run(baseline: Record<string, number>, files: Record<string, string>, update = false) {
  tree = ratchetTree({ [BASELINE]: JSON.stringify(baseline), ...files });
  return check({ root: tree.root, baselinePath: tree.path(BASELINE), update, ...tree.out });
}

describe('scripts/lib/imports', () => {
  it('IMPORTS-001: finds static, multi-line, re-exported, dynamic and type imports, and nothing in comments or strings', () => {
    const source = [
      "import a from './a'",
      'import {',
      '  b,',
      "} from './b'",
      "import type { C } from './c'",
      "import { type D } from './d'",
      "import E, { type F } from './e'",
      "export { g } from './g'",
      "export type { H } from './h'",
      "const i = () => import('./i')",
      "let j: typeof import('./j')",
      "// import k from './k'",
      'const l = "import m from \'./m\'"',
      "import './n.css'",
    ].join('\n');
    expect(importsOf(source, 'x.tsx')).toEqual([
      { specifier: './a', line: 1, typeOnly: false },
      { specifier: './b', line: 2, typeOnly: false },
      { specifier: './c', line: 5, typeOnly: true },
      { specifier: './d', line: 6, typeOnly: true },
      { specifier: './e', line: 7, typeOnly: false },
      { specifier: './g', line: 8, typeOnly: false },
      { specifier: './h', line: 9, typeOnly: true },
      { specifier: './i', line: 10, typeOnly: false },
      { specifier: './j', line: 11, typeOnly: true },
      { specifier: './n.css', line: 14, typeOnly: false },
    ]);
  });

  it('IMPORTS-002: resolves a relative import to the top directory under src/', () => {
    const src = join('/r', 'src');
    const from = join(src, 'components', 'Map', 'MapView.tsx');
    expect(layerOf(src, from, '../../pages/atlas/atlasModel')).toBe('pages');
    expect(layerOf(src, from, './MapMarkers')).toBe('components');
    expect(layerOf(src, from, '../../types')).toBe('types');
    expect(layerOf(src, from, 'react')).toBeNull();
    expect(layerOf(src, from, '../../../../shared/src')).toBeNull();
  });

  it('IMPORTS-003: a file directly in src/ is the layer of its name without the extension', () => {
    expect(layerOfPath('types.ts')).toBe('types');
    expect(layerOfPath('App.tsx')).toBe('App');
    expect(layerOfPath('vite-env.d.ts')).toBe('vite-env');
    expect(layerOfPath('types/tz-lookup.d.ts')).toBe('types');
    expect(layerOfPath('components/Map/MapView.tsx')).toBe('components');
    const src = join('/r', 'src');
    expect(layerOf(src, join(src, 'App.tsx'), './types.ts')).toBe('types');
  });
});

describe('lint:layers', () => {
  it('LAYERS-001: components may not import pages/ or mobile/, and the core no view at all', () => {
    expect(RULES.components).toEqual(expect.arrayContaining(['pages', 'mobile']));
    for (const core of ['store', 'repo', 'sync', 'api', 'db', 'utils']) {
      expect(RULES[core as keyof typeof RULES]).toEqual(
        expect.arrayContaining(['components', 'mobile', 'pages', 'hooks'])
      );
    }
    expect(RULES.repo).toContain('store');
  });

  it('LAYERS-002: reports each import against the layering with its line', () => {
    tree = ratchetTree({
      'src/components/A.tsx':
        "import { m } from '../pages/x/model'\nimport { useIsPhone } from '../mobile/useIsPhone'\nimport { s } from '../store/s'\n",
      'src/store/s.ts': "import type { P } from '../components/P'\n",
      'src/pages/P.tsx': "import A from '../components/A'\nimport M from '../mobile/M'\n",
      'src/components/A.test.tsx': "import P from '../pages/P'\n",
    });
    expect(violations(tree.root)).toEqual({
      'src/components/A.tsx': [
        "1: '../pages/x/model' (components into pages)",
        "2: '../mobile/useIsPhone' (components into mobile)",
      ],
      'src/store/s.ts': ["1: '../components/P' (store into components)"],
    });
  });

  it('LAYERS-003: fails a file that gains an import against the layering', () => {
    expect(run({}, { 'src/components/A.tsx': "import { m } from '../pages/x/model'\n" })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/src\/components\/A\.tsx: 1 import\(s\) against the layering, baseline 0/);
    expect(tree.error.join('\n')).toMatch(/1: '\.\.\/pages\/x\/model' \(components into pages\)/);
  });

  it('LAYERS-004: holds a baselined file at its entry', () => {
    const files = { 'src/components/A.tsx': "import { m } from '../pages/x/model'\n" };
    expect(run({ 'src/components/A.tsx': 1 }, files)).toBe(0);
  });

  it('LAYERS-005: --update lowers and drops entries and never raises one', () => {
    run(
      { 'src/components/A.tsx': 3, 'src/components/B.tsx': 1 },
      {
        'src/components/A.tsx': "import { m } from '../pages/x/model'\n",
        'src/components/B.tsx': "import { m } from '../utils/m'\n",
      },
      true
    );
    expect(JSON.parse(readFileSync(tree.path(BASELINE), 'utf8'))).toEqual({ 'src/components/A.tsx': 1 });
  });

  it('LAYERS-008: fails an entry above the imports a file holds, or for a file that is gone, until --update', () => {
    const files = { 'src/components/A.tsx': "import { m } from '../pages/x/model'\n" };
    expect(run({ 'src/components/A.tsx': 2, 'src/components/Gone.tsx': 1 }, files)).toBe(1);
    const out = tree.error.join('\n');
    expect(out).toMatch(/src\/components\/A\.tsx is held at 2 in scripts\/layers-baseline\.json, but there are 1 now/);
    expect(out).toMatch(/src\/components\/Gone\.tsx is held at 1 .*but the file is gone/);
    expect(out).toMatch(/npm run lint:layers -- --update/);
    tree.remove();
    expect(run({ 'src/components/A.tsx': 2, 'src/components/Gone.tsx': 1 }, files, true)).toBe(0);
  });

  it('LAYERS-007: help/ and vacay/ are helpers and import no view', () => {
    for (const helper of ['help', 'vacay']) {
      expect(RULES[helper as keyof typeof RULES]).toEqual(
        expect.arrayContaining(['components', 'mobile', 'pages', 'hooks'])
      );
    }
    const files = {
      'src/help/contexts/trip.ts': "import { Panel } from '../../components/Help/Panel'\n",
      'src/vacay/yearWindow.ts': "import { useIsPhone } from '../hooks/useIsPhone'\n",
    };
    expect(run({}, files)).toBe(1);
    expect(tree.error.join('\n')).toMatch(/src\/help\/contexts\/trip\.ts: 1 import\(s\) against the layering/);
    expect(tree.error.join('\n')).toMatch(/src\/vacay\/yearWindow\.ts: 1 import\(s\) against the layering/);
  });

  it('LAYERS-008: src/types.ts is held to the rules of types and imports no view', () => {
    const files = {
      'src/types.ts': "import type { Props } from './components/Map/MapView'\nimport type { T } from '@trek/shared'\n",
    };
    expect(run({}, files)).toBe(1);
    expect(tree.error.join('\n')).toMatch(/src\/types\.ts: 1 import\(s\) against the layering/);
    expect(tree.error.join('\n')).toMatch(/\(types into components\)/);
  });

  it('LAYERS-006: a missing baseline stops the check', () => {
    tree = ratchetTree({ 'src/a.ts': '' });
    expect(() => check({ root: tree.root, baselinePath: tree.path(BASELINE), ...tree.out })).toThrow(RatchetError);
  });
});
