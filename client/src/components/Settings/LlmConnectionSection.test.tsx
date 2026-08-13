// FE-COMP-LLM-001 to FE-COMP-LLM-017
import { render, screen, waitFor } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildAdmin, buildSettings, buildUser } from '../../../tests/helpers/factories';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import type { Settings } from '../../types';
import { ToastContainer } from '../shared/Toast';
import LlmConnectionSection from './LlmConnectionSection';

let loadSettings = vi.fn().mockResolvedValue(undefined);

function seedLlm(over: Partial<Settings> = {}, updateSettings = vi.fn().mockResolvedValue(undefined)) {
  loadSettings = vi.fn().mockResolvedValue(undefined);
  seedStore(useSettingsStore, {
    settings: buildSettings({ language: 'en', ...over }),
    isLoaded: true,
    updateSettings,
    loadSettings,
  });
  return updateSettings;
}

// The free-form endpoint is admin-only (#1772), so every case has to say which
// role it is looking at.
function seedRole(role: 'user' | 'admin') {
  seedStore(useAuthStore, {
    user: role === 'admin' ? buildAdmin() : buildUser(),
    isAuthenticated: true,
    isLoading: false,
  });
}

function renderSection() {
  return render(
    <>
      <ToastContainer />
      <LlmConnectionSection />
    </>,
  );
}

function multimodalToggle(): HTMLElement {
  const row = screen.getByText('Send documents as images').parentElement as HTMLElement;
  return row.querySelector('button') as HTMLElement;
}

async function pickProvider(user: ReturnType<typeof userEvent.setup>, current: RegExp, next: string) {
  await user.click(screen.getByRole('button', { name: current }));
  await user.click(await screen.findByRole('button', { name: next }));
}

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  seedRole('admin');
  seedLlm();
});

