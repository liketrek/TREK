// FE-MOB-SETLLM-001 onwards
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '../../../helpers/render';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildSettings } from '../../../helpers/factories';
import { useSettingsStore } from '../../../../src/store/settingsStore';
import { ToastContainer } from '../../../../src/components/shared/Toast';
import type { Settings } from '../../../../src/types';
import MLlmConnectionSection from '../../../../src/mobile/screens/settings/MLlmConnectionSection';

function seedLlm(over: Partial<Settings> = {}, updateSettings = vi.fn().mockResolvedValue(undefined)) {
  seedStore(useSettingsStore, {
    settings: buildSettings({ language: 'en', ...over }),
    isLoaded: true,
    updateSettings,
  });
  return updateSettings;
}

function renderSection() {
  return render(
    <>
      <ToastContainer />
      <MLlmConnectionSection />
    </>,
  );
}

describe('MLlmConnectionSection', () => {
  beforeEach(() => {
    resetAllStores();
    seedLlm();
  });

  it('FE-MOB-SETLLM-001: defaults to the local provider with a base URL and no key field', () => {
    renderSection();

    expect(screen.getByText('AI parsing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Local \(Ollama\)/ })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('http://localhost:11434')).toBeInTheDocument();
    expect(screen.queryByText('Stored encrypted. Leave blank to keep the current key.')).not.toBeInTheDocument();
  });

  it('FE-MOB-SETLLM-002: hydrates provider, model, base URL and the multimodal switch', () => {
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
    expect(screen.getByRole('switch', { name: 'Send documents as images' })).toHaveAttribute('aria-checked', 'true');
  });

  it('FE-MOB-SETLLM-003: nothing is hydrated while the settings are still loading', () => {
    seedStore(useSettingsStore, {
      settings: buildSettings({ language: 'en', llm_provider: 'anthropic', llm_model: 'claude' }),
      isLoaded: false,
    });
    renderSection();

    expect(screen.getByRole('button', { name: /Local \(Ollama\)/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled();
  });

  it('FE-MOB-SETLLM-004: a stored key drives the masked placeholder and is never prefilled', () => {
    seedLlm({ llm_provider: 'anthropic', llm_api_key: '***' });
    renderSection();

    expect(screen.getByPlaceholderText('••••••••')).toHaveValue('');
  });

  it('FE-MOB-SETLLM-005: without a stored key the field falls back to the plain label placeholder', () => {
    seedLlm({ llm_provider: 'anthropic' });
    renderSection();

    expect(screen.getByPlaceholderText('API key')).toHaveValue('');
  });

  it('FE-MOB-SETLLM-006: picking Anthropic hides the base URL and reveals the key field', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: /Local \(Ollama\)/ }));
    await user.click(await screen.findByRole('button', { name: 'Anthropic' }));

    expect(screen.queryByPlaceholderText('http://localhost:11434')).not.toBeInTheDocument();
    expect(screen.getByText('Stored encrypted. Leave blank to keep the current key.')).toBeInTheDocument();
  });

  it('FE-MOB-SETLLM-007: picking OpenAI keeps the base URL and adds the key field', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: /Local \(Ollama\)/ }));
    await user.click(await screen.findByRole('button', { name: 'OpenAI' }));

    expect(screen.getByPlaceholderText('http://localhost:11434')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('API key')).toBeInTheDocument();
  });

  it('FE-MOB-SETLLM-008: saving trims the inputs and omits the key when none was typed', async () => {
    const user = userEvent.setup();
    const updateSettings = seedLlm({ llm_model: '', llm_base_url: '' });
    renderSection();

    await user.type(screen.getByPlaceholderText('qwen3:8b'), '  qwen3:8b  ');
    await user.type(screen.getByPlaceholderText('http://localhost:11434'), ' http://ollama.local ');
    await user.click(screen.getByRole('button', { name: /Save/ }));

    expect(updateSettings).toHaveBeenCalledWith({
      llm_provider: 'local',
      llm_model: 'qwen3:8b',
      llm_base_url: 'http://ollama.local',
      llm_multimodal: false,
    });
    await screen.findByText('AI settings saved');
  });

  it('FE-MOB-SETLLM-009: a typed key is sent, the field is cleared and the mask takes over', async () => {
    const user = userEvent.setup();
    const updateSettings = seedLlm({ llm_provider: 'anthropic', llm_model: 'claude-sonnet' });
    renderSection();

    await user.type(screen.getByPlaceholderText('API key'), ' sk-test ');
    await user.click(screen.getByRole('button', { name: /Save/ }));

    expect(updateSettings).toHaveBeenCalledWith(expect.objectContaining({ llm_api_key: 'sk-test' }));
    await waitFor(() => expect(screen.getByPlaceholderText('••••••••')).toHaveValue(''));
  });

  it('FE-MOB-SETLLM-010: a non-local provider never persists a base URL', async () => {
    const user = userEvent.setup();
    const updateSettings = seedLlm({ llm_provider: 'anthropic', llm_base_url: 'http://leftover' });
    renderSection();

    await user.click(screen.getByRole('button', { name: /Save/ }));
    expect(updateSettings).toHaveBeenCalledWith(expect.objectContaining({ llm_base_url: '' }));
  });

  it('FE-MOB-SETLLM-011: the multimodal switch is part of the saved payload', async () => {
    const user = userEvent.setup();
    const updateSettings = seedLlm();
    renderSection();

    await user.click(screen.getByRole('switch', { name: 'Send documents as images' }));
    await user.click(screen.getByRole('button', { name: /Save/ }));

    expect(updateSettings).toHaveBeenCalledWith(expect.objectContaining({ llm_multimodal: true }));
  });

  it('FE-MOB-SETLLM-012: a failing save shows the error toast', async () => {
    const user = userEvent.setup();
    seedLlm({}, vi.fn().mockRejectedValue(new Error('nope')));
    renderSection();

    await user.click(screen.getByRole('button', { name: /Save/ }));
    await screen.findByText('Could not save AI settings');
  });
});
