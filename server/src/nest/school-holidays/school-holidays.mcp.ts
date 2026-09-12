import { HttpException } from '@nestjs/common';
import { z } from 'zod';
import { idSchema, schoolHolidayCountryRequestSchema, schoolHolidayRegionRequestSchema, type SchoolHolidayCountryRequest, type SchoolHolidayRegionRequest } from '@trek/shared';
import { McpController, Tool, type McpContext, TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_NON_IDEMPOTENT, TOOL_ANNOTATIONS_WRITE, TOOL_ANNOTATIONS_DELETE, errorResult, ok } from '../../nest-mcp';
import { adminRequired } from '../../mcp/tools/_shared';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { SchoolHolidaysService } from './school-holidays.service';

@McpController()
export class SchoolHolidaysMcp {
  constructor(private readonly holidays: SchoolHolidaysService, private readonly guards: McpToolGuardsService) {}

  private adminWrite(ctx: McpContext, write: () => unknown) {
    if (!this.guards.isAdminUser(ctx.userId)) return adminRequired();
    try { return ok(write()); }
    catch (error) {
      if (error instanceof HttpException || error instanceof z.ZodError) return errorResult(error.message);
      throw error;
    }
  }

  @Tool({
    name: 'list_manual_school_holiday_regions',
    description: 'List the global manual school holiday catalog. Use regions[].code verbatim as the region with add_holiday_calendar and type school_holiday. These calendars require no external API.',
    inputSchema: {}, annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'vacay', mode: 'read' },
  })
  catalog() { return ok(this.holidays.catalog()); }

  @Tool({
    name: 'get_manual_school_holiday_region',
    description: 'Read a manual school region, its current revision and all named holiday periods. Read before updating: updates replace the complete list of periods, and the current revision is required.',
    inputSchema: { regionId: idSchema }, annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'vacay', mode: 'read' },
  })
  region({ regionId }: { regionId: number }) { return ok(this.holidays.region(regionId)); }

  @Tool({
    name: 'list_manual_school_holidays',
    description: 'Read named school breaks for a manual region and year, including breaks spanning a year boundary. Both boundary dates are included.',
    inputSchema: { regionId: idSchema, year: z.number().int().min(1000).max(9999) },
    annotations: TOOL_ANNOTATIONS_READONLY, access: { group: 'vacay', mode: 'read' },
  })
  forYear({ regionId, year }: { regionId: number; year: number }) { return ok({ holidays: this.holidays.holidays(regionId, String(year)) }); }

  @Tool({
    name: 'create_manual_school_holiday_country',
    description: 'Admin only. Create a country in the instance-wide manual school holiday catalog with its two-letter uppercase country code and display name. Check the catalog first to avoid duplicates.',
    inputSchema: schoolHolidayCountryRequestSchema.shape, annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'vacay', mode: 'write' },
  })
  createCountry(body: SchoolHolidayCountryRequest, ctx: McpContext) {
    return this.adminWrite(ctx, () => this.holidays.createCountry(schoolHolidayCountryRequestSchema.parse(body)));
  }

  @Tool({
    name: 'create_manual_school_holiday_region',
    description: 'Admin only. Create a region or school district in an existing manual country, with named holiday periods. Use revision 0 for creation. Dates are inclusive YYYY-MM-DD. All users can select this region.',
    inputSchema: { country: schoolHolidayCountryRequestSchema.shape.code, ...schoolHolidayRegionRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT, access: { group: 'vacay', mode: 'write' },
  })
  createRegion({ country, ...body }: SchoolHolidayRegionRequest & { country: string }, ctx: McpContext) {
    return this.adminWrite(ctx, () => this.holidays.createRegion(country, schoolHolidayRegionRequestSchema.parse(body)));
  }

  @Tool({
    name: 'update_manual_school_holiday_region',
    description: 'Admin only. Rename a global school region and replace its complete list of holiday periods. First read get_manual_school_holiday_region and preserve periods that should remain. Supply its current revision; stale updates are rejected. Changes affect every calendar using this region.',
    inputSchema: { regionId: idSchema, ...schoolHolidayRegionRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_WRITE, access: { group: 'vacay', mode: 'write' },
  })
  updateRegion({ regionId, ...body }: SchoolHolidayRegionRequest & { regionId: number }, ctx: McpContext) {
    return this.adminWrite(ctx, () => this.holidays.updateRegion(regionId, schoolHolidayRegionRequestSchema.parse(body)));
  }

  @Tool({
    name: 'delete_manual_school_holiday_region',
    description: 'Admin only. Delete a global manual school region and its periods using the current revision. Regions selected by a vacation calendar cannot be deleted.',
    inputSchema: { regionId: idSchema, revision: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_DELETE, access: { group: 'vacay', mode: 'write' },
  })
  deleteRegion({ regionId, revision }: { regionId: number; revision: number }, ctx: McpContext) {
    return this.adminWrite(ctx, () => this.holidays.deleteRegion(regionId, revision));
  }

  @Tool({
    name: 'delete_manual_school_holiday_country',
    description: 'Admin only. Delete an empty country from the global manual school holiday catalog. Remove its unused regions first.',
    inputSchema: { code: schoolHolidayCountryRequestSchema.shape.code },
    annotations: TOOL_ANNOTATIONS_DELETE, access: { group: 'vacay', mode: 'write' },
  })
  deleteCountry({ code }: { code: string }, ctx: McpContext) {
    return this.adminWrite(ctx, () => this.holidays.deleteCountry(code));
  }
}
