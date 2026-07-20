import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '../../../helpers/render';
import MUserMenu from '../../../../src/mobile/screens/dashboard/MUserMenu';
import { useAuthStore } from '../../../../src/store/authStore';
import { useSettingsStore } from '../../../../src/store/settingsStore';

// FE-MOB-MENU-001 onwards

function seedUser(role: 'user' | 'admin') {
  useAuthStore.setState({
    isAuthenticated: true,
    user: { id: 1, username: 'Maurice', email: 'maurice@trek.app', role, avatar_url: '' } as never,
  });
}

describe('MUserMenu', () => {
  beforeEach(() => {
    seedUser('user');
    useSettingsStore.setState(s => ({ settings: { ...s.settings, dark_mode: 'dark' } }));
  });

  it('FE-MOB-MENU-001: shows profile header and hides the admin entry for regular users', () => {
    render(<MUserMenu open onClose={() => {}} />);

    expect(screen.getByText('Maurice')).toBeInTheDocument();
    expect(screen.getByText('maurice@trek.app')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Admin Settings' })).not.toBeInTheDocument();
  });

  it('FE-MOB-MENU-002: shows the admin entry and badge for admins', () => {
    seedUser('admin');
    render(<MUserMenu open onClose={() => {}} />);

    expect(screen.getByRole('button', { name: 'Admin Settings' })).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('FE-MOB-MENU-003: the theme row cycles dark → light → auto', () => {
    const updateSetting = vi.fn(async () => {});
    useSettingsStore.setState({ updateSetting });

    render(<MUserMenu open onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Color Mode/ }));
    expect(updateSetting).toHaveBeenCalledWith('dark_mode', 'light');

    act(() => {
      useSettingsStore.setState(s => ({ settings: { ...s.settings, dark_mode: 'light' } }));
    });
    fireEvent.click(screen.getByRole('button', { name: /Color Mode/ }));
    expect(updateSetting).toHaveBeenCalledWith('dark_mode', 'auto');
  });
});
