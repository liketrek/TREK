/**
 * FE-KBD-001 to FE-KBD-002
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { render } from '../../../tests/helpers/render';
import { isApplePlatform } from '../../utils/applePlatform';
import Kbd from './Kbd';

afterEach(() => vi.restoreAllMocks());

describe('Kbd', () => {
  it('FE-KBD-001: draws one key chip per key, in order, inside one kbd', () => {
    const { container } = render(<Kbd keys={['Ctrl', 'K']} />);
    const kbd = container.querySelector('kbd');
    expect(kbd).not.toBeNull();
    expect(Array.from(kbd?.children ?? []).map((k) => k.textContent)).toEqual(['Ctrl', 'K']);
  });

  it('FE-KBD-002: reads the platform off the user agent', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)');
    expect(isApplePlatform()).toBe(true);
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    expect(isApplePlatform()).toBe(false);
  });
});
