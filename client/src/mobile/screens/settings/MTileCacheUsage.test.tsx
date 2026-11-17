import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '../../../../tests/helpers/render';
import { tileCacheActive } from '../../../native/tileCache';
import { TrekShell } from '../../../native/trekShell';
import MTileCacheUsage from './MTileCacheUsage';

vi.mock('../../../native/tileCache', () => ({ tileCacheActive: vi.fn() }));
vi.mock('../../../native/trekShell', () => ({
  TrekShell: { getTileCacheUsage: vi.fn(), clearTileCache: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(tileCacheActive).mockReturnValue(true);
  vi.mocked(TrekShell.getTileCacheUsage)
    .mockReset()
    .mockResolvedValue({ bytes: 84 * 1024 * 1024, limit: 250 * 1024 * 1024 });
  vi.mocked(TrekShell.clearTileCache).mockReset().mockResolvedValue();
});

describe('MTileCacheUsage', () => {
  it('shows what the map tile store takes against its limit, and empties it', async () => {
    render(<MTileCacheUsage />);
    expect(await screen.findByText(/84/)).toHaveTextContent(/250/);

    vi.mocked(TrekShell.getTileCacheUsage).mockResolvedValue({ bytes: 0, limit: 250 * 1024 * 1024 });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(TrekShell.clearTileCache).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled());
  });

  it('renders nothing outside a binary with the store', () => {
    vi.mocked(tileCacheActive).mockReturnValue(false);
    const { container } = render(<MTileCacheUsage />);
    expect(container).toBeEmptyDOMElement();
    expect(TrekShell.getTileCacheUsage).not.toHaveBeenCalled();
  });
});
