import {
  FileText, Info, Clock, MapPin, Navigation, Train, Plane, Bus, Car, Ship,
  Coffee, Ticket, Star, Heart, Camera, Flag, Lightbulb, AlertTriangle,
  ShoppingBag, Bookmark, Hotel, Utensils, Users, Sailboat, Bike, CarTaxiFront, Route, TramFront,
  Wine, ParkingSquare, Fuel, Footprints, Mountain, Waves, Sun, Umbrella, Music, Landmark, Gift,
} from 'lucide-react'

export const RES_ICONS = { flight: Plane, hotel: Hotel, restaurant: Utensils, train: Train, car: Car, cruise: Ship, bus: Bus, ferry: Sailboat, bicycle: Bike, taxi: CarTaxiFront, transit: TramFront, transport_other: Route, event: Ticket, tour: Users, other: FileText }

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
  { id: 'Utensils', Icon: Utensils },
  { id: 'Wine', Icon: Wine },
  { id: 'ParkingSquare', Icon: ParkingSquare },
  { id: 'Fuel', Icon: Fuel },
  { id: 'Footprints', Icon: Footprints },
  { id: 'Mountain', Icon: Mountain },
  { id: 'Waves', Icon: Waves },
  { id: 'Sun', Icon: Sun },
  { id: 'Umbrella', Icon: Umbrella },
  { id: 'Music', Icon: Music },
  { id: 'Landmark', Icon: Landmark },
  { id: 'Gift', Icon: Gift },
]
const NOTE_ICON_MAP = Object.fromEntries(NOTE_ICONS.map(({ id, Icon }) => [id, Icon]))
export function getNoteIcon(iconId) { return NOTE_ICON_MAP[iconId] || FileText }

export const TYPE_ICONS = {
  flight: '✈️', hotel: '🏨', restaurant: '🍽️', train: '🚆',
  car: '🚗', cruise: '🚢', bus: '🚌', ferry: '⛴️', bicycle: '🚲', taxi: '🚕',
  transport_other: '🧭', event: '🎫', other: '📋',
}

export const TRANSPORT_DETAIL_COLORS = { flight: '#3b82f6', train: '#06b6d4', bus: '#059669', ferry: '#0d9488', bicycle: '#84cc16', taxi: '#ca8a04', car: '#6b7280', cruise: '#0ea5e9', transit: '#7c3aed', transport_other: '#6b7280' }
