import {
  FileText, Info, Clock, MapPin, Navigation, Train, Plane, Bus, Car, Ship,
  Coffee, Ticket, Star, Heart, Camera, Flag, Lightbulb, AlertTriangle,
  ShoppingBag, Bookmark, Hotel, Utensils, Users,
} from 'lucide-react'

export const RES_ICONS = { flight: Plane, hotel: Hotel, restaurant: Utensils, train: Train, car: Car, cruise: Ship, event: Ticket, tour: Users, other: FileText }

export const NOTE_ICONS = [
  { id: 'FileText', Icon: FileText },
  { id: 'Info', Icon: Info },
  { id: 'Clock', Icon: Clock },
  { id: 'MapPin', Icon: MapPin },
  { id: 'Navigation', Icon: Navigation },
  { id: 'Train', Icon: Train },
  { id: 'Plane', Icon: Plane },
  { id: 'Bus', Icon: Bus },
  { id: 'Car', Icon: Car },
  { id: 'Ship', Icon: Ship },
  { id: 'Coffee', Icon: Coffee },
  { id: 'Ticket', Icon: Ticket },
  { id: 'Star', Icon: Star },
  { id: 'Heart', Icon: Heart },
  { id: 'Camera', Icon: Camera },
  { id: 'Flag', Icon: Flag },
  { id: 'Lightbulb', Icon: Lightbulb },
  { id: 'AlertTriangle', Icon: AlertTriangle },
  { id: 'ShoppingBag', Icon: ShoppingBag },
  { id: 'Bookmark', Icon: Bookmark },
]
const NOTE_ICON_MAP = Object.fromEntries(NOTE_ICONS.map(({ id, Icon }) => [id, Icon]))
export function getNoteIcon(iconId) { return NOTE_ICON_MAP[iconId] || FileText }

export const TYPE_ICONS = {
  flight: '✈️', hotel: '🏨', restaurant: '🍽️', train: '🚆',
  car: '🚗', cruise: '🚢', event: '🎫', other: '📋',
}

export const TRANSPORT_DETAIL_COLORS = { flight: '#3b82f6', train: '#06b6d4', bus: '#f59e0b', car: '#6b7280', cruise: '#0ea5e9' }
