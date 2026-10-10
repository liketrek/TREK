/**
 * The journey weather icon id for a weather service answer: its main condition, with
 * the description telling a partly cloudy sky from a cloudy one. 'cold' is the stored
 * id for snow.
 */
export function journeyWeatherCategory(main: string, description: string): string {
  const normalizedMain = main.toLowerCase();
  const normalizedDescription = description.toLowerCase();
  if (normalizedMain === 'clear') return 'sunny';
  if (normalizedMain === 'thunderstorm') return 'stormy';
  if (normalizedMain === 'snow') return 'cold';
  if (normalizedMain === 'rain' || normalizedMain === 'drizzle') return 'rainy';
  if (normalizedDescription.includes('partly') || normalizedDescription.includes('teilweise')) return 'partly';
  return 'cloudy';
}
