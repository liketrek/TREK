import { COST_CATEGORIES, type CostCategory } from './budget.schema';

/**
 * Free-text and legacy categories (and booking type labels) mapped to the fixed
 * keys. Bookings used to store labels like "Flight"/"Train"/"Other", and an
 * assistant writing through the MCP says "Food" where the key is "food".
 * Every reservation type is in here too, so a booking's cost lands on the same
 * key whether the web form, the import or the MCP wrote it.
 */
const CATEGORY_ALIASES: Record<string, CostCategory> = {
  flight: 'flights',
  flights: 'flights',
  plane: 'flights',
  flug: 'flights',
  train: 'transport',
  bus: 'transport',
  car: 'transport',
  'car rental': 'transport',
  'car-rental': 'transport',
  bicycle: 'transport',
  cruise: 'transport',
  ferry: 'transport',
  boat: 'transport',
  taxi: 'transport',
  transfer: 'transport',
  cable_car: 'transport',
  transit: 'transport',
  transport_other: 'transport',
  transport: 'transport',
  transportation: 'transport',
  hotel: 'accommodation',
  accommodation: 'accommodation',
  lodging: 'accommodation',
  hostel: 'accommodation',
  restaurant: 'food',
  food: 'food',
  dining: 'food',
  meal: 'food',
  meals: 'food',
  grocery: 'groceries',
  groceries: 'groceries',
  activity: 'activities',
  activities: 'activities',
  event: 'activities',
  tour: 'activities',
  sightseeing: 'sightseeing',
  sights: 'sightseeing',
  shop: 'shopping',
  shopping: 'shopping',
  fee: 'fees',
  fees: 'fees',
  health: 'health',
  medical: 'health',
  tip: 'tips',
  tips: 'tips',
  gas: 'fuel',
  fuel: 'fuel',
  petrol: 'fuel',
  parking: 'parking',
  parkings: 'parking',
  'car park': 'parking',
  other: 'other',
  misc: 'other',
};

const KEYS: ReadonlySet<string> = new Set(COST_CATEGORIES);

/**
 * The fixed key a stored or typed category stands for, whatever its case, or
 * null for a category that is none of them.
 */
export function costCategoryOf(category: string | null | undefined): CostCategory | null {
  if (!category) return null;
  if (KEYS.has(category)) return category as CostCategory;
  return CATEGORY_ALIASES[category.trim().toLowerCase()] ?? null;
}

/**
 * The Costs category a booking of this type is filed under, `other` for a type
 * no key stands for. Reads the same table as costCategoryOf, so a cost created
 * with a booking and the type-change resync never disagree about it.
 */
export function typeToCostCategory(type: string | null | undefined): CostCategory {
  return costCategoryOf(type) ?? 'other';
}

/**
 * The category an expense is stored under: the fixed key when the text names one,
 * so "Food" and "food" are one category, and the text itself otherwise.
 */
export function storedCostCategory(category: string | null | undefined): string {
  return costCategoryOf(category) ?? (category || 'other');
}

/** The booking types whose cost the type map filed under `other` before 5.1.1. */
const FILED_AS_OTHER_BEFORE = new Set([
  'cable_car',
  'event',
  'tour',
  'cruise',
  'bicycle',
  'transit',
  'transport_other',
]);

/**
 * Whether a booking's expense still carries the category derived from its type, so it
 * moves with a type change; one picked by hand stays. Read through costCategoryOf, so a
 * label stored before the fixed keys ("Flight") counts as the key it stands for, and an
 * `other` on a type the old map filed there still counts as derived.
 */
export function isDerivedCostCategory(category: string | null | undefined, type: string): boolean {
  if (costCategoryOf(category) === typeToCostCategory(type)) return true;
  return category === 'other' && FILED_AS_OTHER_BEFORE.has(type);
}

/** What the MCP tells an assistant about the category field. */
export const COST_CATEGORY_HINT = `One of the Costs categories: ${COST_CATEGORIES.join(', ')}. Another case or a common name (Hotel, Flight, Food) is stored as its key; any other text is kept as given and shows as other`;
