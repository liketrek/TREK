import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mcpAppsAdminRepo } from '../../../repo/mcpAppsAdminRepo';
import type { Addon } from './addonModel';
import { useAiAddonTile } from './useAiAddonTile';

// FE-HOOK-AITILE-001 to FE-HOOK-AITILE-004

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

const addon = (id: string, enabled: boolean): Addon => ({
  id,
  name: id,
  description: '',
  icon: '',
  type: 'ai',
  enabled,
});
const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;
const render = (addons: Addon[]) => renderHook(() => useAiAddonTile(addons), { wrapper });

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
  vi.spyOn(mcpAppsAdminRepo, 'get').mockResolvedValue({ enabled: true });
  vi.spyOn(mcpAppsAdminRepo, 'update').mockImplementation(async (enabled: boolean) => ({ enabled }));
});
afterEach(() => vi.restoreAllMocks());

describe('useAiAddonTile, the MCP Apps switch', () => {
  it('FE-HOOK-AITILE-001: reads nothing while MCP is off, and offers no switch', () => {
    const { result } = render([addon('mcp', false)]);
    expect(mcpAppsAdminRepo.get).not.toHaveBeenCalled();
    expect(result.current.mcpApps).toBeNull();
  });

  it('FE-HOOK-AITILE-002: offers the switch only once the server said where it stands', async () => {
    let answer: (value: { enabled: boolean }) => void = () => undefined;
    vi.mocked(mcpAppsAdminRepo.get).mockReturnValueOnce(new Promise((resolve) => (answer = resolve)));
    const { result } = render([addon('mcp', true)]);
    expect(result.current.mcpApps).toBeNull();
    await act(async () => answer({ enabled: true }));
    expect(result.current.mcpApps?.enabled).toBe(true);
  });

  it('FE-HOOK-AITILE-003: a failed read says so in its own words and offers no switch', async () => {
    vi.mocked(mcpAppsAdminRepo.get).mockRejectedValueOnce(new Error('boom'));
    const { result } = render([addon('mcp', true)]);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('admin.mcpApps.loadError'));
    expect(result.current.mcpApps).toBeNull();
  });

  it('FE-HOOK-AITILE-004: a flip saves once, a second click while it saves is ignored, a failed save puts it back', async () => {
    const { result } = render([addon('mcp', true)]);
    await waitFor(() => expect(result.current.mcpApps).not.toBeNull());
    let finish: () => void = () => undefined;
    vi.mocked(mcpAppsAdminRepo.update).mockReturnValueOnce(
      new Promise((resolve) => (finish = () => resolve({ enabled: false })))
    );
    let first: Promise<void> | undefined;
    act(() => {
      first = result.current.mcpApps?.toggle();
    });
    expect(result.current.mcpApps?.enabled).toBe(false);
    await act(async () => result.current.mcpApps?.toggle());
    expect(mcpAppsAdminRepo.update).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish();
      await first;
    });
    expect(toast.success).toHaveBeenCalledWith('admin.addons.toast.updated');
    vi.mocked(mcpAppsAdminRepo.update).mockRejectedValueOnce(new Error('nope'));
    await act(async () => result.current.mcpApps?.toggle());
    expect(result.current.mcpApps?.enabled).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('admin.addons.toast.error');
  });
});
