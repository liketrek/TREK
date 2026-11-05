interface BroughtItem {
  owner_username?: string | null;
  contributors?: { username: string }[] | null;
}

/**
 * Everyone bringing a common item, as one readable list: its bringer first, then
 * whoever also brings it. The row only has room for one avatar and a "+n", so this
 * is what its tooltip and the item sheet name (#2782).
 */
export function packingBringerNames(item: BroughtItem): string {
  const names = [item.owner_username, ...(item.contributors ?? []).map((c) => c.username)];
  return [...new Set(names.filter((n): n is string => !!n))].join(', ');
}
