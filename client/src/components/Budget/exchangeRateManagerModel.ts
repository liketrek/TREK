export function chooseInitialRateCurrency({
  tripCurrency,
  commonCurrencies,
  usedCurrencies,
  savedCurrencies,
}: {
  tripCurrency: string;
  commonCurrencies: readonly string[];
  usedCurrencies: readonly string[];
  savedCurrencies: readonly string[];
}): string {
  const trip = tripCurrency.toUpperCase();
  const used = usedCurrencies.map((code) => code.toUpperCase()).filter((code) => code !== trip);
  const saved = savedCurrencies.map((code) => code.toUpperCase()).filter((code) => code !== trip);
  const relevant = new Set([...used, ...saved]);
  const pinned = commonCurrencies.map((code) => code.toUpperCase()).find((code) => relevant.has(code));
  if (pinned) return pinned;

  const counts = new Map<string, number>();
  for (const code of used) counts.set(code, (counts.get(code) || 0) + 1);
  const mostUsed = [...counts.entries()].sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0])
  )[0]?.[0];
  if (mostUsed) return mostUsed;
  if (saved[0]) return saved[0];
  return trip === 'USD' ? 'EUR' : 'USD';
}
