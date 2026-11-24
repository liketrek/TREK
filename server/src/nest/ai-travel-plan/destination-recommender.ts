import { estimateBudget } from './budget-estimator';
import { DESTINATION_CATALOG, type DestinationProfile } from './destination-catalog';
import type { PlannerProvider } from './planner-provider';
import type { DestinationIdea, DestinationIdeaRequest, TravelPlanCreateRequest } from '@trek/shared';

const MAX_VERIFIED = 6;
const MAX_IDEAS = 3;
/** A map hit farther than this from the catalog coordinate means the city moved. */
const MAX_EVIDENCE_METERS = 100_000;

export interface DestinationRecommendationInput {
  userId: number;
  request: DestinationIdeaRequest;
  provider: Pick<PlannerProvider, 'search'>;
}

interface ScoredProfile {
  profile: DestinationProfile;
  order: number;
  score: number;
  matched: string[];
}

function scoreProfile(profile: DestinationProfile, request: DestinationIdeaRequest, month: number): number {
  const matched = profile.interests.filter((interest) =>
    request.interests.some((wanted) => wanted.includes(interest) || interest.includes(wanted)),
  );
  let score = matched.length * 4;
  if (profile.bestMonths.includes(month)) score += 2;
  return score;
}

function matchedInterests(profile: DestinationProfile, request: DestinationIdeaRequest): string[] {
  return profile.interests.filter((interest) =>
    request.interests.some((wanted) => wanted.includes(interest) || interest.includes(wanted)),
  );
}

/**
 * The map is the only thing that can prove a catalog coordinate still names a
 * real city. A provider error is tolerated (fail-open) so an outage cannot
 * empty the whole list; a successful search with no nearby hit is not.
 */
async function hasMapEvidence(
  profile: DestinationProfile,
  userId: number,
  provider: Pick<PlannerProvider, 'search'>,
): Promise<boolean> {
  try {
    const found = await provider.search(userId, `${profile.name} 景点`, profile);
    if (found.length === 0) return false;
    return found.some((candidate) => haversine(candidate.place, profile) <= MAX_EVIDENCE_METERS);
  } catch {
    return true;
  }
}

function toIdea(
  profile: DestinationProfile,
  days: number,
  request: DestinationIdeaRequest,
  month: number,
  matched: string[],
): DestinationIdea {
  const planRequest: TravelPlanCreateRequest = {
    destination: profile.name,
    dayCount: days,
    travelers: { adults: request.travelers ?? 2, children: 0, seniors: 0 },
    pace: 'balanced',
    interests: request.interests,
    transport: 'public_transit',
    constraints: [],
    budgetCny: request.budgetCny,
  };
  const budget = estimateBudget(
    planRequest,
    Array.from({ length: days }, () => ''),
    profile.tier,
  );

  const reasons: string[] = [];
  if (matched.length > 0) reasons.push(`兴趣匹配：${matched.slice(0, 3).join('、')}`);
  if (profile.bestMonths.includes(month)) {
    reasons.push(`${month} 月是${profile.name}的适宜出行季`);
  } else if (profile.bestMonths.length > 0) {
    reasons.push(`更适宜在 ${profile.bestMonths.join('、')} 月前往`);
  }
  if (request.budgetCny !== undefined && budget.min > request.budgetCny) {
    reasons.push('预算偏紧，建议缩短天数或选择近程目的地');
  } else {
    reasons.push(
      `按 ${days} 天规则估算总花费约 ¥${budget.min.toLocaleString('zh-CN')}–${budget.max.toLocaleString('zh-CN')}`,
    );
  }

  return {
    id: profile.id,
    name: profile.name,
    region: profile.region,
    lat: profile.lat,
    lng: profile.lng,
    tier: profile.tier,
    suggestedDays: days,
    bestMonths: profile.bestMonths,
    reasons,
    estimatedBudgetCny: { min: budget.min, max: budget.max },
  };
}

/**
 * Rank the curated catalog against the traveller's wishes, then prove the top
 * few cities on the map before offering at most three. Deterministic for the
 * same request; the caller adds the short-lived cache.
 */
export async function recommendDestinations(input: DestinationRecommendationInput): Promise<DestinationIdea[]> {
  const days = input.request.days ?? 3;
  const month = input.request.month ?? new Date().getMonth() + 1;

  const ranked: ScoredProfile[] = DESTINATION_CATALOG.map((profile, order) => ({
    profile,
    order,
    score: scoreProfile(profile, input.request, month),
    matched: matchedInterests(profile, input.request),
  }))
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, MAX_VERIFIED);

  const evidence = await Promise.all(
    ranked.map((entry) => hasMapEvidence(entry.profile, input.userId, input.provider)),
  );

  const ideas: DestinationIdea[] = [];
  ranked.forEach((entry, index) => {
    if (ideas.length >= MAX_IDEAS || !evidence[index]) return;
    ideas.push(toIdea(entry.profile, days, input.request, month, entry.matched));
  });
  return ideas;
}

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(h)));
}
