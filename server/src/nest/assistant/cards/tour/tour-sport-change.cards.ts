import type { CardReader, PreviewContext, ToolArgs } from '../card-types';
import { recordOf, type Row } from '../card-values';
import { argText, fitted, latLngOf, rowsIn } from './tour-card-values';
import { straightCard } from './tour-change.cards';
import { paddleCard, skiCard } from './tour-sport.cards';
import type { TourRouteCard } from '@trek/shared';

/**
 * The change cards of a paddle or ski tour the assistant saves from its plan
 * (create_paddle_tour, create_ski_tour): the legs between its points planned
 * again as the plan planned them, drawn as the plan's card was, waiting, under
 * the name the tour is saved with. Where the plan cannot be read now, the
 * points are drawn straight and the way is planned when the change is applied.
 */

/** What a held paddle or ski tour looked up: the plan of its legs, null where it could not be read. */
export interface SportLoaded {
  plan: unknown;
}

/** The legs a tour's points make, each from one to the next, as the planning tools take them. */
export function legArgsOf(
  args: ToolArgs,
): Array<{ from: { lat: number; lng: number }; to: { lat: number; lng: number } }> {
  const points = rowsIn(args.waypoints).flatMap((point) => latLngOf(point) ?? []);
  return points.slice(1).map((to, index) => ({ from: points[index] ?? to, to }));
}

/** The fields of a create a plan was asked with besides its legs, as the planning tool names them. */
function planArgs(args: ToolArgs, fields: Readonly<Record<string, string>>): ToolArgs {
  const plan: ToolArgs = { legs: legArgsOf(args) };
  for (const [from, to] of Object.entries(fields)) if (args[from] !== undefined) plan[to] = args[from];
  return plan;
}

/** create_paddle_tour: its legs planned on the water as plan_paddle_route planned them. */
export async function loadCreatePaddle(args: ToolArgs, read: CardReader): Promise<SportLoaded | null> {
  const plan = planArgs(args, { boat_type: 'boat', lake_style: 'lake_style', lock_policy: 'lock_policy' });
  if (rowsIn(plan.legs).length === 0) return null;
  return { plan: await read('plan_paddle_route', plan) };
}

/** create_ski_tour: its legs planned on the piste data as plan_ski_route planned them. */
export async function loadCreateSki(args: ToolArgs, read: CardReader): Promise<SportLoaded | null> {
  const plan = planArgs(args, { discipline: 'discipline', technique: 'technique', options: 'options' });
  if (rowsIn(plan.legs).length === 0) return null;
  return { plan: await read('plan_ski_route', plan) };
}

/** A plan's card, waiting under the name the tour is saved with; else the points straight. */
function heldCard(
  ctx: PreviewContext,
  args: ToolArgs,
  loaded: SportLoaded | null,
  activity: 'kayak' | 'ski',
): TourRouteCard | null {
  const name = argText(args.name, 120);
  const input = { toolCallId: '', args: { legs: legArgsOf(args) } as Row, card: ctx.card, today: ctx.today };
  const value = loaded ? recordOf(loaded.plan) : null;
  const drawn = value ? (activity === 'kayak' ? paddleCard : skiCard)({ ...input, value }) : null;
  if (drawn && drawn.warnings.every((warning) => warning.kind !== 'legs_failed')) {
    return fitted({ ...drawn, source: 'pending', name });
  }
  const straight = straightCard(rowsIn(args.waypoints), activity, { name });
  return straight ? fitted(straight) : null;
}

export function createPaddleCard(
  ctx: PreviewContext,
  args: ToolArgs,
  loaded: SportLoaded | null,
): TourRouteCard | null {
  return heldCard(ctx, args, loaded, 'kayak');
}

export function createSkiCard(ctx: PreviewContext, args: ToolArgs, loaded: SportLoaded | null): TourRouteCard | null {
  return heldCard(ctx, args, loaded, 'ski');
}
