// FE-COMP-CLAUDE-CONNECTOR-001 to FE-COMP-CLAUDE-CONNECTOR-003: adding TREK to Claude as a connector.
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '../../../../tests/helpers/render';

const repo = vi.hoisted(() => ({ claudeConnector: vi.fn() }));
const clipboard = vi.hoisted(() => ({ copyText: vi.fn() }));
vi.mock('../../../repo/aiConnectionsRepo', () => ({ aiConnectionsRepo: repo }));
vi.mock('../../../utils/clipboard', () => clipboard);

const { default: ClaudeConnectorCard } = await import('./ClaudeConnectorCard');

const CONNECTOR = {
  mcpUrl: 'https://trip.example.org/mcp',
  deepLink:
    'https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=TREK&connectorUrl=https%3A%2F%2Ftrip.example.org%2Fmcp',
  qrSvg: '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>',
};

beforeEach(() => {
  vi.clearAllMocks();
  clipboard.copyText.mockResolvedValue(true);
});

describe('ClaudeConnectorCard', () => {
  it('FE-COMP-CLAUDE-CONNECTOR-001: links a public install into Claude, with a QR code that is an image, not markup', async () => {
    repo.claudeConnector.mockResolvedValue(CONNECTOR);
    const { container } = render(<ClaudeConnectorCard />);
    const link = await screen.findByRole('link', { name: /Open in Claude/ });
    expect(link).toHaveAttribute('href', CONNECTOR.deepLink);
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    const qr = screen.getByAltText('QR code to add TREK in Claude');
    expect(qr.getAttribute('src')).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
    // The QR code's own markup never lands in the page; icons may draw rects of their own.
    expect(container.querySelector('rect[width="1"][height="1"]')).toBeNull();
    expect(document.getElementById('claude-connector')).not.toBeNull();
  });

  it('FE-COMP-CLAUDE-CONNECTOR-002: copies the address and shows the tick for a moment', async () => {
    const user = userEvent.setup();
    repo.claudeConnector.mockResolvedValue(CONNECTOR);
    render(<ClaudeConnectorCard />);
    await user.click(await screen.findByRole('button', { name: 'Copy address' }));
    expect(clipboard.copyText).toHaveBeenCalledWith(CONNECTOR.mcpUrl);
    await waitFor(() => expect(document.querySelector('.text-success')).not.toBeNull());
  });

  it('FE-COMP-CLAUDE-CONNECTOR-003: a plain-http or LAN install gets the reason instead of a link, and a failed read only the description', async () => {
    repo.claudeConnector.mockResolvedValueOnce({ ...CONNECTOR, mcpUrl: 'http://192.168.1.20:3000/mcp' });
    const { unmount } = render(<ClaudeConnectorCard />);
    expect(
      await screen.findByText('Claude can only reach TREK when it is available over https on the internet.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    unmount();

    repo.claudeConnector.mockRejectedValueOnce(new Error('404'));
    render(<ClaudeConnectorCard />);
    expect(screen.getByText('Use TREK right inside Claude: add it as a connector, sign in, done.')).toBeInTheDocument();
    await waitFor(() => expect(repo.claudeConnector).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
