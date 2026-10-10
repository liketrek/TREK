import { afterEach, describe, expect, it } from 'vitest';
import { check, manifestShape, problems } from '../../../scripts/lib/pairs.mjs';
import { RatchetError } from '../../../scripts/lib/ratchet.mjs';
import { ratchetTree, type RatchetTree } from '../../helpers/ratchetFixture';

let tree: RatchetTree;
afterEach(() => tree?.remove());

const MANIFEST = 'scripts/feature-pairs.json';
const HOOK = 'src/components/Packing/usePackingList.ts';
const DESKTOP = 'src/components/Packing/PackingPanel.tsx';
const PHONE = 'src/mobile/screens/trip/tabs/MPackingTab.tsx';
const PAIR = { feature: 'Packing list', hooks: [HOOK], desktop: [DESKTOP], mobile: [PHONE] };

const FILES: Record<string, string> = {
  [HOOK]: 'export function usePackingList() {}\n',
  [DESKTOP]: "import { usePackingList } from './usePackingList'\n",
  [PHONE]: "import { usePackingList } from '../../../../components/Packing/usePackingList'\n",
};

function run(manifest: unknown, files: Record<string, string> = FILES) {
  tree = ratchetTree({ [MANIFEST]: JSON.stringify(manifest), ...files });
  return check({ root: tree.root, manifestPath: tree.path(MANIFEST), ...tree.out });
}

