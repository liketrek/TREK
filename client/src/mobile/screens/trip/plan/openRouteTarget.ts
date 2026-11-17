import type { DayRouteTarget } from '../../../../components/Planner/dayRouteApps';

/** Opens a target: a web link in a new tab (the app takes it over), geo: in place. */
export function openRouteTarget(target: DayRouteTarget): void {
  if (target.url.startsWith('geo:')) window.location.assign(target.url);
  else window.open(target.url, '_blank', 'noopener,noreferrer');
}
