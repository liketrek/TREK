import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen, waitFor } from '../../../tests/helpers/render';

const { configMock, devicesMock, enableMock, capabilityMock } = vi.hoisted(() => ({
  configMock: vi.fn(),
  devicesMock: vi.fn(),
  enableMock: vi.fn(),
  capabilityMock: vi.fn(() => 'supported'),
}));

vi.mock('../../api/client', () => ({
  notificationsApi: {
    webPushConfig: configMock,
    webPushDevices: devicesMock,
    renameWebPushDevice: vi.fn(),
    revokeWebPushDevice: vi.fn(),
    testWebPushDevice: vi.fn(),
  },
}));
vi.mock('../../services/webPush', () => ({
  detectWebPushCapability: capabilityMock,
  disableCurrentWebPush: vi.fn(),
  enableWebPush: enableMock,
  getWebPushInstallationId: () => '728f0f50-d4a7-4e8b-aaf1-e4774df6bdfa',
}));

import WebPushDevices from './WebPushDevices';

beforeEach(() => {
  configMock.mockReset().mockResolvedValue({
    enabled: true,
    available: true,
    publicKey: 'BPUBLIC',
    canonicalOrigin: 'https://trek.example.test',
    maxDevices: 10,
  });
  devicesMock.mockReset().mockResolvedValue({ devices: [] });
  enableMock.mockReset().mockResolvedValue({ state: 'active', device: { id: 1 } });
  capabilityMock.mockReset().mockReturnValue('supported');
});

describe('WebPushDevices', () => {
  it('lets a user explicitly enable this browser installation', async () => {
    const user = userEvent.setup();
    render(<WebPushDevices />);
    const enable = await screen.findByRole('button', { name: /enable push/i });
    await user.click(enable);
    expect(enableMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(devicesMock).toHaveBeenCalledTimes(2));
  });

  it('shows iOS installation guidance instead of requesting permission', async () => {
    capabilityMock.mockReturnValue('ios-install-required');
    render(<WebPushDevices />);
    expect(await screen.findByText(/home screen/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /enable push/i })).not.toBeInTheDocument();
  });
});
