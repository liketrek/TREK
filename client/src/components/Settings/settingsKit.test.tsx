// FE-SETTINGS-KIT-001 to FE-SETTINGS-KIT-004
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SettingsCard, StatusPill, settingsCardOpenKey } from './settingsKit';

function card(props: { collapsible?: boolean; id?: string } = {}) {
  return (
    <SettingsCard
      title="AirTrail"
      badge={<StatusPill>Connected</StatusPill>}
      action={<button type="button">Sync</button>}
      {...props}
    >
      <label>
        Address
        <input />
      </label>
    </SettingsCard>
  );
}

afterEach(() => {
  window.location.hash = '';
});

describe('SettingsCard', () => {
  it('FE-SETTINGS-KIT-001: a collapsible card starts shut, its state still showing in the head', () => {
    render(card({ collapsible: true, id: 'airtrail' }));
    const head = screen.getByRole('button', { name: 'AirTrail' });
    expect(head).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Connected')).toBeVisible();
    expect(screen.queryByRole('textbox', { name: 'Address' })).toBeNull();
    // The head's own action stays a button of its own.
    expect(screen.getByRole('button', { name: 'Sync' })).toBeVisible();
  });

  it('FE-SETTINGS-KIT-002: the head opens and shuts it, and the browser remembers it open', () => {
    const { unmount } = render(card({ collapsible: true, id: 'airtrail' }));
    fireEvent.click(screen.getByRole('button', { name: 'AirTrail' }));
    expect(screen.getByRole('button', { name: 'AirTrail' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('textbox', { name: 'Address' })).toBeVisible();
    expect(localStorage.getItem(settingsCardOpenKey('airtrail'))).toBe('1');

    unmount();
    render(card({ collapsible: true, id: 'airtrail' }));
    expect(screen.getByRole('textbox', { name: 'Address' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'AirTrail' }));
    expect(screen.queryByRole('textbox', { name: 'Address' })).toBeNull();
    expect(localStorage.getItem(settingsCardOpenKey('airtrail'))).toBe('0');
  });

  it('FE-SETTINGS-KIT-003: a link to the card opens it', () => {
    window.location.hash = '#airtrail';
    render(card({ collapsible: true, id: 'airtrail' }));
    expect(screen.getByRole('textbox', { name: 'Address' })).toBeVisible();
  });

  it('FE-SETTINGS-KIT-004: a card that is not collapsible has no toggle and shows its body', () => {
    render(card());
    expect(screen.queryByRole('button', { name: 'AirTrail' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'AirTrail' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Address' })).toBeVisible();
  });
});
