import { describe, expect, it } from 'vitest';

import { useStudioStore } from '../../../src/store/studioStore';

/** FE-STUDIO-ALIGNTO-001: what the arrange section lines things up with stays as picked across selections. */
describe('the align target', () => {
  it('FE-STUDIO-ALIGNTO-001: is kept when the selection changes', () => {
    useStudioStore.setState({ alignTo: null, selection: [] });
    useStudioStore.getState().setAlignTo('safe');
    useStudioStore.getState().select(['a']);
    useStudioStore.getState().select(['b', 'c']);
    expect(useStudioStore.getState().alignTo).toBe('safe');
  });
});
