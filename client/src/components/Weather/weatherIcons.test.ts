// FE-WEATHER-ICONS-001 to -002: the one condition-to-icon map behind the day plan's
// weather badge, the desktop day panel and the phone's timeline and day sheet.
// FE-WEATHER-ICONS-001 is the case FE-MOB-PTLM-041 held while the map lived in the
// phone's timeline model.
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSnow, Sun, Wind } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { WEATHER_ICON_MAP, weatherIconFor } from './weatherIcons';

describe('weatherIcons', () => {
  it('FE-WEATHER-ICONS-001: maps the known conditions and defaults to a cloud', () => {
    expect(weatherIconFor('Clear')).toBe(Sun);
    expect(weatherIconFor('Rain')).toBe(CloudRain);
    expect(weatherIconFor('Thunderstorm')).toBe(CloudLightning);
    expect(weatherIconFor('Snow')).toBe(CloudSnow);
    expect(weatherIconFor('Haze')).toBe(Wind);
    expect(weatherIconFor('Tornado')).toBe(Cloud);
    expect(weatherIconFor(undefined)).toBe(Cloud);
    expect(weatherIconFor('')).toBe(Cloud);
  });

  it('FE-WEATHER-ICONS-002: covers every condition the forecast names', () => {
    expect(WEATHER_ICON_MAP).toEqual({
      Clear: Sun,
      Clouds: Cloud,
      Rain: CloudRain,
      Drizzle: CloudDrizzle,
      Thunderstorm: CloudLightning,
      Snow: CloudSnow,
      Mist: Wind,
      Fog: Wind,
      Haze: Wind,
    });
  });
});
