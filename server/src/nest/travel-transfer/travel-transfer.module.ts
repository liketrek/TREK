import { TravelTransferOperations } from '../../db/entities/TravelTransferOperations.entity';
import { StorageModule } from '../storage/storage.module';
import { TransferAuthority } from './transfer-authority';
import { TransferGraph } from './transfer-graph';
import { TransferNative } from './transfer-native';
import { TransferNativeFiles } from './transfer-native-files';
import { TransferStaging } from './transfer-staging';
import { TravelTransferMcp } from './travel-transfer.mcp';
import { TravelTransferService } from './travel-transfer.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

@Module({
  imports: [MikroOrmModule.forFeature([TravelTransferOperations]), StorageModule],
  providers: [
    TransferAuthority,
    TransferGraph,
    TransferNative,
    TransferNativeFiles,
    TransferStaging,
    TravelTransferService,
    TravelTransferMcp,
  ],
})
export class TravelTransferModule {}
