import { createElement } from 'react';

import { renderIconMarkup } from '../../utils/iconMarkup';
import { getCategoryIcon } from '../shared/categoryIcons';

import {
  AlertTriangle,
  BedDouble,
  Bike,
  Bookmark,
  Bus,
  CableCar,
  Camera,
  Car,
  CarTaxiFront,
  Clock,
  Coffee,
  Crosshair,
  FileText,
  Flag,
  Globe,
  Heart,
  Hourglass,
  Info,
  KeyRound,
  Lightbulb,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Navigation,
  ParkingSquare,
  Phone,
  Plane,
  Route,
  Sailboat,
  Ship,
  ShoppingBag,
  Star,
  StickyNote,
  Store,
  Tag,
  Ticket,
  Train,
  Users,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

/*
 * Every icon of the trip PDF as SVG markup. They draw in currentColor, so the
 * stylesheet decides their colour, which keeps the palette in one place.
 */

function iconSvg(Icon: LucideIcon, size: number, strokeWidth = 1.9): string {
  return renderIconMarkup(createElement(Icon, { size, strokeWidth, color: 'currentColor', 'aria-hidden': 'true' }));
}

/** The small glyphs of the facts, contact lines and stay rows. */
const GLYPHS = {
  pin: MapPin,
  coords: Crosshair,
  clock: Clock,
  duration: Hourglass,
  price: Wallet,
  star: Star,
  phone: Phone,
  web: Globe,
  mail: Mail,
  hours: Store,
  people: Users,
  note: StickyNote,
  tag: Tag,
  route: Route,
  bed: BedDouble,
  checkIn: LogIn,
  checkOut: LogOut,
  key: KeyRound,
} satisfies Record<string, LucideIcon>;

export type PdfGlyph = keyof typeof GLYPHS;

export function glyph(name: PdfGlyph, size = 10): string {
  return iconSvg(GLYPHS[name], size);
}

const NOTE_ICONS: Record<string, LucideIcon> = {
  FileText,
  Info,
  Clock,
  MapPin,
  Navigation,
  Train,
  Plane,
  Bus,
  Car,
  Ship,
  Coffee,
  Ticket,
  Star,
  Heart,
  Camera,
  Flag,
  Lightbulb,
  AlertTriangle,
  ShoppingBag,
  Bookmark,
};

/** A day note's own icon, the note icon for one that names none. */
export function noteIcon(iconId: string | null | undefined, size = 13): string {
  return iconSvg((iconId && NOTE_ICONS[iconId]) || FileText, size);
}

const BOOKING_ICONS: Record<string, LucideIcon> = {
  flight: Plane,
  train: Train,
  bus: Bus,
  car: Car,
  taxi: CarTaxiFront,
  bicycle: Bike,
  cruise: Ship,
  ferry: Sailboat,
  cable_car: CableCar,
  transport_other: Route,
  restaurant: Utensils,
  event: Ticket,
  tour: Users,
  parking: ParkingSquare,
  other: FileText,
};

/** A booking's type icon; a type the export does not know gets the ticket. */
export function bookingIcon(type: string | null | undefined, size = 14): string {
  return iconSvg((type && BOOKING_ICONS[type]) || Ticket, size);
}

/** The tint of each booking type, the same hues the day plan gives them. */
const BOOKING_TINTS: Record<string, string> = {
  flight: '#3b82f6',
  train: '#0891b2',
  bus: '#059669',
  car: '#64748b',
  taxi: '#ca8a04',
  bicycle: '#65a30d',
  cruise: '#0284c7',
  ferry: '#0d9488',
  cable_car: '#dc2626',
  transport_other: '#64748b',
  restaurant: '#e11d48',
  event: '#d97706',
  tour: '#059669',
  parking: '#2563eb',
  other: '#64748b',
};

export function bookingTint(type: string | null | undefined): string {
  return (type && BOOKING_TINTS[type]) || BOOKING_TINTS.flight;
}

/** A category's icon for the tile a place without a photo prints. */
export function categoryIcon(iconName: string | null | undefined, size = 22): string {
  return iconSvg(getCategoryIcon(iconName), size, 1.7);
}
