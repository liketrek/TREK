import { Activity, Bike, Footprints, Mountain, MountainSnow, Route, Waves, type LucideIcon } from 'lucide-react';
import { Horseshoe } from './horse/HorseshoeIcon';

export function tourDayRowIcon(type: string): LucideIcon {
  switch (type) {
    case 'hike':
      return Mountain;
    case 'bike':
      return Bike;
    case 'walk':
      return Footprints;
    case 'run':
      return Activity;
    case 'kayak':
      return Waves;
    case 'ski':
      return MountainSnow;
    case 'horse':
      return Horseshoe;
    default:
      return Route;
  }
}
