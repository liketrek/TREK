/**
 * FE-AI-WEATHER-001 to FE-AI-WEATHER-005
 *
 * The weather row of an answer: temperatures in the user's unit, a drop only
 * where rain is likely, the day in focus framed, and a trip day that selects
 * itself in the planner.
 */
import type { AssistantWeatherDay } from '@trek/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useSettingsStore } from '../../store/settingsStore';
import AssistantWeatherStrip from './AssistantWeatherStrip';
import { inUnit } from './assistantModel';
import { type AssistantView, AssistantViewContext } from './assistantViewContext';

const TRIP = 4;
const ASSISTANT = useAssistantStore.getState();
const SETTINGS = useSettingsStore.getState();

function day(date: string, extra: Partial<AssistantWeatherDay> = {}): AssistantWeatherDay {
  return { dayId: null, date, main: 'Clear', tempMax: 21, tempMin: 12, rainPct: null, kind: 'forecast', ...extra };
}

function renderStrip(days: AssistantWeatherDay[], view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: TRIP, variant: 'window', ...view };
  return render(
    <AssistantViewContext.Provider value={value}>
      <AssistantWeatherStrip days={days} />
    </AssistantViewContext.Provider>
  );
}

afterEach(() => {
  useAssistantStore.setState(ASSISTANT, true);
  useSettingsStore.setState(SETTINGS, true);
});

describe('AssistantWeatherStrip', () => {
  it('FE-AI-WEATHER-001: shows °C in the user unit, without a negative zero', () => {
    expect(inUnit(21, false)).toBe(21);
    expect(inUnit(21, true)).toBe(70);
    expect(inUnit(-0.4, false)).toBe(0);

    useSettingsStore.setState({ settings: { ...SETTINGS.settings, temperature_unit: 'fahrenheit' } });
    renderStrip([day('2026-11-02')]);
    expect(screen.getByText('70°')).toBeInTheDocument();
    expect(screen.getByText('54°')).toBeInTheDocument();
  });

  it('FE-AI-WEATHER-002: a drop shows from 30 % rain on, and a climate figure reads as approximate', () => {
    renderStrip([
      day('2026-11-02', { rainPct: 29 }),
      day('2026-11-03', { rainPct: 60 }),
      day('2026-11-04', { kind: 'climate', tempMax: 18 }),
    ]);
    expect(screen.queryByText('29%')).toBeNull();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('≈18°')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Weather for 3 days' })).toBeInTheDocument();
  });

  it('FE-AI-WEATHER-003: a trip day selects itself in the planner, and the day in focus is marked', () => {
    const onFocusDay = vi.fn();
    useAssistantStore.setState({
      byTrip: { [TRIP]: { ...chatOf(useAssistantStore.getState(), TRIP), focus: { dayId: 31 } } },
    });
    renderStrip([day('2026-11-02', { dayId: 31 }), day('2026-11-03', { dayId: 32 })], { onFocusDay });
    const [first, second] = screen.getAllByRole('button');
    expect(first).toHaveAttribute('aria-current', 'true');
    expect(second).not.toHaveAttribute('aria-current');
    if (second) fireEvent.click(second);
    expect(onFocusDay).toHaveBeenCalledWith(32);
  });

  it('FE-AI-WEATHER-004: without a planner or a trip day a chip is only text', () => {
    renderStrip([day('2026-11-02', { dayId: 31 })]);
    expect(screen.queryByRole('button')).toBeNull();
    renderStrip([day('2026-11-03')], { onFocusDay: vi.fn() });
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('FE-AI-WEATHER-005: a chip grows with three-digit or approximate figures instead of spilling over', () => {
    useSettingsStore.setState({ settings: { ...SETTINGS.settings, temperature_unit: 'fahrenheit' } });
    renderStrip([day('2026-07-02', { kind: 'climate', tempMax: 39, tempMin: 29 })]);
    expect(screen.getByText('≈102°')).toBeInTheDocument();
    const chip = screen.getByRole('listitem');
    expect(chip.className).toContain('min-w-14');
    expect(chip.className.split(' ')).not.toContain('w-14');
  });
});
