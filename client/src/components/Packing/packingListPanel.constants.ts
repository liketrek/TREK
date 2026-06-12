export const VORSCHLAEGE = [
  { name: 'Passport', category: 'Documents' },
  { name: 'Travel Insurance', category: 'Documents' },
  { name: 'Visa Documents', category: 'Documents' },
  { name: 'Flight Tickets', category: 'Documents' },
  { name: 'Hotel Bookings', category: 'Documents' },
  { name: 'Vaccination Card', category: 'Documents' },
  { name: 'T-Shirts (5x)', category: 'Clothing' },
  { name: 'Pants (2x)', category: 'Clothing' },
  { name: 'Underwear (7x)', category: 'Clothing' },
  { name: 'Socks (7x)', category: 'Clothing' },
  { name: 'Jacket', category: 'Clothing' },
  { name: 'Swimwear', category: 'Clothing' },
  { name: 'Sport Shoes', category: 'Clothing' },
  { name: 'Toothbrush', category: 'Toiletries' },
  { name: 'Toothpaste', category: 'Toiletries' },
  { name: 'Shampoo', category: 'Toiletries' },
  { name: 'Sunscreen', category: 'Toiletries' },
  { name: 'Deodorant', category: 'Toiletries' },
  { name: 'Razor', category: 'Toiletries' },
  { name: 'Phone Charger', category: 'Electronics' },
  { name: 'Travel Adapter', category: 'Electronics' },
  { name: 'Headphones', category: 'Electronics' },
  { name: 'Camera', category: 'Electronics' },
  { name: 'Power Bank', category: 'Electronics' },
  { name: 'First Aid Kit', category: 'Health' },
  { name: 'Prescription Medication', category: 'Health' },
  { name: 'Pain Medication', category: 'Health' },
  { name: 'Insect Repellent', category: 'Health' },
  { name: 'Cash', category: 'Finances' },
  { name: 'Credit Card', category: 'Finances' },
]

// Cycling color palette — works in light & dark mode
export const KAT_COLORS = [
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
  '#22c55e', // green
  '#f97316', // orange
  '#06b6d4', // cyan
  '#ef4444', // red
  '#eab308', // yellow
  '#8b5cf6', // violet
  '#14b8a6', // teal
]

export const BAG_COLORS = ['#6366f1', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#8b5cf6', '#ef4444', '#f59e0b', '#3b82f6', '#84cc16', '#d946ef', '#14b8a6', '#f43f5e', '#a855f7', '#eab308', '#64748b']

// A category's first item is seeded with this sentinel because the server
// rejects empty names. Treat it as a placeholder in the UI.
export const PACKING_PLACEHOLDER_NAME = '...'
