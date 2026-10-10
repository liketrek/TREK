import { Trips } from '../../db/entities/Trips.entity';
import { AddonsModule } from '../addons/addons.module';
import { BookingImportModule } from '../booking-import/booking-import.module';
import { LlmParseModule } from '../llm-parse/llm-parse.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { ReceiptScanController } from './receipt-scan.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/** The Costs tab's receipt scan: an HTTP surface over the import job queue. */
@Module({
  imports: [
    TripMembershipModule,
    MikroOrmModule.forFeature([Trips]),
    BookingImportModule,
    LlmParseModule,
    AddonsModule,
    PermissionsModule,
  ],
  controllers: [ReceiptScanController],
})
export class ReceiptScanModule {}
