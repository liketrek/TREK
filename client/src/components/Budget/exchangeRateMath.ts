export function frozenTransactionAmountToDisplay(
  amount: number,
  currency: string | null | undefined,
  exchangeRate: number | null | undefined,
  tripCurrency: string,
  convertToDisplay: (amount: number, currency: string | null | undefined) => number
): number {
  const trip = tripCurrency.toUpperCase();
  const current = (currency || trip).toUpperCase();
  if (current === trip) return convertToDisplay(amount, trip);
  if (exchangeRate != null && exchangeRate > 0 && exchangeRate !== 1) {
    return convertToDisplay(amount / exchangeRate, trip);
  }
  return convertToDisplay(amount, current);
}
