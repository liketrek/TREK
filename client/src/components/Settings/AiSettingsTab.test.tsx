import { render, screen } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { useSettingsStore } from '../../store/settingsStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildSettings } from '../../../tests/helpers/factories';
import { ToastContainer } from '../shared/Toast';
import AiSettingsTab from './AiSettingsTab';

const MASKED = '••••••••';

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  seedStore(useSettingsStore, {
    settings: buildSettings({ llm_provider: 'openai', llm_model: '', llm_api_key: '' }),
    updateSettings: vi.fn().mockResolvedValue(undefined),
  });
});

describe('AiSettingsTab', () => {
  it('renders the AI parsing form when not managed', () => {
    render(<AiSettingsTab managed={false} />);
    expect(screen.getByText('AI parsing')).toBeInTheDocument();
    expect(screen.getByText('Provider')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('API key')).toBeInTheDocument();
  });

  it('shows the managed note instead of the form when managed', () => {
    render(<AiSettingsTab managed />);
    expect(screen.getByText(/configured by your administrator/i)).toBeInTheDocument();
    expect(screen.queryByText('Provider')).not.toBeInTheDocument();
  });

  it('disables Save until a model is entered', async () => {
    const user = userEvent.setup();
    render(<AiSettingsTab managed={false} />);
    const saveBtn = screen.getByText('Save').closest('button')!;
    expect(saveBtn).toBeDisabled();
    await user.type(screen.getByPlaceholderText('gpt-4o'), 'gpt-4o');
    expect(saveBtn).not.toBeDisabled();
  });

  it('saves provider, model and key via updateSettings', async () => {
    const user = userEvent.setup();
    const updateSettings = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, {
      settings: buildSettings({ llm_provider: 'openai', llm_model: '', llm_api_key: '' }),
      updateSettings,
    });
    render(<AiSettingsTab managed={false} />);
    await user.type(screen.getByPlaceholderText('gpt-4o'), 'gpt-4o');
    await user.type(screen.getByPlaceholderText('sk-…'), 'sk-test');
    await user.click(screen.getByText('Save'));
    expect(updateSettings).toHaveBeenCalledWith({
      llm_provider: 'openai',
      llm_model: 'gpt-4o',
      llm_api_key: 'sk-test',
    });
  });

  it('keeps the masked sentinel when the key is left unchanged', async () => {
    const user = userEvent.setup();
    const updateSettings = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, {
      settings: buildSettings({ llm_provider: 'anthropic', llm_model: 'claude', llm_api_key: MASKED }),
      updateSettings,
    });
    render(<AiSettingsTab managed={false} />);
    await user.click(screen.getByText('Save'));
    expect(updateSettings).toHaveBeenCalledWith({
      llm_provider: 'anthropic',
      llm_model: 'claude',
      llm_api_key: MASKED,
    });
  });

  it('surfaces a save error as a toast', async () => {
    const user = userEvent.setup();
    seedStore(useSettingsStore, {
      settings: buildSettings({ llm_provider: 'openai', llm_model: 'gpt-4o', llm_api_key: '' }),
      updateSettings: vi.fn().mockRejectedValue(new Error('Save failed')),
    });
    render(<><ToastContainer /><AiSettingsTab managed={false} /></>);
    await user.click(screen.getByText('Save'));
    await screen.findByText('Save failed');
  });
});
