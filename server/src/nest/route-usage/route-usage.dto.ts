import { createZodDto } from 'nestjs-zod';
import { routeUsageReportRequestSchema } from '@trek/shared';

/**
 * Zod-pipe wrapper for a batch of counters. Same pattern as every other write
 * endpoint: the contract lives in @trek/shared, the class exists so a controller
 * parameter can be typed with it.
 */
export class RouteUsageReportDto extends createZodDto(routeUsageReportRequestSchema) {}