describe('lint:pairs', () => {
  it('PAIRS-001: passes when both views import the hook and every phone screen is listed', () => {
    expect(run({ pairs: [PAIR], mobileOnly: {} })).toBe(0);
    expect(tree.error).toEqual([]);
    expect(tree.log.slice(-1)).toEqual(['pairs: 1 shared feature(s), 0 phone-only screen file(s), 0 problem(s)']);
  });

  it('PAIRS-002: fails when a view of a pair stops importing its hook', () => {
    expect(run({ pairs: [PAIR], mobileOnly: {} }, { ...FILES, [PHONE]: 'export const MPackingTab = 1\n' })).toBe(1);
    expect(tree.error[0]).toBe(`FAIL  ${PHONE} is a view of "Packing list" but does not import ${HOOK}`);
  });

  it('PAIRS-003: a type-only import of the hook does not count as running on it', () => {
    const typeOnly = "import type { PackingList } from '../../../../components/Packing/usePackingList'\n";
    expect(run({ pairs: [PAIR], mobileOnly: {} }, { ...FILES, [PHONE]: typeOnly })).toBe(1);
  });

  it('PAIRS-004: accepts an import with an extension, a re-export and a dynamic import', () => {
    const files = {
      ...FILES,
      [DESKTOP]: "export { usePackingList } from './usePackingList.ts'\n",
      [PHONE]: "const load = () => import('../../../../components/Packing/usePackingList')\n",
    };
    expect(run({ pairs: [PAIR], mobileOnly: {} }, files)).toBe(0);
  });

  it('PAIRS-005: fails on a phone screen file that is in no pair and not phone only', () => {
    const extra = 'src/mobile/screens/trip/sheets/MNewSheet.tsx';
    expect(run({ pairs: [PAIR], mobileOnly: {} }, { ...FILES, [extra]: 'export {}\n' })).toBe(1);
    expect(tree.error[0]).toBe(`FAIL  ${extra} is a phone screen file that scripts/feature-pairs.json does not list`);
    expect(tree.error.slice(-1)[0]).toContain('mobileOnly');
  });

  it('PAIRS-006: a phone only screen with a reason passes, tests and files outside screens are not weighed', () => {
    const files = {
      ...FILES,
      'src/mobile/screens/trip/sheets/MImportSheet.tsx': 'export {}\n',
      'src/mobile/screens/trip/sheets/MImportSheet.test.tsx': 'export {}\n',
      'src/mobile/components/MSheet.tsx': 'export {}\n',
    };
    const manifest = {
      pairs: [PAIR],
      mobileOnly: { 'src/mobile/screens/trip/sheets/MImportSheet.tsx': 'menu that routes to the import steps' },
    };
    expect(run(manifest, files)).toBe(0);
    expect(tree.log.slice(-1)).toEqual(['pairs: 1 shared feature(s), 1 phone-only screen file(s), 0 problem(s)']);
  });

  it('PAIRS-007: fails on listed files that are gone', () => {
    tree = ratchetTree(FILES);
    const gone = { ...PAIR, desktop: ['src/components/Packing/Gone.tsx'] };
    expect(problems(tree.root, { pairs: [gone], mobileOnly: { 'src/mobile/screens/MOld.tsx': 'old' } })).toEqual([
      'src/components/Packing/Gone.tsx is listed under "Packing list" but does not exist',
      'src/mobile/screens/MOld.tsx is listed under mobileOnly but does not exist',
    ]);
  });

  it('PAIRS-008: fails on a hook that lives in a view layer', () => {
    const hook = 'src/mobile/screens/trip/lib/usePacking.ts';
    const files = {
      [hook]: 'export function usePacking() {}\n',
      [DESKTOP]: "import { usePacking } from '../../mobile/screens/trip/lib/usePacking'\n",
      [PHONE]: "import { usePacking } from '../lib/usePacking'\n",
    };
    const manifest = { pairs: [{ ...PAIR, hooks: [hook] }], mobileOnly: { [hook]: 'the hook itself' } };
    expect(run(manifest, files)).toBe(1);
    expect(tree.error[0]).toBe(
      `FAIL  ${hook}, the hook of "Packing list", is not under src/components, src/hooks, src/utils or a page folder`
    );
  });

  it('PAIRS-015: a hook in a page folder counts as shared, the page file itself does not', () => {
    const hook = 'src/pages/packing/usePacking.ts';
    const page = 'src/pages/PackingPage.tsx';
    const files = {
      [hook]: 'export function usePacking() {}\n',
      [page]: 'export function PackingPage() {}\n',
      [DESKTOP]:
        "import { usePacking } from '../../pages/packing/usePacking'\nimport { PackingPage } from '../../pages/PackingPage'\n",
      [PHONE]:
        "import { usePacking } from '../../../../pages/packing/usePacking'\nimport { PackingPage } from '../../../../pages/PackingPage'\n",
    };
    expect(run({ pairs: [{ ...PAIR, hooks: [hook] }], mobileOnly: {} }, files)).toBe(0);
    tree.remove();
    expect(run({ pairs: [{ ...PAIR, hooks: [page] }], mobileOnly: {} }, files)).toBe(1);
    expect(tree.error[0]).toContain('is not under src/components, src/hooks, src/utils or a page folder');
  });

  it('PAIRS-009: fails on a phone screen listed both in a pair and as phone only', () => {
    expect(run({ pairs: [PAIR], mobileOnly: { [PHONE]: 'no twin' } })).toBe(1);
    expect(tree.error[0]).toBe(`FAIL  ${PHONE} is listed in a pair and under mobileOnly; it is one or the other`);
  });

  it('PAIRS-010: a view must import every hook of its pair', () => {
    const model = 'src/components/Packing/packingModel.ts';
    const files = { ...FILES, [model]: 'export const x = 1\n' };
    expect(run({ pairs: [{ ...PAIR, hooks: [HOOK, model] }], mobileOnly: {} }, files)).toBe(1);
    expect(tree.error.filter((line) => line.includes(model))).toHaveLength(2);
  });

  it('PAIRS-011: --list prints every pair with its hooks', () => {
    tree = ratchetTree({ [MANIFEST]: JSON.stringify({ pairs: [PAIR], mobileOnly: {} }), ...FILES });
    check({ root: tree.root, manifestPath: tree.path(MANIFEST), list: true, ...tree.out });
    expect(tree.log[0]).toBe(`Packing list: ${HOOK}`);
  });

  it('PAIRS-012: rejects a manifest of the wrong shape with the reason', () => {
    expect(manifestShape([])).toBe('it is not an object');
    expect(manifestShape({ pairs: [] })).toBe('it needs exactly the keys "pairs" and "mobileOnly"');
    expect(manifestShape({ pairs: [{ feature: '' }], mobileOnly: {} })).toMatch(/without a feature name/);
    expect(manifestShape({ pairs: [PAIR, PAIR], mobileOnly: {} })).toBe('the feature "Packing list" is listed twice');
    expect(manifestShape({ pairs: [{ ...PAIR, hooks: [] }], mobileOnly: {} })).toMatch(/needs "hooks"/);
    expect(manifestShape({ pairs: [{ ...PAIR, mobile: ['src\\m.tsx'] }], mobileOnly: {} })).toMatch(/needs "mobile"/);
    expect(manifestShape({ pairs: [], mobileOnly: { 'src/m.tsx': ' ' } })).toBe(
      '"src/m.tsx" in "mobileOnly" has no reason'
    );
    expect(manifestShape({ pairs: [], mobileOnly: { 'src/m.css': 'x' } })).toMatch(/not a source file/);
    expect(manifestShape({ pairs: [PAIR], mobileOnly: {} })).toBeNull();
  });

  it('PAIRS-013: a missing or broken manifest stops the check instead of passing', () => {
    tree = ratchetTree({ ...FILES, [MANIFEST]: '{ not json' });
    expect(() => check({ root: tree.root, manifestPath: tree.path(MANIFEST), ...tree.out })).toThrow(RatchetError);
    expect(() => check({ root: tree.root, manifestPath: tree.path('scripts/none.json'), ...tree.out })).toThrow(
      RatchetError
    );
  });

  it('PAIRS-014: a tree without phone screens stops the check instead of passing', () => {
    tree = ratchetTree({ [MANIFEST]: JSON.stringify({ pairs: [], mobileOnly: {} }), [HOOK]: 'export {}\n' });
    expect(() => check({ root: tree.root, manifestPath: tree.path(MANIFEST), ...tree.out })).toThrow(RatchetError);
  });
});
