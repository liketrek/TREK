import { FerrataTiles } from '../../db/entities/FerrataTiles.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { FerratasOverpassClient } from './ferratas-overpass.client';
import { FerratasController } from './ferratas.controller';
import { FerratasService } from './ferratas.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Via ferratas around a trip, read from OpenStreetMap through Overpass.
 * PermissionsModule brings TripAccessGuard; RuntimeEnvService (the Overpass
 * endpoints and deadline) comes from the global AppConfigModule. The answers
 * are kept per grid cell in `ferrata_tiles`; UnitOfWork and MikroORM come from
 * the global OrmModule.
 */
@Module({
  imports: [PermissionsModule, MikroOrmModule.forFeature([FerrataTiles])],
  controllers: [FerratasController],
  providers: [FerratasService, FerratasOverpassClient],
})
export class FerratasModule {}
