import { TravelTransferOperations } from '../../db/entities/TravelTransferOperations.entity';
import { TransferAuthority } from './transfer-authority';
import { TransferGraph } from './transfer-graph';
import { TransferStaging } from './transfer-staging';
import { TravelTransferMcp } from './travel-transfer.mcp';
import { TravelTransferService } from './travel-transfer.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

@Module({
  imports: [MikroOrmModule.forFeature([TravelTransferOperations])],
  providers: [TransferAuthority, TransferGraph, TransferStaging, TravelTransferService, TravelTransferMcp],
})
export class TravelTransferModule {}
