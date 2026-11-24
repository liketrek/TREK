import type { CityTier } from './destination-catalog';
import type { TravelPlanBudget, TravelPlanCreateRequest } from '@trek/shared';

/**
 * Rule-based price bands per city tier, in CNY. These are product assumptions,
 * not quotes: the draft shows them as an estimate and the UI says so. Keeping
 * them as constants (rather than admin settings) makes every draft reproducible
 * and testable, which is the whole point of a deterministic budget.
 */
interface TierRates {
  /** Per room per night. */
  lodging: readonly [number, number];
  /** Per person per day. */
  meals: readonly [number, number];
  /** Per person per day on public transit / walking / mixed. */
  transit: readonly [number, number];
  /** Per person per day for tickets and incidental spending. */
  tickets: readonly [number, number];
  /** Per car per day when driving. */
  drive: readonly [number, number];
}

const RATES: Record<CityTier, TierRates> = {
  1: { lodging: [450, 900], meals: [120, 220], transit: [40, 80], tickets: [60, 150], drive: [180, 360] },
  2: { lodging: [280, 550], meals: [90, 160], transit: [30, 60], tickets: [40, 100], drive: [140, 280] },
  3: { lodging: [180, 380], meals: [70, 120], transit: [20, 50], tickets: [25, 70], drive: [110, 220] },
};

const CHILD_WEIGHT = 0.6;

function floorTo(value: number, step: number): number {
  return Math.floor(value / step) * step;
}

function ceilTo(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

/** A category's [min, max] after the plan's rounding policy. */
function band(min: number, max: number): [number, number] {
  const lower = floorTo(min, 10);
  const upper = Math.max(lower, ceilTo(max, 50));
  return [lower, upper];
}

/**
 * Estimate what the planned trip costs, deterministically. It never invents a
 * ticket price for a specific POI; category bands plus explicit assumptions
 * are the whole output so a reader can tell how the number was reached.
 */
export function estimateBudget(request: TravelPlanCreateRequest, days: string[], tier: CityTier): TravelPlanBudget {
  if (days.length === 0) {
    return {
      min: 0,
      max: 0,
      breakdown: {},
      breakdownMax: {},
      assumptions: ['缺少日期，暂未估算预算。'],
    };
  }

  const rates = RATES[tier];
  const { adults, children, seniors } = request.travelers;
  const dayCount = days.length;
  const nights = Math.max(0, dayCount - 1);
  // Children share their parents' room; seniors count as adults for rooms.
  const rooms = Math.max(1, Math.ceil((adults + seniors) / 2));
  const mealPeople = adults + seniors + children * CHILD_WEIGHT;
  const transitPeople = adults + seniors + children;
  const cars = Math.max(1, Math.ceil(transitPeople / 5));

  const [lodgingMin, lodgingMax] = band(rooms * nights * rates.lodging[0], rooms * nights * rates.lodging[1]);
  const [mealsMin, mealsMax] = band(mealPeople * dayCount * rates.meals[0], mealPeople * dayCount * rates.meals[1]);
  const [ticketsMin, ticketsMax] = band(
    mealPeople * dayCount * rates.tickets[0],
    mealPeople * dayCount * rates.tickets[1],
  );

  const [transitMin, transitMax] =
    request.transport === 'driving'
      ? band(cars * dayCount * rates.drive[0], cars * dayCount * rates.drive[1])
      : request.transport === 'walking'
        ? band(0, transitPeople * dayCount * 20)
        : band(transitPeople * dayCount * rates.transit[0], transitPeople * dayCount * rates.transit[1]);

  const assumptions: string[] = [
    nights > 0 ? `按 ${dayCount} 天 ${nights} 晚、${rooms} 间房估算。` : `按 ${dayCount} 天当天往返估算，不计住宿。`,
  ];
  if (children > 0) assumptions.push('儿童餐饮与门票按 0.6 人折算。');
  if (request.transport === 'driving') assumptions.push(`市内交通按 ${cars} 辆车、每车每天计。`);
  assumptions.push('不含往返目的地的大交通、购物与个人消费。');
  assumptions.push('预算为规则估算，不是实时报价。');

  return {
    min: lodgingMin + mealsMin + transitMin + ticketsMin,
    max: lodgingMax + mealsMax + transitMax + ticketsMax,
    breakdown: { lodging: lodgingMin, meals: mealsMin, local_transport: transitMin, tickets_other: ticketsMin },
    breakdownMax: { lodging: lodgingMax, meals: mealsMax, local_transport: transitMax, tickets_other: ticketsMax },
    assumptions,
  };
}
