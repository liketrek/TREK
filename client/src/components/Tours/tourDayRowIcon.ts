import { Bike, Footprints, Mountain, Route, Waves, type LucideIcon } from 'lucide-react';

export function tourDayRowIcon(type: string): LucideIcon {
  switch (type) {
    case 'hike':
      return Mountain;
    case 'bike':
      return Bike;
    case 'walk':
      return Footprints;
    case 'kayak':
      return Waves;
    default:
      return Route;
  }
}
