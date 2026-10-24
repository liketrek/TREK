/**
 * The OSM selectors of CATEGORY_OSM_FILTERS: `key=value`, or several of them
 * joined by `&` when a place has to carry every one (BIK-07: a charging station
 * that also says it is for bicycles). Pure, so the explore pill, the search
 * along a line and the reading of their answers build and match one grammar.
 */

/** The `key=value` conditions of one selector, in the order written. */
function conditionsOf(filter: string): Array<[string, string]> {
  return filter.split('&').map((condition) => {
    const [key, value] = condition.split('=');
    return [key, value];
  });
}

/** The Overpass statement for one selector inside a box, `nwr["k"="v"](box)`; no semicolon. */
export function overpassSelector(filter: string, box: string): string {
  const conditions = conditionsOf(filter)
    .map(([key, value]) => `["${key}"="${value}"]`)
    .join('');
  return `nwr${conditions}${box}`;
}

/** Whether a place's tags meet every condition of one selector. */
export function tagsMatchFilter(tags: Record<string, string>, filter: string): boolean {
  return conditionsOf(filter).every(([key, value]) => tags[key] === value);
}
