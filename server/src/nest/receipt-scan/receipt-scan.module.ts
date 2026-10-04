import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Trips } from '../../db/entities/Trips.entity';
import { ReceiptScanController } from './receipt-scan.controller';
import { BookingImportModule } from '../booking-import/booking-import.module';
import { LlmParseModule } from '../llm-parse/llm-parse.module';
import { AddonsModule } from '../addons/addons.module';
import { PermissionsModule } from '../permissions/permissions.module';

/** The Costs tab's receipt scan: an HTTP surface over the import job queue. */
@Module({
  imports: [MikroOrmModule.forFeature([Trips]), BookingImportModule, LlmParseModule, AddonsModule, PermissionsModule],
  controllers: [ReceiptScanController],
})
export class ReceiptScanModule {}
