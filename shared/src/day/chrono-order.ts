/**
 * The order of a day plan by time. An item with a time sorts by it. An item without
 * one inherits the time of the timed item before it, so it stays where it was put:
 * behind the stop it followed, or at the front if nothing timed comes before it.
 * Ties keep the incoming order.
 *
 * Shared so both sides apply one rule. The server persists this order when a stop's
 * start changes, and the client applies it again on every render. The server used to
 * keep its own copy that put every untimed stop at the end of the day, so one start
 * time pulled a stop to the top of a day it had been planned at the bottom of.
 *
 * The rule is the same, the input is not. The server sorts the day's stops alone; the
 * client sorts the day list, with its notes and bookings between the stops. An untimed
 * stop behind a timed note inherits the note's time on the client and the previous
 * stop's time on the server, so on such a day the two orders can differ.
 *
 * `minutesOf` is where the two sides differ as well: what counts as a time, and which
 * one. It returns null (or undefined) for an item without a time.
 */
export function chronoOrder<T>(items: readonly T[], minutesOf: (item: T) => number | null | undefined): T[] {
  let last = -Infinity;
  return items
    .map((item, index) => {
      const minutes = minutesOf(item);
      if (minutes !== null && minutes !== undefined) last = minutes;
      return { item, index, at: minutes ?? last };
    })
    .sort((a, b) => a.at - b.at || a.index - b.index)
    .map((entry) => entry.item);
}
