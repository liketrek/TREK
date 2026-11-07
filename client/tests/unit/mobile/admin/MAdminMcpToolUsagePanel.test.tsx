import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MAdminMcpToolUsagePanel from '../../../../src/mobile/screens/admin/MAdminMcpToolUsagePanel';

// FE-MADMIN-MCPUSAGE-001 to FE-MADMIN-MCPUSAGE-003

const hook = vi.hoisted(() => ({
  state: {
    days: 30,
    setDays: vi.fn(),
    tools: [] as Array<{ tool: string; calls: number; users: number; last_called_at: string }>,
    totalCalls: 0,
    loading: false,
    maxCalls: 0,
  },
}));
vi.mock('../../../../src/components/Admin/useMcpToolUsage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/components/Admin/useMcpToolUsage')>()),
  useMcpToolUsage: () => hook.state,
}));
vi.mock('../../../../src/i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock('../../../../src/hooks/useDateFormat', () => ({ useFormatDate: () => ({ formatDate: () => '5 Nov' }) }));

beforeEach(() => {
  hook.state = { ...hook.state, tools: [], totalCalls: 0, loading: false, maxCalls: 0, setDays: vi.fn() };
});

describe('MAdminMcpToolUsagePanel', () => {
  it('FE-MADMIN-MCPUSAGE-001: says when no tool was called', () => {
    render(<MAdminMcpToolUsagePanel />);
    expect(screen.getByText('admin.mcpToolUsage.empty')).toBeTruthy();
  });

  it('FE-MADMIN-MCPUSAGE-002: lists each tool with its calls, users and last call', () => {
    hook.state = {
      ...hook.state,
      tools: [{ tool: 'list_trips', calls: 8, users: 2, last_called_at: '2026-11-05 10:00:00' }],
      totalCalls: 8,
      maxCalls: 8,
    };
    render(<MAdminMcpToolUsagePanel />);
    const row = screen.getByText('list_trips').closest('li');
    expect(row?.textContent).toContain('8');
    expect(row?.textContent).toContain('admin.mcpToolUsage.users: 2');
    expect(row?.textContent).toContain('5 Nov');
  });

  it('FE-MADMIN-MCPUSAGE-003: the span buttons say which is on and hand the hook the next', () => {
    render(<MAdminMcpToolUsagePanel />);
    expect(screen.getByRole('button', { name: '30' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: '90' }));
    expect(hook.state.setDays).toHaveBeenCalledWith(90);
  });
});
