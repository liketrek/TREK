// FE-COMP-AI-FOLLOW-001 to 003: the "map follows the assistant" switch, in both AI settings shells.
import userEvent from '@testing-library/user-event';
import type { AiStatusResponse } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildUser } from '../../../../tests/helpers/factories';
import { render, screen } from '../../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { useAssistantStore } from '../../../store/assistantStore';
import { useAuthStore } from '../../../store/authStore';
import { useSettingsStore } from '../../../store/settingsStore';

const repo = vi.hoisted(() => ({ status: vi.fn(), models: vi.fn() }));
vi.mock('../../../repo/aiConnectionsRepo', () => ({ aiConnectionsRepo: repo }));

const { default: AiConnectionSection } = await import('./AiConnectionSection');
const { default: MAiConnectionSection } = await import('../../../mobile/screens/settings/MAiConnectionSection');

const INSTANCE: AiStatusResponse = {
  available: true,
  policy: 'instance',
  canConnectOwn: false,
  effective: { source: 'instance', kind: 'openai', model: 'gpt', host: 'api.openai.com', paidBy: 'instance' },
  own: null,
  instance: { kind: 'openai', model: 'gpt', host: 'api.openai.com' },
  quota: null,
  privacyAcked: true,
  retention: { mode: 'days', days: 90 },
  openrouterOAuth: false,
};

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  useAssistantStore.setState({ status: null });
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  repo.models.mockResolvedValue([]);
});

describe('AI settings: the map follows the assistant', () => {
  it('FE-COMP-AI-FOLLOW-001: on by default once the assistant runs, and switching it off saves the setting', async () => {
    const user = userEvent.setup();
    repo.status.mockResolvedValue(INSTANCE);
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    useSettingsStore.setState({ updateSetting });
    render(<AiConnectionSection />);

    const toggle = await screen.findByRole('button', { name: 'Map follows the assistant' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('The map pans to where the assistant searches and suggests places.')).toBeInTheDocument();
    await user.click(toggle);
    expect(updateSetting).toHaveBeenCalledWith('assistant_map_follow', false);
  });

  it('FE-COMP-AI-FOLLOW-002: not offered before there is an assistant to follow', async () => {
    repo.status.mockResolvedValue({
      ...INSTANCE,
      available: false,
      instance: null,
      effective: null,
      policy: 'instance_or_user',
      canConnectOwn: true,
    });
    render(<AiConnectionSection />);
    expect(await screen.findByText('What would you like to chat with?')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Map follows the assistant' })).not.toBeInTheDocument();
  });

  it('FE-COMP-AI-FOLLOW-003: the phone card has the same switch on the same setting', async () => {
    const user = userEvent.setup();
    repo.status.mockResolvedValue(INSTANCE);
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    useSettingsStore.setState((s) => ({ updateSetting, settings: { ...s.settings, assistant_map_follow: false } }));
    render(<MAiConnectionSection />);

    const toggle = await screen.findByRole('switch', { name: 'Map follows the assistant' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await user.click(toggle);
    expect(updateSetting).toHaveBeenCalledWith('assistant_map_follow', true);
  });
});
