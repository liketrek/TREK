import { ADDON_IDS } from '../../addons';
import { Trips } from '../../db/entities/Trips.entity';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import { McpController, ResourceTemplate, type McpContext } from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { BudgetService } from './budget.service';
import { ExchangeRatesService } from './exchange-rates.service';
import { InjectRepository } from '@mikro-orm/nestjs';

const budgetAddonOn = addonGate(ADDON_IDS.BUDGET);

function parseId(value: string | string[]): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * The budget resource templates (items, per person, settlement), split out of
 * budget.mcp.ts so the tools file stays under the size gate. Same gates as the
 * tools: the budget addon, then the `budget:read` scope.
 */
@McpController()
export class BudgetResourcesMcp {
  constructor(
    private readonly budget: BudgetService,
    private readonly exchangeRates: ExchangeRatesService,
    // Read by the addon gate of every resource here.
    readonly addons: AddonsService,
    @InjectRepository(Trips) private readonly trips: TripsRepository,
  ) {}

  @ResourceTemplate({
    name: 'trip-budget',
    uriTemplate: 'trek://trips/{tripId}/budget',
    description: 'Budget and expense items for a trip',
    mimeType: 'application/json',
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'read' },
  })
  async tripBudgetResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
    const id = parseId(tripId);
    if (id === null || !(await this.budget.verifyTripAccess(id, ctx.userId))) {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify({ error: 'Trip not found or access denied' }),
          },
        ],
      };
    }
    const items = await this.budget.listBudgetItems(id);
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(items, null, 2),
        },
      ],
    };
  }

  @ResourceTemplate({
    name: 'trip-budget-per-person',
    uriTemplate: 'trek://trips/{tripId}/budget/per-person',
    description: 'Per-person budget summary for a trip (total spent per member, split breakdown)',
    mimeType: 'application/json',
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'read' },
  })
  async tripBudgetPerPersonResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
    const id = parseId(tripId);
    if (id === null || !(await this.budget.verifyTripAccess(id, ctx.userId))) {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify({ error: 'Trip not found or access denied' }),
          },
        ],
      };
    }
    // In the trip currency, each share at the rate its expense was booked at (#2525).
    const summary = await this.budget.perPersonSummary(id);
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  }

  @ResourceTemplate({
    name: 'trip-budget-settlement',
    uriTemplate: 'trek://trips/{tripId}/budget/settlement',
    description: 'Suggested settlement transactions to balance who owes whom',
    mimeType: 'application/json',
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'read' },
  })
  async tripBudgetSettlementResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
    const id = parseId(tripId);
    if (id === null || !(await this.budget.verifyTripAccess(id, ctx.userId))) {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify({ error: 'Trip not found or access denied' }),
          },
        ],
      };
    }
    // Resolve the trip currency + live rates like get_settlement_summary — the
    // legacy resource called calculateSettlement(id) bare, silently netting a
    // non-EUR trip in EUR with no FX conversion.
    const currency = await this.trips.getCurrency(id);
    const tripCurrency = currency || 'EUR';
    const effectiveBase = tripCurrency.toUpperCase();
    const rates = await this.exchangeRates.getRates(effectiveBase);
    const settlement = await this.budget.calculateSettlement(id, { base: effectiveBase, rates, tripCurrency });
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(settlement, null, 2),
        },
      ],
    };
  }
}
