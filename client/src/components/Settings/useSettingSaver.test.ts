// FE-COMP-SETTINGSAVER-001 onwards: the one preference save behind both general settings shells.
import { act, renderHook } from '@testing-library/react';

import { buildSettings } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useSettingsStore } from '../../store/settingsStore';
import { useSettingSaver } from './useSettingSaver';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

const updateSetting = vi.fn();

beforeEach(() => {
  resetAllStores();
  toast.error.mockReset();
  updateSetting.mockReset().mockResolvedValue(undefined);
  seedStore(useSettingsStore, { settings: buildSettings({ time_format: '12h' }), updateSetting });
});

describe('useSettingSaver', () => {
  it('FE-COMP-SETTINGSAVER-001: hands out the current settings and saves one key', async () => {
    const { result } = renderHook(() => useSettingSaver());
    expect(result.current.settings.time_format).toBe('12h');
    await act(() => result.current.save('time_format', '24h'));
    expect(updateSetting).toHaveBeenCalledWith('time_format', '24h');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('FE-COMP-SETTINGSAVER-002: a failure shows its message, or the generic one', async () => {
    const { result } = renderHook(() => useSettingSaver());
    updateSetting.mockRejectedValueOnce(new Error('nope'));
    await act(() => result.current.save('language', 'de'));
    expect(toast.error).toHaveBeenLastCalledWith('nope');
    updateSetting.mockRejectedValueOnce('x');
    await act(() => result.current.save('language', 'de'));
    expect(toast.error).toHaveBeenLastCalledWith('common.error');
  });
});
