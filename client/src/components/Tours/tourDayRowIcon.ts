import { Bike, Footprints, Mountain, Route, Sailboat, type LucideIcon } from 'lucide-react';

export function tourDayRowIcon(type: string): LucideIcon {
  switch (type) {
    case 'hike':
      return Mountain;
    case 'bike':
      return Bike;
    case 'walk':
      return Footprints;
    case 'kayak':
      return Sailboat;
    default:
      return Route;
  }
}
