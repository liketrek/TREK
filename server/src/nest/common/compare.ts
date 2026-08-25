/**
 * The comparator a bare `.sort()` already applies, written out.
 *
 * `Array.prototype.sort()` with no argument compares the UTF-16 code units of
 * each element's string form. For ISO dates, ASCII keys, currency codes and the
 * like that is the order the code wants, but Sonar's S2871 flags the bare call
 * because the same syntax silently mis-sorts numbers ([10, 9, 1] becomes
 * [1, 10, 9]).
 *
 * Shared rather than inlined at each call site: an inline arrow is a new
 * function on every sort, and the ones that live on error paths are never
 * executed by a passing test — which drags a whole domain's coverage down for a
 * comparator that does nothing but restate the default. One exported function,
 * covered once.
 *
 * NOT for user-visible names. Code-unit order files every accented word behind
 * the entire ASCII range, so a list a person reads wants `localeCompare`.
 */
export const byCodeUnit = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
