import { BOOK_ICON_NAMES_A_E } from './book-icon-names-a-e.data';
import { BOOK_ICON_NAMES_F_P } from './book-icon-names-f-p.data';
import { BOOK_ICON_NAMES_Q_Z } from './book-icon-names-q-z.data';

/**
 * Every drawing the Studio's icon tab offers, by its lucide name: the
 * library as the client ships it, its old names included, the way the tab
 * lists them (client/src/components/Studio/iconLibrary.ts). The book engine
 * takes a new icon by any of these names, so the assistant may place every
 * drawing a person could pick by hand.
 *
 * A set of names rather than the enum the contract usually spells: the page
 * edit's tool schema carries no `$ref`, and some two thousand names written
 * into it three times over would take it far past its size ceiling. The names
 * are checked against this set instead, which refuses exactly what an enum
 * would. A client test holds the set to the lucide version the client runs,
 * so an icon is never named here that would draw as the fallback glyph.
 */
export const BOOK_ICON_NAMES: ReadonlySet<string> = new Set([
  ...BOOK_ICON_NAMES_A_E,
  ...BOOK_ICON_NAMES_F_P,
  ...BOOK_ICON_NAMES_Q_Z,
]);

/**
 * The shelf the Studio's icon tab opens on, by lucide name: the drawings a
 * travel page reaches for first, in the order somebody would look for them
 * (iconLibrary.ts filters it against the lucide version it ships). The tool
 * schema names a few of them as examples, so a model starts from a drawing
 * that belongs on a travel page rather than from the alphabet.
 */
export const BOOK_DESIGN_ICONS = [
  'Plane',
  'Train',
  'TrainFront',
  'Car',
  'Bus',
  'Ship',
  'Bike',
  'Footprints',
  'Sailboat',
  'MapPin',
  'Map',
  'Compass',
  'Navigation',
  'Route',
  'Globe',
  'Milestone',
  'Signpost',
  'Mountain',
  'MountainSnow',
  'Waves',
  'TreePine',
  'Palmtree',
  'Flower2',
  'Leaf',
  'Bird',
  'Fish',
  'Sun',
  'Sunrise',
  'Sunset',
  'Moon',
  'Cloud',
  'CloudRain',
  'CloudLightning',
  'Snowflake',
  'Umbrella',
  'Thermometer',
  'Wind',
  'Tent',
  'Backpack',
  'Luggage',
  'BedDouble',
  'Hotel',
  'Key',
  'Anchor',
  'Coffee',
  'UtensilsCrossed',
  'Wine',
  'Beer',
  'IceCream',
  'Croissant',
  'Camera',
  'Image',
  'Film',
  'Music',
  'BookOpen',
  'PenLine',
  'Quote',
  'Sticker',
  'Heart',
  'Star',
  'Sparkles',
  'Flag',
  'Ticket',
  'Gift',
  'PartyPopper',
  'Clock',
  'CalendarDays',
  'CreditCard',
  'Wallet',
  'ShoppingBag',
  'Landmark',
  'Church',
  'Castle',
  'Building2',
  'Home',
  'Binoculars',
  'Telescope',
] as const;
export type BookDesignIcon = (typeof BOOK_DESIGN_ICONS)[number];
