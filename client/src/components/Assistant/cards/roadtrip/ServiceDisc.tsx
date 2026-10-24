import { MapPin } from 'lucide-react';

import { serviceColor } from '../../../Roadtrip/roadtripModel';
import { CORRIDOR_CATEGORY_BY_KEY } from '../../../Roadtrip/stopKinds';

/**
 * A kind of stop on the way (a charger, a pump, a rest area) as the road
 * trip draws it in its corridor list and on the map: its icon on its own
 * tint, in the road signage colours the rail and the pins share.
 */
export default function ServiceDisc({ category }: { category: string }) {
  const Icon = CORRIDOR_CATEGORY_BY_KEY[category]?.Icon ?? MapPin;
  const color = serviceColor(category);
  return (
    <span
      className="grid h-6 w-6 flex-none place-items-center rounded-full"
      style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
    >
      <Icon size={12} strokeWidth={2} aria-hidden="true" />
    </span>
  );
}
