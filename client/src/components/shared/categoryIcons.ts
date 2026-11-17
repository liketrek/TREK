import {
  MapPin, Building2, BedDouble, UtensilsCrossed, Landmark, ShoppingBag,
  Bus, Train, Car, Plane, Ship, Bike,
  Activity, Dumbbell, Mountain, Tent, Anchor,
  Coffee, Beer, Wine, Utensils,
  Camera, Music, Theater, Ticket,
  TreePine, Waves, Leaf, Flower2, Sun,
  Globe, Compass, Flag, Navigation, Map,
  Church, Library, Store, Home, Cross,
  Heart, Star, CreditCard, Wifi,
  Luggage, Backpack, Zap, Croissant, ShoppingBasket,
  BusFront, TrainFront, PlaneTakeoff, ParkingSquare, Fuel,
  LucideIcon,
} from 'lucide-react'

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  MapPin, Building2, BedDouble, UtensilsCrossed, Landmark, ShoppingBag,
  Bus, Train, Car, Plane, Ship, Bike,
  BusFront, TrainFront, PlaneTakeoff, ParkingSquare, Fuel,
  Activity, Dumbbell, Mountain, Tent, Anchor,
  Coffee, Beer, Wine, Utensils,
  Camera, Music, Theater, Ticket,
  TreePine, Waves, Leaf, Flower2, Sun,
  Globe, Compass, Flag, Navigation, Map,
  Church, Library, Store, Home, Cross,
  Heart, Star, CreditCard, Wifi,
  Luggage, Backpack, Zap, Croissant, ShoppingBasket,
}

export const ICON_LABELS: Record<string, string> = {
  MapPin: 'Pin', Building2: 'Building', BedDouble: 'Hotel', UtensilsCrossed: 'Restaurant',
  Landmark: 'Attraction', ShoppingBag: 'Shopping', Bus: 'Bus', Train: 'Train',
  Car: 'Car', Plane: 'Plane', Ship: 'Ship / Ferry', Bike: 'Bicycle',
  BusFront: 'Bus stop', TrainFront: 'Station', PlaneTakeoff: 'Airport', ParkingSquare: 'Parking', Fuel: 'Fuel',
  Activity: 'Activity', Dumbbell: 'Fitness', Mountain: 'Mountain', Tent: 'Camping',
  Anchor: 'Harbor', Coffee: 'Cafe', Beer: 'Bar', Wine: 'Wine', Utensils: 'Food',
  Camera: 'Photo', Music: 'Music', Theater: 'Theater', Ticket: 'Events',
  TreePine: 'Nature', Waves: 'Beach', Leaf: 'Green', Flower2: 'Garden', Sun: 'Sun',
  Globe: 'World', Compass: 'Explore', Flag: 'Flag', Navigation: 'Navigation', Map: 'Map',
  Church: 'Church', Library: 'Museum', Store: 'Market', Home: 'Accommodation', Cross: 'Medicine',
  Heart: 'Favorite', Star: 'Top', CreditCard: 'Bank', Wifi: 'Internet',
  Luggage: 'Luggage', Backpack: 'Backpack', Zap: 'Adventure',
  Croissant: 'Bakery', ShoppingBasket: 'Groceries',
}

export function getCategoryIcon(iconName: string | null | undefined): LucideIcon {
  return (iconName && CATEGORY_ICON_MAP[iconName]) || MapPin
}
