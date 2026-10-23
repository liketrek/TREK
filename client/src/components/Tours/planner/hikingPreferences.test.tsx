import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HikingPreferencesField } from './HikingPreferencesField';

describe('HikingPreferencesField (MF-08, RTE-01)', () => {
  it('shows the three preferences in order with what each does, and switching one keeps the others', () => {
    const setHikingPreferences = vi.fn();
    render(
      <HikingPreferencesField
        planner={{ hikingPreferences: { avoid_climbs: true }, setHikingPreferences }}
        locked={false}
      />
    );
    const names = ['avoid_climbs', 'avoid_steps', 'avoid_ferries'].map((key) => `tours.preferences.${key}`);
    const switches = screen.getAllByRole('button').filter((button) => button.hasAttribute('aria-pressed'));
    expect(switches.map((button) => button.getAttribute('aria-label'))).toEqual(names);
    const steps = screen.getByRole('button', { name: 'tours.preferences.avoid_steps' });
    expect(steps).toHaveAttribute('aria-pressed', 'false');
    expect(steps).toHaveAccessibleDescription('tours.preferences.avoid_stepsHint');
    const climbs = screen.getByRole('button', { name: 'tours.preferences.avoid_climbs' });
    expect(climbs).toHaveAttribute('aria-pressed', 'true');
    expect(climbs).toHaveAccessibleDescription('tours.preferences.avoid_climbsHint');
    fireEvent.click(steps);
    expect(setHikingPreferences).toHaveBeenCalledWith({ avoid_climbs: true, avoid_steps: true });
    fireEvent.click(climbs);
    expect(setHikingPreferences).toHaveBeenLastCalledWith({ avoid_climbs: false });
  });

  it('changes nothing while the tour is locked', () => {
    const setHikingPreferences = vi.fn();
    render(<HikingPreferencesField planner={{ hikingPreferences: null, setHikingPreferences }} locked />);
    fireEvent.click(screen.getByRole('button', { name: 'tours.preferences.avoid_climbs' }));
    expect(setHikingPreferences).not.toHaveBeenCalled();
  });
});
