/**
 * What each block of the public share payload (GET /api/shared/:token) may
 * carry. The repositories hand over full rows; these allow-lists pick the
 * columns the shared page reads, so a column added to a table later never
 * becomes public by appearing. Names the page does not read stay behind:
 * owner and author ids, private notes, ticket data, bookkeeping timestamps.
 */

/** A day as the shared page draws it: its number, date and title, never the owner's day notes. */
export interface PublicDay {
  id: number;
  day_number: number;
  date: string | null;
  title: string | null;
}

export function publicDay(d: PublicDay): PublicDay {
  return { id: d.id, day_number: d.day_number, date: d.date ?? null, title: d.title ?? null };
}

/** A note on a day: its text, the detail line, the icon and colour, and where it sits among the stops. */
export interface PublicDayNote {
  id: number;
  day_id: number;
  text: string;
  time: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number | null;
}

export function publicDayNote(n: PublicDayNote): PublicDayNote {
  return {
    id: n.id,
    day_id: n.day_id,
    text: n.text,
    time: n.time ?? null,
    icon: n.icon ?? null,
    color: n.color ?? null,
    sort_order: n.sort_order ?? null,
  };
}

/** A Common packing item: what it is, how many, and whether it is packed. Never whose it is. */
interface PublicPackingItem {
  id: number;
  name: string;
  category: string | null;
  checked: number | null;
  quantity: number | null;
  sort_order: number | null;
}

export function publicPackingItem(i: PublicPackingItem): PublicPackingItem {
  return {
    id: i.id,
    name: i.name,
    category: i.category ?? null,
    checked: i.checked ?? null,
    quantity: i.quantity ?? null,
    sort_order: i.sort_order ?? null,
  };
}

/**
 * An expense: its name, group and amount with the rate it was entered at, which
 * is all the Costs tab needs to convert it. The note, who paid, the linked
 * booking and the stored ticket stay with the trip.
 */
interface PublicBudgetItem {
  id: number;
  name: string;
  category: string;
  total_price: number;
  currency: string | null;
  exchange_rate: number;
}

export function publicBudgetItem(i: PublicBudgetItem): PublicBudgetItem {
  return {
    id: i.id,
    name: i.name,
    category: i.category,
    total_price: i.total_price,
    currency: i.currency ?? null,
    exchange_rate: i.exchange_rate,
  };
}

/** A chat message under its author's name and avatar, without the author's account id. */
interface PublicCollabMessage {
  id: number;
  text: string;
  created_at: string | null;
  username: string;
  avatar: string | null;
}

export function publicCollabMessage(m: PublicCollabMessage): PublicCollabMessage {
  return { id: m.id, text: m.text, created_at: m.created_at ?? null, username: m.username, avatar: m.avatar ?? null };
}

/** A category as the page colours a pin or a stop with it. */
interface PublicCategory {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
}

interface CategorizedPlace {
  category_id?: number | null;
  category_name?: string | null;
  category_color?: string | null;
  category_icon?: string | null;
}

interface CategorizedStop {
  place?: { category?: { id: number; name?: string | null; color?: string | null; icon?: string | null } | null };
}

/**
 * The categories the shared places use, and only those. Categories are a pool
 * across all users, so the payload used to carry every one of them, other
 * users' own included. Read from the places that actually go out, after the
 * narrowing options ran, so a hidden place does not leave its category behind.
 */
export function categoriesInUse(
  places: readonly CategorizedPlace[],
  assignments: Record<number, readonly CategorizedStop[]>,
): PublicCategory[] {
  const byId = new Map<number, PublicCategory>();
  const add = (id: number | null | undefined, name: string | null | undefined, color: unknown, icon: unknown) => {
    // A dangling id or a category without a name has nothing to draw.
    if (id == null || name == null || byId.has(id)) return;
    byId.set(id, {
      id,
      name,
      color: typeof color === 'string' ? color : null,
      icon: typeof icon === 'string' ? icon : null,
    });
  };
  for (const p of places) add(p.category_id, p.category_name, p.category_color, p.category_icon);
  for (const rows of Object.values(assignments)) {
    for (const a of rows) {
      const c = a.place?.category;
      if (c) add(c.id, c.name, c.color, c.icon);
    }
  }
  return [...byId.values()].sort((a, b) => a.id - b.id);
}
