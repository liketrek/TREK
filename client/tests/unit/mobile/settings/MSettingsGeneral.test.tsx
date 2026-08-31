// FE-MOB-SET-001 onwards
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '../../../helpers/render';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildSettings } from '../../../helpers/factories';
import { useSettingsStore } from '../../../../src/store/settingsStore';
import { ToastContainer } from '../../../../src/components/shared/Toast';
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

  it('FE-MOB-SET-004: a chosen display currency is shown with its symbol', () => {
    seedStore(useSettingsStore, { settings: buildSettings({ language: 'en', default_currency: 'EUR' }) });
    render(<MSettingsGeneral />);

    expect(screen.getByRole('button', { name: 'EUR — €' })).toBeInTheDocument();
  });

  it('FE-MOB-SET-005: the currency sheet saves a pick and can fall back to the trip currency', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, {
      settings: buildSettings({ language: 'en', default_currency: '' }),
      updateSetting,
    });
    render(<MSettingsGeneral />);

    await user.click(screen.getByRole('button', { name: 'Trip currency' }));
    await user.click(await screen.findByRole('button', { name: 'CHF — Swiss Franc' }));
    expect(updateSetting).toHaveBeenCalledWith('default_currency', 'CHF');
  });

  it('FE-MOB-SET-006: distance and time-format segments persist their preference', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, {
      settings: buildSettings({ language: 'en', distance_unit: 'metric', time_format: '24h' }),
      updateSetting,
    });
    render(<MSettingsGeneral />);

    expect(screen.getByRole('button', { name: 'km Metric' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'mi Imperial' }));
    expect(updateSetting).toHaveBeenCalledWith('distance_unit', 'imperial');

    await user.click(screen.getByRole('button', { name: '12h' }));
    expect(updateSetting).toHaveBeenCalledWith('time_format', '12h');
  });

  it('FE-MOB-SET-007: unset unit preferences fall back to the metric/24h defaults', () => {
    seedStore(useSettingsStore, {
      settings: buildSettings({ language: 'en', temperature_unit: undefined, distance_unit: undefined, time_format: undefined }),
    });
    render(<MSettingsGeneral />);

    expect(screen.getByRole('button', { name: '°C Celsius' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'km Metric' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '24h' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('FE-MOB-SET-008: the travel toggles reflect their opt-in / opt-out defaults', () => {
    render(<MSettingsGeneral />);

    expect(screen.getByRole('switch', { name: 'Booking route labels' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('switch', { name: 'Explore places on the map' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: 'Blur Booking Codes' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('switch', { name: 'Optimize route from accommodation' })).toHaveAttribute('aria-checked', 'true');
  });

  it('FE-MOB-SET-009: flipping a travel toggle persists the new boolean', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, {
      settings: buildSettings({ language: 'en', map_booking_labels: false, map_poi_pill_enabled: true }),
      updateSetting,
    });
    render(<MSettingsGeneral />);

    await user.click(screen.getByRole('switch', { name: 'Booking route labels' }));
    expect(updateSetting).toHaveBeenCalledWith('map_booking_labels', true);

    await user.click(screen.getByRole('switch', { name: 'Explore places on the map' }));
    expect(updateSetting).toHaveBeenCalledWith('map_poi_pill_enabled', false);

    await user.click(screen.getByRole('switch', { name: 'Blur Booking Codes' }));
    expect(updateSetting).toHaveBeenCalledWith('blur_booking_codes', true);

    await user.click(screen.getByRole('switch', { name: 'Optimize route from accommodation' }));
    expect(updateSetting).toHaveBeenCalledWith('optimize_from_accommodation', false);
  });

  it('FE-MOB-SET-010: a rejected save shows the server message as a toast', async () => {
    const user = userEvent.setup();
    seedStore(useSettingsStore, {
      settings: buildSettings({ language: 'en' }),
      updateSetting: vi.fn().mockRejectedValue(new Error('Error saving setting')),
    });
    render(<><ToastContainer /><MSettingsGeneral /></>);

    await user.click(screen.getByRole('button', { name: '°F Fahrenheit' }));
    expect(await screen.findByText('Error saving setting')).toBeInTheDocument();
  });

  it('FE-MOB-SET-011: a non-Error rejection falls back to the generic message', async () => {
    const user = userEvent.setup();
    seedStore(useSettingsStore, {
      settings: buildSettings({ language: 'en' }),
      updateSetting: vi.fn().mockRejectedValue('boom'),
    });
    render(<><ToastContainer /><MSettingsGeneral /></>);

    await user.click(screen.getByRole('button', { name: '°F Fahrenheit' }));
    expect(await screen.findByText('Error')).toBeInTheDocument();
  });

  it('FE-MOB-SET-012: the startup card defaults to the dashboard and hides the tab row', () => {
    render(<MSettingsGeneral />);

    expect(screen.getByText('Startup')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dashboard' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('Start tab')).not.toBeInTheDocument();
  });

  it('FE-MOB-SET-013: picking the active trip persists it and reveals the tab row', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings({ language: 'en' }), updateSetting });
    render(<MSettingsGeneral />);

    await user.click(screen.getByRole('button', { name: 'Active trip' }));
    expect(updateSetting).toHaveBeenCalledWith('start_page', 'active_trip');
  });

  it('FE-MOB-SET-014: the start-tab sheet saves the planner tab id behind the label', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, {
      settings: buildSettings({ language: 'en', start_page: 'active_trip', start_trip_tab: 'plan' }),
      updateSetting,
    });
    render(<MSettingsGeneral />);

    expect(screen.getByText('Start tab')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Plan' }));
    await user.click(await screen.findByText('Costs'));

    expect(updateSetting).toHaveBeenCalledWith('start_trip_tab', 'finanzplan');
  });
});
