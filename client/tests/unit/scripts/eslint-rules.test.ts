import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, it } from 'vitest';
import trek from '../../../scripts/lib/eslint-rules.mjs';

// RuleTester reports through the test framework's describe/it.
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('trek/no-swallowed-catch', () => {
  tester.run('no-swallowed-catch', trek.rules['no-swallowed-catch'], {
    valid: [
      'load().catch((err) => toast.error(err.message))',
      'load().catch(() => setFailed(true))',
      'promise.then(() => {})',
      'try { a() } catch { b() }',
    ],
    invalid: [
      { code: 'load().catch(() => {})', errors: [{ messageId: 'swallowed' }] },
      { code: 'load().catch(() => undefined)', errors: [{ messageId: 'swallowed' }] },
      { code: 'load().catch(() => null)', errors: [{ messageId: 'swallowed' }] },
      { code: 'load().catch(function () {})', errors: [{ messageId: 'swallowed' }] },
    ],
  });
});

describe('trek/store-without-selector', () => {
  tester.run('store-without-selector', trek.rules['store-without-selector'], {
    valid: [
      'const id = useTripStore((s) => s.trip.id)',
      'const { a, b } = useTripStore(useShallow((s) => ({ a: s.a, b: s.b })))',
      'useTripStore.getState().loadTrip(1)',
      'const t = useTranslation()',
      'const s = useStore()',
    ],
    invalid: [
      { code: 'const store = useTripStore()', errors: [{ messageId: 'whole', data: { name: 'useTripStore' } }] },
      { code: 'const { settings } = useSettingsStore()', errors: [{ messageId: 'whole' }] },
    ],
  });
});

describe('trek/no-window-globals', () => {
  tester.run('no-window-globals', trek.rules['no-window-globals'], {
    valid: [
      "window.dispatchEvent(new Event('resize'))",
      "window.addEventListener('resize', onResize)",
      'window.location.reload()',
      'const data = dragSession.current',
    ],
    invalid: [
      { code: 'window.__dragData = { placeId: 1 }', errors: [{ messageId: 'global', data: { name: '__dragData' } }] },
      { code: "window.__addToast?.('saved', 'success')", errors: [{ messageId: 'global' }] },
      { code: '(window as any).__dragData = null', errors: [{ messageId: 'global' }] },
      { code: "window.dispatchEvent(new CustomEvent('accommodations:refresh'))", errors: [{ messageId: 'bus' }] },
      { code: "window.dispatchEvent(new Event('collab-files-changed'))", errors: [{ messageId: 'bus' }] },
    ],
  });
});
