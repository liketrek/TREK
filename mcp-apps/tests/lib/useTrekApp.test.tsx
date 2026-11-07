import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applySafeArea, DISPLAY_MODES, readToolResult, useTrekApp } from '../../src/lib/useTrekApp';

type Handler = ((params: Record<string, unknown>) => void) | undefined;
const fakeApp = {
  ontoolinput: undefined as Handler,
  ontoolresult: undefined as Handler,
  onhostcontextchanged: undefined as Handler,
  getHostContext: () => ({ locale: 'de-DE' }),
};

const useAppOptions = vi.fn();
vi.mock('@modelcontextprotocol/ext-apps/react', () => ({
  useApp: (options: { onAppCreated: (app: typeof fakeApp) => void }) => {
    useAppOptions(options);
    options.onAppCreated(fakeApp);
    return { app: fakeApp, isConnected: true, error: null };
  },
  useHostStyles: vi.fn(),
}));

beforeEach(() => {
  fakeApp.ontoolinput = undefined;
  fakeApp.ontoolresult = undefined;
  fakeApp.onhostcontextchanged = undefined;
});

describe('readToolResult', () => {
  it('APPS-HOOK-001: keeps the structured result and a web app link without its trailing slash', () => {
    expect(
      readToolResult({ content: [], structuredContent: { a: 1 }, _meta: { 'trek/appUrl': 'https://trek.example/' } })
    ).toEqual({
      structuredContent: { a: 1 },
      appUrl: 'https://trek.example',
    });
  });

  it('APPS-HOOK-002: drops a link that is not a web address', () => {
    expect(readToolResult({ content: [], _meta: { 'trek/appUrl': 'javascript:alert(1)' } })).toEqual({
      structuredContent: null,
      appUrl: null,
    });
  });
});

describe('useTrekApp', () => {
  it('APPS-HOOK-003: reads the host locale and the tool results it sends', () => {
    const { result } = renderHook(() => useTrekApp('test'));
    expect(result.current.locale).toBe('de-DE');
    expect(result.current.t('mcpApps.openInTrek')).toBe('In TREK öffnen');
    expect(result.current.result).toBeNull();
    act(() => fakeApp.ontoolinput?.({ arguments: { tripId: 4 } }));
    expect(result.current.input).toEqual({ tripId: 4 });
    act(() => fakeApp.ontoolresult?.({ content: [], structuredContent: { trips: [] } }));
    expect(result.current.result).toEqual({ structuredContent: { trips: [] }, appUrl: null, version: 1 });
  });

  it('APPS-HOOK-004: follows a locale change and sets the reading direction', () => {
    const { result } = renderHook(() => useTrekApp('test'));
    act(() => fakeApp.onhostcontextchanged?.({ locale: 'ar' }));
    expect(result.current.locale).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
  });
});

describe('a fresh result and the host display mode', () => {
  it('APPS-HOOK-005: counts each result handed over, and follows the display mode the host reports', () => {
    const { result } = renderHook(() => useTrekApp('test'));
    expect(result.current.displayMode).toBeUndefined();
    act(() => fakeApp.ontoolresult?.({ content: [], structuredContent: { a: 1 } }));
    act(() => fakeApp.ontoolresult?.({ content: [], structuredContent: { a: 2 } }));
    expect(result.current.result).toMatchObject({ structuredContent: { a: 2 }, version: 2 });
    act(() => fakeApp.onhostcontextchanged?.({ displayMode: 'fullscreen' }));
    expect(result.current.displayMode).toBe('fullscreen');
    act(() => fakeApp.onhostcontextchanged?.({ displayMode: 'inline' }));
    expect(result.current.displayMode).toBe('inline');
  });
});

describe('host polish', () => {
  it('APPS-HOOK-006: tells the host every view can go full screen', () => {
    renderHook(() => useTrekApp('test'));
    expect(useAppOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({ capabilities: { availableDisplayModes: [...DISPLAY_MODES] } })
    );
    expect(DISPLAY_MODES).toEqual(['inline', 'fullscreen']);
  });

  it('APPS-HOOK-007: pads the page by the host’s safe area and clears it again', () => {
    const { unmount } = renderHook(() => useTrekApp('test'));
    act(() => fakeApp.onhostcontextchanged?.({ safeAreaInsets: { top: 44, right: 0, bottom: 34, left: 0 } }));
    const style = document.documentElement.style;
    expect(style.getPropertyValue('--trek-safe-top')).toBe('44px');
    expect(style.getPropertyValue('--trek-safe-bottom')).toBe('34px');
    expect(style.getPropertyValue('--trek-safe-left')).toBe('');
    unmount();
    applySafeArea(undefined);
    expect(style.getPropertyValue('--trek-safe-top')).toBe('');
  });
});
