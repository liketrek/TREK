// FE-THEME-APPLY-001 to FE-THEME-APPLY-014
import { APPEARANCE_SNAPSHOT_KEY, applyAppearance, clearAppearanceSnapshot } from './applyAppearance';

const root = document.documentElement;

function snapshot(): Record<string, unknown> {
  return JSON.parse(localStorage.getItem(APPEARANCE_SNAPSHOT_KEY) ?? '{}');
}

beforeEach(() => {
  root.className = '';
  root.removeAttribute('style');
  for (const attr of ['data-scheme', 'data-no-transparency', 'data-density', 'data-reduce-motion']) {
    root.removeAttribute(attr);
  }
  document.head.innerHTML = '';
});

describe('applyAppearance', () => {
  it('FE-THEME-APPLY-001: the default config leaves every marker attribute off', () => {
    applyAppearance({ darkMode: false });

    expect(root.classList.contains('dark')).toBe(false);
    expect(root.hasAttribute('data-scheme')).toBe(false);
    expect(root.hasAttribute('data-no-transparency')).toBe(false);
    expect(root.hasAttribute('data-density')).toBe(false);
    expect(root.hasAttribute('data-reduce-motion')).toBe(false);
    expect(root.style.getPropertyValue('--fs-scale-body')).toBe('');
    expect(root.style.fontSize).toBe('');
  });

  it('FE-THEME-APPLY-002: toggles the dark class for the boolean and string forms', () => {
    applyAppearance({ darkMode: true });
    expect(root.classList.contains('dark')).toBe(true);

    applyAppearance({ darkMode: 'light' });
    expect(root.classList.contains('dark')).toBe(false);

    applyAppearance({ darkMode: 'dark' });
    expect(root.classList.contains('dark')).toBe(true);
  });

  it('FE-THEME-APPLY-003: auto follows the OS preference', () => {
    vi.mocked(window.matchMedia).mockReturnValueOnce({ matches: true } as unknown as MediaQueryList);
    applyAppearance({ darkMode: 'auto' });
    expect(root.classList.contains('dark')).toBe(true);

    vi.mocked(window.matchMedia).mockReturnValueOnce({ matches: false } as unknown as MediaQueryList);
    applyAppearance({ darkMode: 'auto' });
    expect(root.classList.contains('dark')).toBe(false);
  });

  it('FE-THEME-APPLY-004: a shared page renders light and neutral no matter what the account wants', () => {
    const cfg = applyAppearance({
      darkMode: 'dark',
      appearance: { schemeId: 'custom', accent: { light: '#ff0000', dark: '#ff0000' }, transparency: false },
      isSharedPage: true,
    });

    expect(root.classList.contains('dark')).toBe(false);
    expect(root.hasAttribute('data-scheme')).toBe(false);
    expect(root.hasAttribute('data-no-transparency')).toBe(false);
    expect(root.style.getPropertyValue('--accent-custom-light')).toBe('');
    // The returned config is still the user's own — only the DOM is neutralised.
    expect(cfg.schemeId).toBe('custom');
  });

  it('FE-THEME-APPLY-005: writes data-scheme for a non-default scheme and clears it again', () => {
    applyAppearance({ darkMode: false, appearance: { schemeId: 'indigo' } });
    expect(root.getAttribute('data-scheme')).toBe('indigo');

    applyAppearance({ darkMode: false });
    expect(root.hasAttribute('data-scheme')).toBe(false);
  });

  it('FE-THEME-APPLY-006: marks transparency being switched off', () => {
    applyAppearance({ darkMode: false, appearance: { transparency: false } });
    expect(root.hasAttribute('data-no-transparency')).toBe(true);

    applyAppearance({ darkMode: false, appearance: { transparency: true } });
    expect(root.hasAttribute('data-no-transparency')).toBe(false);
  });

  it('FE-THEME-APPLY-007: only compact density sets an attribute', () => {
    applyAppearance({ darkMode: false, appearance: { density: 'compact' } });
    expect(root.getAttribute('data-density')).toBe('compact');

    applyAppearance({ darkMode: false, appearance: { density: 'comfortable' } });
    expect(root.hasAttribute('data-density')).toBe(false);
  });

  it('FE-THEME-APPLY-008: mirrors the reduce-motion override', () => {
    applyAppearance({ darkMode: false, appearance: { reduceMotion: true } });
    expect(root.hasAttribute('data-reduce-motion')).toBe(true);

    applyAppearance({ darkMode: false, appearance: { reduceMotion: false } });
    expect(root.hasAttribute('data-reduce-motion')).toBe(false);
  });

  it('FE-THEME-APPLY-009: a custom accent writes the four inline vars', () => {
    applyAppearance({
      darkMode: false,
      appearance: { schemeId: 'custom', accent: { light: '#4f46e5', dark: '#818cf8' } },
    });

    expect(root.style.getPropertyValue('--accent-custom-light')).toBe('#4f46e5');
    expect(root.style.getPropertyValue('--accent-custom-dark')).toBe('#818cf8');
  });

  it('FE-THEME-APPLY-010: derives a legible accent text colour from the luminance', () => {
    applyAppearance({
      darkMode: false,
      // dark fill -> white text, near-white fill -> near-black text
      appearance: { schemeId: 'custom', accent: { light: '#111827', dark: '#f8fafc' } },
    });

    expect(root.style.getPropertyValue('--accent-custom-text-light')).toBe('#ffffff');
    expect(root.style.getPropertyValue('--accent-custom-text-dark')).toBe('#111827');
  });

  it('FE-THEME-APPLY-011: accepts the three-digit hex shorthand', () => {
    applyAppearance({
      darkMode: false,
      appearance: { schemeId: 'custom', accent: { light: '#fff', dark: '#000' } },
    });

    expect(root.style.getPropertyValue('--accent-custom-text-light')).toBe('#111827');
    expect(root.style.getPropertyValue('--accent-custom-text-dark')).toBe('#ffffff');
  });

  it('FE-THEME-APPLY-012: removes the accent vars when the scheme leaves custom', () => {
    applyAppearance({
      darkMode: false,
      appearance: { schemeId: 'custom', accent: { light: '#4f46e5', dark: '#818cf8' } },
    });
    applyAppearance({ darkMode: false, appearance: { schemeId: 'default' } });

    expect(root.style.getPropertyValue('--accent-custom-light')).toBe('');
    expect(root.style.getPropertyValue('--accent-custom-text-dark')).toBe('');
  });

  it('FE-THEME-APPLY-013: writes the scale vars and root font-size only when they deviate from 1', () => {
    applyAppearance({ darkMode: false, appearance: { fontScale: 1.2 } });

    expect(root.style.getPropertyValue('--fs-scale-title')).toBe('1.2');
    expect(root.style.getPropertyValue('--fs-scale-body')).toBe('1.2');
    expect(root.style.fontSize).toBe('120%');

    applyAppearance({ darkMode: false, appearance: { fontScale: 1 } });
    expect(root.style.getPropertyValue('--fs-scale-title')).toBe('');
    expect(root.style.fontSize).toBe('');
  });

  it('FE-THEME-APPLY-014: updates the theme-color meta tag when one is present', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    meta.setAttribute('content', '#ffffff');
    document.head.appendChild(meta);

    applyAppearance({ darkMode: true });
    expect(meta.getAttribute('content')).toBe('#09090b');

    applyAppearance({ darkMode: false });
    expect(meta.getAttribute('content')).toBe('#ffffff');
  });
});

