import { budgetPerPersonOutputSchema, listBudgetItemsOutputSchema } from '@trek/shared/mcp-apps';

/** The two ways the card reads the budget. */
export type BudgetView = 'category' | 'person';

interface CategoryRow {
  name: string;
  amount: number;
  share: number;
}

interface PersonRow {
  name: string;
  assigned: number;
  paid: number;
}

interface BudgetData {
  currency: string;
  total: number | null;
  categories: CategoryRow[] | null;
  people: PersonRow[] | null;
}

/** list_budget_items' totals per category, largest first, with each one's share of the largest. */
export function categoriesOf(data: unknown): Pick<BudgetData, 'currency' | 'total' | 'categories'> | null {
  const parsed = listBudgetItemsOutputSchema.safeParse(data);
  if (!parsed.success) return null;
  const { currency, total, by_category } = parsed.data;
  const entries = Object.entries(by_category).sort(([, a], [, b]) => b - a);
  const largest = entries[0]?.[1] ?? 0;
  return {
    currency,
    total,
    categories: entries.map(([name, amount]) => ({ name, amount, share: largest > 0 ? amount / largest : 0 })),
  };
}

/** get_budget_per_person's rows: what each member's share is and what they paid. */
export function peopleOf(data: unknown): Pick<BudgetData, 'currency' | 'people'> | null {
  const parsed = budgetPerPersonOutputSchema.safeParse(data);
  if (!parsed.success) return null;
  const { summary } = parsed.data;
  return {
    currency: summary[0]?.currency ?? '',
    people: summary.map((row) => ({ name: row.username, assigned: row.total_assigned, paid: row.total_paid })),
  };
}

/** A sum in the trip currency, in the host's locale; the bare number when the currency is not one Intl knows. */
export function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(amount);
  }
}
