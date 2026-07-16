// FE-MOB-SET-001 onwards
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '../../../helpers/render';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildSettings } from '../../../helpers/factories';
import { useSettingsStore } from '../../../../src/store/settingsStore';
import MSettingsGeneral from '../../../../src/mobile/screens/settings/MSettingsGeneral';

describe('MSettingsGeneral', () => {
  beforeEach(() => {
    resetAllStores();
    seedStore(useSettingsStore, {
      settings: buildSettings({ language: 'en', temperature_unit: 'fahrenheit', default_currency: '' }),
    });
  });

  it('FE-MOB-SET-001: renders the Language & region and Travel & map cards with the current values', () => {
    render(<MSettingsGeneral />);

    expect(screen.getByText('Language & region')).toBeInTheDocument();
    expect(screen.getByText('Travel & map')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Trip currency')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°F Fahrenheit' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('FE-MOB-SET-002: unit segments persist the preference via updateSetting', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, {
      settings: buildSettings({ language: 'en', temperature_unit: 'fahrenheit' }),
      updateSetting,
    });
    render(<MSettingsGeneral />);

    await user.click(screen.getByRole('button', { name: '°C Celsius' }));
    expect(updateSetting).toHaveBeenCalledWith('temperature_unit', 'celsius');
  });

  it('FE-MOB-SET-003: the language picker sheet lists the real locales and saves the choice', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, {
      settings: buildSettings({ language: 'en' }),
      updateSetting,
    });
    render(<MSettingsGeneral />);

    await user.click(screen.getByRole('button', { name: /English/ }));
    await user.click(await screen.findByRole('button', { name: 'Deutsch' }));
    expect(updateSetting).toHaveBeenCalledWith('language', 'de');
  });
});
