import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { translator } from '../../src/lib/i18n';
import type { TrekAppState } from '../../src/lib/useTrekApp';
import { App } from '../../src/widgets/weather/App';
import { formatClock, Weather } from '../../src/widgets/weather/Weather';

const t = translator('en');
const forecast = {
  weather: {
    temp: 21.4,
    temp_min: 15,
    temp_max: 24.6,
    main: 'Clouds',
    description: 'broken clouds',
    type: 'forecast',
    sunrise: '06:42',
    sunset: '2027-05-12T20:58',
    precipitation_probability_max: 30,
    wind_max: 18.2,
  },
};

let state: TrekAppState;
vi.mock('../../src/lib/useTrekApp', () => ({ useTrekApp: () => state }));

afterEach(cleanup);

describe('Weather', () => {
  it('APPS-WEATHER-001: draws the day’s forecast with the facts it has', () => {
    render(<Weather data={forecast} input={{ date: '2027-05-12' }} locale="en-GB" t={t} />);
    expect(screen.getByRole('heading').textContent).toBe('Weather · 12 May 2027');
    expect(screen.getByText('21°')).toBeTruthy();
    expect(screen.getByText('15° – 25°')).toBeTruthy();
    expect(screen.getByText('broken clouds')).toBeTruthy();
    expect(screen.getByText('30%')).toBeTruthy();
    expect(screen.getByText('18 km/h')).toBeTruthy();
    expect(screen.getByText('06:42')).toBeTruthy();
    expect(screen.getByText('20:58')).toBeTruthy();
  });

  it('APPS-WEATHER-002: marks a climate average and leaves out what is missing', () => {
    render(
      <Weather
        data={{ weather: { temp: 10, main: 'Clear', description: '', type: 'climate' } }}
        input={null}
        locale="en-GB"
        t={t}
      />
    );
    expect(screen.getByText('Climate average')).toBeTruthy();
    expect(screen.getByText('Clear')).toBeTruthy();
    expect(screen.queryByText('Wind')).toBeNull();
  });

  it('APPS-WEATHER-003: says so when there is no forecast, or the result is not one', () => {
    render(<Weather data={{ weather: { ...forecast.weather, error: 'none' } }} input={null} locale="en-GB" t={t} />);
    expect(screen.getByText('No forecast for this day')).toBeTruthy();
    cleanup();
    render(<Weather data={null} input={null} locale="en-GB" t={t} />);
    expect(screen.getByText('Something went wrong. Try again.')).toBeTruthy();
  });

  it('APPS-WEATHER-004: reads a clock time from either spelling, or nothing', () => {
    expect(formatClock('07:05', 'en-GB')).toBe('07:05');
    expect(formatClock(null, 'en-GB')).toBeNull();
    expect(formatClock('soon', 'en-GB')).toBeNull();
  });

  it('APPS-WEATHER-005: the App hands the tool input to the card', () => {
    state = {
      app: null,
      result: { structuredContent: forecast, appUrl: null },
      input: { date: '2027-05-12' },
      error: null,
      locale: 'en-GB',
      t,
    };
    render(<App />);
    expect(screen.getByRole('heading').textContent).toBe('Weather · 12 May 2027');
  });
});
