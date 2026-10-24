import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSnow, Sun, Wind, type LucideIcon } from 'lucide-react';

/** The icon for each weather condition the forecast names. */
export const WEATHER_ICON_MAP: Record<string, LucideIcon> = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: CloudDrizzle,
  Thunderstorm: CloudLightning,
  Snow: CloudSnow,
  Mist: Wind,
  Fog: Wind,
  Haze: Wind,
};

/** The icon for a forecast's condition; an unknown or missing one shows a cloud. */
export function weatherIconFor(main: string | undefined): LucideIcon {
  return (main && WEATHER_ICON_MAP[main]) || Cloud;
}
