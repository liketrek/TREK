import { TravelTransferOperations } from '../../db/entities/TravelTransferOperations.entity';
import { DocSyncModule } from '../doc-sync/doc-sync.module';
import { JourneyDomainModule } from '../journey/journey-domain.module';
import { MemoriesModule } from '../memories/memories.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { StorageModule } from '../storage/storage.module';
import { TransferAuthority } from './transfer-authority';
import { TransferGraph } from './transfer-graph';
import { TransferLinkedAccess } from './transfer-linked-access';
import { TransferNative } from './transfer-native';
import { TransferNativeFiles } from './transfer-native-files';
import { TransferPhotoFiles } from './transfer-photo-files';
import { TransferRetentionJob } from './transfer-retention.job';
import { TransferStaging } from './transfer-staging';
import { TravelTransferMcp } from './travel-transfer.mcp';
import { TravelTransferService } from './travel-transfer.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    MikroOrmModule.forFeature([TravelTransferOperations]),
    StorageModule,
    DocSyncModule,
    MemoriesModule,
    JourneyDomainModule,
    SchedulingModule,
  ],
  providers: [
    TransferPhotoFiles,
    TransferRetentionJob,
    TransferLinkedAccess,
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
