import { describe, expect, it } from 'vitest';
import { journeyWeatherCategory } from '../../../../src/mobile/screens/journey/mobileJourneyMeta';

describe('journeyWeatherCategory', () => {
  it.each([
    ['Clear', 'Clear sky', 'sunny'],
    ['Clouds', 'Partly cloudy', 'partly'],
    ['Clouds', 'Teilweise bewolkt', 'partly'],
    ['Clouds', 'Overcast', 'cloudy'],
    ['Rain', 'Rain', 'rainy'],
    ['Thunderstorm', 'Thunderstorm', 'stormy'],
    ['Snow', 'Snowfall', 'cold'],
  ])('maps %s / %s to the existing %s category', (main, description, expected) => {
    expect(journeyWeatherCategory(main, description)).toBe(expected);
  });
});