describe('appearance snapshot', () => {
  it('FE-THEME-APPLY-015: persists the resolved state for the pre-paint boot script', () => {
    applyAppearance({
      darkMode: 'dark',
      appearance: { schemeId: 'custom', accent: { light: '#111827', dark: '#f8fafc' }, transparency: false, density: 'compact' },
    });

    const snap = snapshot();
    expect(snap.v).toBe(1);
    expect(snap.darkMode).toBe('dark');
    expect(snap.scheme).toBe('custom');
    expect(snap.noTransparency).toBe(true);
    expect(snap.density).toBe('compact');
    expect(snap.accentText).toEqual({ light: '#ffffff', dark: '#111827' });
  });

  it('FE-THEME-APPLY-016: clearAppearanceSnapshot drops the stored snapshot', () => {
    applyAppearance({ darkMode: false });
    expect(localStorage.getItem(APPEARANCE_SNAPSHOT_KEY)).not.toBeNull();

    clearAppearanceSnapshot();
    expect(localStorage.getItem(APPEARANCE_SNAPSHOT_KEY)).toBeNull();
  });

  it('FE-THEME-APPLY-017: a storage failure stays non-fatal', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });

    expect(() => applyAppearance({ darkMode: false })).not.toThrow();
    expect(() => clearAppearanceSnapshot()).not.toThrow();

    setItem.mockRestore();
    removeItem.mockRestore();
  });
});
