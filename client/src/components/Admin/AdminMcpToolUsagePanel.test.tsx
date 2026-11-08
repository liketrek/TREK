import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AdminMcpToolUsagePanel from './AdminMcpToolUsagePanel';
import type { McpToolUsageView } from './useMcpToolUsage';

// FE-ADMIN-MCPUSAGE-001 to FE-ADMIN-MCPUSAGE-003

const hook = vi.hoisted(() => ({
  state: {
    days: 30,
    setDays: vi.fn(),
    tools: [] as McpToolUsageView[],
    totalCalls: 0,
    loading: false,
  },
}));
vi.mock('./useMcpToolUsage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./useMcpToolUsage')>()),
  useMcpToolUsage: () => hook.state,
}));
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

beforeEach(() => {
  hook.state = { ...hook.state, tools: [], totalCalls: 0, loading: false, setDays: vi.fn() };
});

describe('AdminMcpToolUsagePanel', () => {
  it('FE-ADMIN-MCPUSAGE-001: says when no tool was called', () => {
    render(<AdminMcpToolUsagePanel />);
    expect(screen.getByText('admin.mcpToolUsage.empty')).toBeTruthy();
  });

  it('FE-ADMIN-MCPUSAGE-002: lists each tool with its calls, users and last call', () => {
    hook.state = {
      ...hook.state,
      tools: [
        {
          tool: 'list_trips',
          calls: 8,
          users: 2,
          last_called_at: '2026-11-05 10:00:00',
          barWidth: '100%',
          lastCall: '5 Nov',
        },
      ],
      totalCalls: 8,
    };
    render(<AdminMcpToolUsagePanel />);
    const row = screen.getByText('list_trips').closest('tr');
    expect(row?.textContent).toContain('8');
    expect(row?.textContent).toContain('2');
    expect(row?.textContent).toContain('5 Nov');
    expect((row?.querySelector('.bg-accent') as HTMLElement).style.width).toBe('100%');
  });

  it('FE-ADMIN-MCPUSAGE-003: picking another span hands it to the hook as a number', () => {
    render(<AdminMcpToolUsagePanel />);
    fireEvent.click(screen.getByRole('button', { name: '7' }));
    expect(hook.state.setDays).toHaveBeenCalledWith(7);
  });
});