describe('LlmConnectionSection', () => {
  it('FE-COMP-LLM-001: an admin defaults to the local provider with a base URL and without a key field', () => {
    renderSection();

    expect(screen.getByText('AI parsing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Local \(Ollama\)/ })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('http://localhost:11434')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('API key')).not.toBeInTheDocument();
  });

  it('FE-COMP-LLM-002: hydrates provider, model, base URL and the multimodal toggle', () => {
    seedLlm({
      llm_provider: 'openai',
      llm_model: 'gpt-4o-mini',
      llm_base_url: 'https://api.openai.com/v1',
      llm_multimodal: true,
    });
    renderSection();

    expect(screen.getByRole('button', { name: /OpenAI/ })).toBeInTheDocument();
    expect(screen.getByDisplayValue('gpt-4o-mini')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://api.openai.com/v1')).toBeInTheDocument();
    expect(multimodalToggle()).toHaveAttribute('aria-pressed', 'true');
  });

  it('FE-COMP-LLM-003: nothing is hydrated and Save stays locked while the settings are loading', () => {
    seedStore(useSettingsStore, {
      settings: buildSettings({ language: 'en', llm_provider: 'anthropic', llm_model: 'claude-sonnet' }),
      isLoaded: false,
    });
    renderSection();

    expect(screen.getByRole('button', { name: /Local \(Ollama\)/ })).toBeInTheDocument();
    expect(screen.queryByDisplayValue('claude-sonnet')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Save$/ })).toBeDisabled();
  });

  it('FE-COMP-LLM-004: a stored key drives the masked placeholder and is never prefilled', () => {
    seedLlm({ llm_provider: 'anthropic', llm_api_key: '***' });
    renderSection();

    expect(screen.getByPlaceholderText('••••••••')).toHaveValue('');
    expect(screen.queryByPlaceholderText('http://localhost:11434')).not.toBeInTheDocument();
  });

  it('FE-COMP-LLM-005: without a stored key the field falls back to the plain label placeholder', () => {
    seedLlm({ llm_provider: 'anthropic' });
    renderSection();

    expect(screen.getByPlaceholderText('API key')).toHaveValue('');
  });

  it('FE-COMP-LLM-006: picking Anthropic hides the base URL and reveals the key field', async () => {
    const user = userEvent.setup();
    renderSection();

    await pickProvider(user, /Local \(Ollama\)/, 'Anthropic');

    expect(screen.queryByPlaceholderText('http://localhost:11434')).not.toBeInTheDocument();
    expect(screen.getByText('Stored encrypted. Leave blank to keep the current key.')).toBeInTheDocument();
  });

  it('FE-COMP-LLM-007: picking OpenAI keeps the base URL and adds the key field', async () => {
    const user = userEvent.setup();
    renderSection();

    await pickProvider(user, /Local \(Ollama\)/, 'OpenAI');

    expect(screen.getByPlaceholderText('http://localhost:11434')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('API key')).toBeInTheDocument();
  });

  it('FE-COMP-LLM-008: saving trims the inputs and omits the key when none was typed', async () => {
    const user = userEvent.setup();
    const updateSettings = seedLlm({ llm_model: '', llm_base_url: '' });
    renderSection();

    await user.type(screen.getByPlaceholderText('qwen3:8b'), '  qwen3:8b  ');
    await user.type(screen.getByPlaceholderText('http://localhost:11434'), ' http://ollama.local ');
    await user.click(screen.getByRole('button', { name: /^Save$/ }));

    expect(updateSettings).toHaveBeenCalledWith({
      llm_provider: 'local',
      llm_model: 'qwen3:8b',
      llm_base_url: 'http://ollama.local',
      llm_multimodal: false,
    });
    await screen.findByText('AI settings saved');
  });

  it('FE-COMP-LLM-009: a typed key is sent, the field is cleared and the mask takes over', async () => {
    const user = userEvent.setup();
    const updateSettings = seedLlm({ llm_provider: 'anthropic', llm_model: 'claude-sonnet' });
    renderSection();

    await user.type(screen.getByPlaceholderText('API key'), ' sk-test ');
    await user.click(screen.getByRole('button', { name: /^Save$/ }));

    expect(updateSettings).toHaveBeenCalledWith(expect.objectContaining({ llm_api_key: 'sk-test' }));
    await waitFor(() => expect(screen.getByPlaceholderText('••••••••')).toHaveValue(''));
  });

  it('FE-COMP-LLM-010: a non-local provider never persists a base URL', async () => {
    const user = userEvent.setup();
    const updateSettings = seedLlm({ llm_provider: 'anthropic', llm_base_url: 'http://leftover' });
    renderSection();

    await user.click(screen.getByRole('button', { name: /^Save$/ }));

    expect(updateSettings).toHaveBeenCalledWith(expect.objectContaining({ llm_base_url: '' }));
  });

  it('FE-COMP-LLM-011: the multimodal toggle is part of the saved payload', async () => {
    const user = userEvent.setup();
    const updateSettings = seedLlm();
    renderSection();

    await user.click(multimodalToggle());
    expect(multimodalToggle()).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: /^Save$/ }));

    expect(updateSettings).toHaveBeenCalledWith(expect.objectContaining({ llm_multimodal: true }));
  });

  it('FE-COMP-LLM-012: a failing save shows the error toast and re-enables the button', async () => {
    const user = userEvent.setup();
    seedLlm({}, vi.fn().mockRejectedValue(new Error('nope')));
    renderSection();

    const saveBtn = screen.getByRole('button', { name: /^Save$/ });
    await user.click(saveBtn);

    await screen.findByText('Could not save AI settings');
    await waitFor(() => expect(saveBtn).toBeEnabled());
  });

  it('FE-COMP-LLM-013: Save is locked while the request is in flight', async () => {
    const user = userEvent.setup();
    let release!: () => void;
    seedLlm({}, vi.fn().mockReturnValue(new Promise<void>(resolve => {
      release = resolve;
    })));
    renderSection();

    const saveBtn = screen.getByRole('button', { name: /^Save$/ });
    await user.click(saveBtn);

    await waitFor(() => expect(saveBtn).toBeDisabled());
    release();
    await waitFor(() => expect(saveBtn).toBeEnabled());
  });

  // #1772: a free-form endpoint may only come from an admin.
  describe('non-admin', () => {
    beforeEach(() => seedRole('user'));

    it('FE-COMP-LLM-014: starts on OpenAI, offers no local option and no base URL field', async () => {
      const user = userEvent.setup();
      renderSection();

      expect(screen.getByRole('button', { name: /OpenAI/ })).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('http://localhost:11434')).not.toBeInTheDocument();
      expect(
        screen.getByText('A self-hosted (Ollama) endpoint can only be set up by an administrator. You can still use your own OpenAI or Anthropic key.'),
      ).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /OpenAI/ }));
      expect(await screen.findByRole('button', { name: 'Anthropic' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Local \(Ollama\)/ })).not.toBeInTheDocument();
    });

    it('FE-COMP-LLM-015: a stored local provider falls back to OpenAI without saving anything', () => {
      const updateSettings = seedLlm({ llm_provider: 'local', llm_model: 'nuextract', llm_base_url: 'http://192.168.1.5:11434' });
      renderSection();

      expect(screen.getByRole('button', { name: /OpenAI/ })).toBeInTheDocument();
      expect(screen.queryByDisplayValue('http://192.168.1.5:11434')).not.toBeInTheDocument();
      expect(updateSettings).not.toHaveBeenCalled();
    });

    it('FE-COMP-LLM-016: saving clears the leftover base URL instead of resending it', async () => {
      const user = userEvent.setup();
      const updateSettings = seedLlm({ llm_provider: 'local', llm_model: 'nuextract', llm_base_url: 'http://192.168.1.5:11434' });
      renderSection();

      await user.click(screen.getByRole('button', { name: /^Save$/ }));

      expect(updateSettings).toHaveBeenCalledWith({
        llm_provider: 'openai',
        llm_model: 'nuextract',
        llm_base_url: '',
        llm_multimodal: false,
      });
    });

    it('FE-COMP-LLM-017: a refused save pulls the stored settings back in', async () => {
      const user = userEvent.setup();
      seedLlm({ llm_provider: 'anthropic' }, vi.fn().mockRejectedValue(new Error('Admin access required')));
      renderSection();

      await user.click(screen.getByRole('button', { name: /^Save$/ }));

      await screen.findByText('Could not save AI settings');
      expect(loadSettings).toHaveBeenCalled();
    });
  });
});
