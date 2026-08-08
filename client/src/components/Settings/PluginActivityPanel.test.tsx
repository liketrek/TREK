// FE-COMP-PLUGINACTIVITY-001 to FE-COMP-PLUGINACTIVITY-010
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor, within } from '../../../tests/helpers/render';
import { server } from '../../../tests/helpers/msw/server';
import PluginActivityPanel from './PluginActivityPanel';

interface ActivityRow {
  ts: string;
  plugin_id: string;
  plugin_name: string | null;
  method: string;
  resource: string | null;
  code: string;
}

const row = (over: Partial<ActivityRow> = {}): ActivityRow => ({
  ts: '2025-06-01T10:00:00.000Z',
  plugin_id: 'weather',
  plugin_name: 'Weather',
  method: 'trips.read',
  resource: 'trip:42',
  code: 'ok',
  ...over,
});

function serveActivity(activity: ActivityRow[]): void {
  server.use(http.get('/api/plugin-activity', () => HttpResponse.json({ activity })));
}

/** The <td> cells of the one rendered data row. */
const cells = () => within(screen.getByRole('table')).getAllByRole('row')[1].querySelectorAll('td');

beforeEach(() => {
  vi.clearAllMocks();
  serveActivity([]);
});

describe('PluginActivityPanel', () => {
  it('FE-COMP-PLUGINACTIVITY-001: shows the loading line before the log arrives', async () => {
    server.use(http.get('/api/plugin-activity', () => new Promise(() => {})));
    render(<PluginActivityPanel />);

    expect(screen.getByText('Plugin activity')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
  });

  it('FE-COMP-PLUGINACTIVITY-002: an empty log renders the empty state instead of a table', async () => {
    render(<PluginActivityPanel />);

    expect(await screen.findByText('No plugin activity yet.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled();
  });

  it('FE-COMP-PLUGINACTIVITY-003: a failing request falls back to the empty state, not a crash', async () => {
    server.use(http.get('/api/plugin-activity', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));
    render(<PluginActivityPanel />);

    expect(await screen.findByText('No plugin activity yet.')).toBeInTheDocument();
  });

  it('FE-COMP-PLUGINACTIVITY-004: entries render as a table with all five columns', async () => {
    serveActivity([row()]);
    render(<PluginActivityPanel />);

    const table = await screen.findByRole('table');
    const headers = within(table).getAllByRole('columnheader').map(th => th.textContent);
    expect(headers).toEqual(['Plugin', 'Action', 'Resource', 'When', 'Result']);
    expect(within(table).getByText('Weather')).toBeInTheDocument();
    expect(within(table).getByText('trips.read')).toBeInTheDocument();
    expect(within(table).getByText('trip:42')).toBeInTheDocument();
    expect(within(table).getByText('ok')).toBeInTheDocument();
  });

  it('FE-COMP-PLUGINACTIVITY-005: a nameless plugin falls back to its id and a null resource to a dash', async () => {
    serveActivity([row({ plugin_name: null, resource: null })]);
    render(<PluginActivityPanel />);

    await screen.findByRole('table');
    expect(cells()[0]).toHaveTextContent('weather');
    expect(cells()[2]).toHaveTextContent('—');
  });

  it('FE-COMP-PLUGINACTIVITY-006: an "ok" code gets the neutral pill', async () => {
    serveActivity([row({ code: 'ok' })]);
    render(<PluginActivityPanel />);

    await screen.findByRole('table');
    expect(screen.getByText('ok')).toHaveClass('bg-surface-hover', 'text-content-secondary');
  });

  it('FE-COMP-PLUGINACTIVITY-007: an access denial gets the danger pill', async () => {
    serveActivity([row({ code: 'FORBIDDEN' })]);
    render(<PluginActivityPanel />);

    await screen.findByRole('table');
    expect(screen.getByText('FORBIDDEN')).toHaveClass('bg-danger-soft', 'text-danger');
  });

  it('FE-COMP-PLUGINACTIVITY-008: any other non-ok code gets the warning pill', async () => {
    serveActivity([row({ code: 'RATE_LIMITED' })]);
    render(<PluginActivityPanel />);

    await screen.findByRole('table');
    expect(screen.getByText('RATE_LIMITED')).toHaveClass('bg-warning-soft', 'text-warning');
  });

  it('FE-COMP-PLUGINACTIVITY-009: an unparseable timestamp is shown verbatim', async () => {
    serveActivity([row({ ts: 'not-a-date' })]);
    render(<PluginActivityPanel />);

    await screen.findByRole('table');
    expect(cells()[3]).toHaveTextContent('not-a-date');
  });

  it('FE-COMP-PLUGINACTIVITY-010: Refresh re-reads the log', async () => {
    const user = userEvent.setup();
    let calls = 0;
    server.use(http.get('/api/plugin-activity', () => {
      calls += 1;
      return HttpResponse.json({ activity: calls === 1 ? [] : [row({ plugin_name: 'Second pass' })] });
    }));
    render(<PluginActivityPanel />);

    await screen.findByText('No plugin activity yet.');
    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => expect(screen.getByText('Second pass')).toBeInTheDocument());
    expect(calls).toBe(2);
  });
});
