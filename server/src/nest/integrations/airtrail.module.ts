import { Module } from '@nestjs/common';
import { AirtrailController } from './airtrail.controller';

/**
 * AirTrail integration domain — mounted at /api/integrations/airtrail.
 * Business logic lives in services/airtrail/* (plain functions over
 * better-sqlite3), so the module only wires the controller.
 */
@Module({
  controllers: [AirtrailController],
})
export class AirtrailModule {}
