import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '../../../../tests/helpers/render';
import {
  removeClientCertificate,
  replaceClientCertificate,
  storedClientCertificate,
} from '../../../native/clientCertificate';
import { TrekShell } from '../../../native/trekShell';
import MClientCertCard from './MClientCertCard';

vi.mock('../../../native/clientCertificate', () => ({
  storedClientCertificate: vi.fn(),
  replaceClientCertificate: vi.fn(),
  removeClientCertificate: vi.fn(),
}));
vi.mock('../../../native/trekShell', () => ({
  TrekShell: { getServer: vi.fn(async () => ({ url: 'https://trek.example.com' })), reload: vi.fn(async () => {}) },
}));

const info = {
  host: 'trek.example.com',
  port: 443,
  subject: 'Phone of the household',
  issuer: 'Home CA',
  notAfter: Date.UTC(2028, 10, 8),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(storedClientCertificate).mockResolvedValue(info);
});

describe('MClientCertCard', () => {
  it('stays away without a stored certificate', async () => {
    vi.mocked(storedClientCertificate).mockResolvedValue(null);
    const { container } = render(<MClientCertCard />);
    await waitFor(() => expect(storedClientCertificate).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('shows whom the certificate names, who issued it and the server it is for', async () => {
    render(<MClientCertCard />);
    expect(await screen.findByText('Phone of the household')).toBeInTheDocument();
    expect(screen.getByText('Issued by Home CA')).toBeInTheDocument();
    expect(screen.getByText('trek.example.com')).toBeInTheDocument();
  });

  it('replaces it for the server shown and reloads, or says why it could not', async () => {
    vi.mocked(replaceClientCertificate).mockResolvedValueOnce({ result: 'failed', failure: 'expired' });
    render(<MClientCertCard />);
    fireEvent.click(await screen.findByRole('button', { name: 'Replace' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('This certificate has expired.');
    expect(TrekShell.reload).not.toHaveBeenCalled();

    vi.mocked(replaceClientCertificate).mockResolvedValueOnce({ result: 'imported', certificate: info });
    fireEvent.click(screen.getByRole('button', { name: 'Replace' }));
    await waitFor(() => expect(TrekShell.reload).toHaveBeenCalledTimes(1));
    expect(replaceClientCertificate).toHaveBeenLastCalledWith(
      'https://trek.example.com',
      expect.objectContaining({ title: 'Certificate password' })
    );
  });

  it('removes it only after the confirmation, then reloads', async () => {
    vi.mocked(removeClientCertificate).mockResolvedValueOnce(true);
    render(<MClientCertCard />);
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    expect(removeClientCertificate).not.toHaveBeenCalled();
    const buttons = await screen.findAllByRole('button', { name: 'Remove' });
    fireEvent.click(buttons[buttons.length - 1]);
    await waitFor(() => expect(TrekShell.reload).toHaveBeenCalledTimes(1));
    expect(removeClientCertificate).toHaveBeenCalledTimes(1);
  });
});
