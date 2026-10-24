import type { BookBadgeElement, BookBadgeVariant } from '@trek/shared';
import { CalendarDays, Compass, Flag, MapPin, Mountain, Route, type LucideIcon } from 'lucide-react';
import { MOOD_CONFIG, WEATHER_CONFIG } from '../../../pages/journeyDetail/JourneyDetailPage.constants';
import { COUNTRY_SHAPES } from '../countryShapes';
import { FlagMark } from './FlagMark';
import { mm } from './travelInk';

/**
 * The picture of a mark: a flag, a country's outline, or the journal's own
 * mood and weather icons. Drawn the same in every style a mark can take, so a
 * flag set as a stamp is the flag set as a chip.
 */

/**
 * A drawing for the marks that have no picture of their own. A pill always
 * opens on a disc, and a date in a disc with nothing in it reads as missing.
 */
const GENERIC: Partial<Record<BookBadgeVariant, LucideIcon>> = {
  date: CalendarDays,
  day: Flag,
  coords: Compass,
  distance: Route,
  altitude: Mountain,
  country: MapPin,
  flag: Flag,
};

export function BadgeIcon({
  el,
  height,
  generic = false,
  ink,
}: {
  el: BookBadgeElement;
  /** The drawn height in millimetres; the width follows the picture's own shape. */
  height: number;
  /** Draw a plain icon for a mark that has no picture of its own. */
  generic?: boolean;
  /** The automatic colour, for a picture drawn on a fill rather than on the page. */
  ink?: string;
}) {
  /*
   * Automatic is the journal's palette for a mood and the accent for anything
   * else. It is passed rather than inherited: lucide writes the colour onto the
   * SVG's stroke, so `currentColor` from the wrapper never reaches it.
   */
  const tint = (automatic: string) => (el.autoIconColor === false ? el.iconColor : (ink ?? automatic));
  const code = el.code;
  const iconStyle = { width: mm(height), height: mm(height), display: 'block', flex: '0 0 auto' } as const;

  if (el.variant === 'flag' && code) return <FlagMark code={code} size={height} />;

  if ((el.variant === 'mood' || el.variant === 'weather') && code) {
    // Kept apart rather than narrowed out of one union: only a mood has a colour of its own.
    const mood = el.variant === 'mood' ? MOOD_CONFIG[code] : null;
    const config = mood ?? WEATHER_CONFIG[code];
    if (config) {
      const Icon = config.icon;
      return <Icon color={tint(mood ? mood.text : el.accent)} strokeWidth={1.7} style={iconStyle} />;
    }
  }

  const shape = el.variant === 'country' && code ? COUNTRY_SHAPES[code.toUpperCase()] : null;
  if (shape) {
    return (
      <svg
        width={mm((height * shape.w) / shape.h)}
        height={mm(height)}
        viewBox={`0 0 ${shape.w} ${shape.h}`}
        style={{ display: 'block', flex: '0 0 auto' }}
      >
        <path d={shape.d} fill={tint(el.accent)} />
      </svg>
    );
  }

  const Icon = generic ? GENERIC[el.variant] : undefined;
  return Icon ? <Icon color={tint(el.accent)} strokeWidth={1.8} style={iconStyle} /> : null;
}
