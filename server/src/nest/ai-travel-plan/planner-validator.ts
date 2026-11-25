import type { TravelPlanCreateRequest, TravelPlanDraft, TravelPlanWarning } from '@trek/shared';

/** A gap longer than this between two stops is worth telling the traveller about. */
const LONG_GAP_MINUTES = 90;

/** The latest a stop may end before the day counts as overloaded. */
const DAY_HARD_END_MINUTES = 22 * 60;

/** A day may not ask for more than this many hours of activity. */
const DAY_MAX_ACTIVE_MINUTES = 10 * 60;

/** The lunch window, where an intentional break is not a "long gap". */
const LUNCH_START_MINUTES = 11 * 60 + 30;
const LUNCH_END_MINUTES = 13 * 60 + 30;

/**
 * PLAN-10: the deterministic checks every draft goes through.
 *
 * These rules are the last line between the planner and the traveller: they
 * do not call a provider and they do not rewrite the draft. They only raise
 * stable, readable warnings — and a warning marked `blocking` stops the plan
 * from being applied.
 */
export function validateDraft(request: TravelPlanCreateRequest, draft: TravelPlanDraft): TravelPlanWarning[] {
  const warnings: TravelPlanWarning[] = [...draft.warnings];

  if (draft.days.length === 0 || draft.days.every((day) => day.items.length === 0)) {
    warnings.push({
      code: 'no_places_found',
      message: '没有检索到可用的真实地点，无法生成可应用的行程。',
      severity: 'blocking',
    });
    return dedupe(warnings);
  }

  const seen = new Map<string, string>();
  for (const day of draft.days) {
    for (const item of day.items) {
      const key = item.place.providerId;
      const previous = seen.get(key);
      if (previous) {
        warnings.push({
          code: 'duplicate_place',
          message: `「${item.place.name}」在行程中重复出现（${previous} 与 ${day.date}）。`,
          severity: 'warning',
        });
      } else {
        seen.set(key, day.date);
      }
      if (!Number.isFinite(item.place.lat) || !Number.isFinite(item.place.lng)) {
        warnings.push({
          code: 'place_missing_coordinates',
          message: `「${item.place.name}」没有坐标，不能写入行程。`,
          severity: 'blocking',
        });
      }
    }
  }

  for (const day of draft.days) {
    const timed = day.items.filter((item) => item.arriveAt !== null && item.leaveAt !== null);
    if (timed.length === 0) continue;

    const first = minutes(timed[0]?.arriveAt ?? null);
    const last = minutes(timed[timed.length - 1]?.leaveAt ?? null);
    const lastLeave = Math.max(...timed.map((item) => minutes(item.leaveAt) ?? 0));

    if (lastLeave > DAY_HARD_END_MINUTES) {
      warnings.push({
        code: 'day_overloaded',
        message: `${day.date} 的行程结束于 ${timed[timed.length - 1]?.leaveAt}，超过 22:00。`,
        severity: 'blocking',
      });
    } else if (first !== null && last !== null && last - first > DAY_MAX_ACTIVE_MINUTES) {
      warnings.push({
        code: 'day_overloaded',
        message: `${day.date} 的行程跨度超过 10 小时，建议减少地点。`,
        severity: 'blocking',
      });
    }

    for (let index = 1; index < timed.length; index += 1) {
      const previousLeave = minutes(timed[index - 1]?.leaveAt ?? null);
      const nextArrive = minutes(timed[index]?.arriveAt ?? null);
      if (previousLeave === null || nextArrive === null) continue;
      const gap = nextArrive - previousLeave;
      if (gap <= LONG_GAP_MINUTES) continue;
      if (previousLeave >= LUNCH_START_MINUTES && nextArrive <= LUNCH_END_MINUTES) continue;
      warnings.push({
        code: 'long_gap',
        message: `${day.date} 在「${timed[index - 1]?.place.name}」之后有 ${gap} 分钟空档。`,
        severity: 'warning',
      });
    }
  }

  if (draft.estimatedBudgetCny.assumptions.length === 0) {
    warnings.push({
      code: 'price_unconfirmed',
      message: '这份草案还没有预算估算依据，费用仅供占位，请以现场为准。',
      severity: 'info',
    });
  }

  const budget = request.budgetCny;
  if (budget !== undefined && draft.estimatedBudgetCny.min > budget) {
    warnings.push({
      code: 'budget_exceeded',
      message: `已知消费下限约 ${Math.round(draft.estimatedBudgetCny.min)} 元，超过你给出的 ${budget} 元预算。`,
      severity: 'warning',
    });
  }

  return dedupe(warnings);
}

/** Whether any warning forbids applying the plan. */
export function hasBlockingWarning(warnings: TravelPlanWarning[]): boolean {
  return warnings.some((warning) => warning.severity === 'blocking');
}

function minutes(value: string | null): number | null {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function dedupe(warnings: TravelPlanWarning[]): TravelPlanWarning[] {
  const seen = new Set<string>();
  return warnings.filter((warning) => {
    const key = `${warning.code}|${warning.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
