import { parseAmount } from './clients/nuextract';
import { toMinor } from '@trek/shared';

type Node = Record<string, unknown>;

/** Lines that state a sum rather than a fare per leg or a seat surcharge. */
const TOTAL_LINE = /total|gesamt|summe|betrag|amount|paid|bezahlt/i;
/** One number as printed: digits with their grouping and decimal marks, never two numbers glued together. */
const NUMBER = /\d[\d.,]*/g;

/**
 * How many lines of the document print this amount (in hundredths), and whether
 * one of them is a total line. Printed once per leg it is a fare per leg, even
 * on lines labelled "Amount", not one total the model repeated.
 */
function amountLines(text: string, minor: number): { lines: number; onTotal: boolean } {
  let lines = 0;
  let onTotal = false;
  for (const line of text.split('\n')) {
    const printed = (line.match(NUMBER) ?? []).some((token) => {
      const amount = parseAmount(token);
      return amount != null && toMinor(amount) === minor;
    });
    if (!printed) continue;
    lines += 1;
    if (TOTAL_LINE.test(line)) onTotal = true;
  }
  return { lines, onTotal };
}

const reference = (node: Node) =>
  String(node.reservationNumber ?? '')
    .trim()
    .toUpperCase();

const departure = (node: Node) => {
  const time = (node.reservationFor as { departureTime?: unknown } | undefined)?.departureTime;
  return typeof time === 'string' ? time : '';
};

const priceOf = (node: Node): number | null => {
  const amount = parseAmount(node.price);
  return amount != null && amount > 0 ? toMinor(amount) : null;
};

/**
 * A model reading a round trip with one total for the whole booking puts that
 * total on every flight, and saving both legs then books the purchase twice
 * (#2651). When the flights plainly share it, the price stays on the first
 * flight to depart and leaves the others.
 *
 * Plainly means: only flights, all on one booking reference, at least two of
 * them priced, every price the same amount in the same currency, and the
 * document printing that amount on a total line, on fewer lines than there are
 * priced flights. Fares that differ, separate references, mixed currencies,
 * other booking types, or no document text to check against (a PDF read
 * natively, a photo) leave the nodes as they are.
 */
export function collapseRepeatedBookingTotal(nodes: Node[], documentText: string | undefined): Node[] {
  if (!documentText || nodes.length < 2) return nodes;
  if (!nodes.every((node) => node['@type'] === 'FlightReservation')) return nodes;
  const ref = reference(nodes[0]);
  if (!ref || !nodes.every((node) => reference(node) === ref)) return nodes;

  const priced = nodes.filter((node) => priceOf(node) != null);
  const minor = priced.length >= 2 ? priceOf(priced[0]) : null;
  if (minor == null) return nodes;
  const currency = priced[0].priceCurrency;
  if (!priced.every((node) => priceOf(node) === minor && node.priceCurrency === currency)) return nodes;
  const printed = amountLines(documentText, minor);
  if (!printed.onTotal || printed.lines >= priced.length) return nodes;

  // The first to depart keeps it; a tie keeps the order the model gave.
  const keeper = priced.reduce((first, node) => (departure(node) < departure(first) ? node : first), priced[0]);
  return nodes.map((node) => {
    if (node === keeper || priceOf(node) == null) return node;
    const { price: _price, priceCurrency: _currency, ...rest } = node;
    return rest;
  });
}
