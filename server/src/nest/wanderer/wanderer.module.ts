import { WandererConnections } from '../../db/entities/WandererConnections.entity';
import { AddonsModule } from '../addons/addons.module';
import { AuditModule } from '../audit/audit.module';
import { WandererClient } from './wanderer.client';
import { WandererController } from './wanderer.controller';
import { WandererService } from './wanderer.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * The wanderer integration: a user's own connection to their wanderer
 * instance and the reads the Tours import builds on. Tours imports this module
 * for `WandererService`; the trip-side routes live there.
 */
@Module({
  imports: [MikroOrmModule.forFeature([WandererConnections]), AddonsModule, AuditModule],
  controllers: [WandererController],
  providers: [WandererClient, WandererService],
  exports: [WandererService],
})
export class WandererModule {}
