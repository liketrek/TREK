import { FerrataTiles } from '../../db/entities/FerrataTiles.entity';
import { OverpassModule } from '../overpass/overpass.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { FerratasController } from './ferratas.controller';
import { FerratasService } from './ferratas.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Via ferratas around a trip, read from OpenStreetMap through Overpass.
 * PermissionsModule brings TripAccessGuard; OverpassModule the client that asks
 * the operator's Overpass mirrors. The answers
 * are kept per grid cell in `ferrata_tiles`; UnitOfWork and MikroORM come from
 * the global OrmModule.
 */
@Module({
  imports: [PermissionsModule, OverpassModule, MikroOrmModule.forFeature([FerrataTiles])],
  controllers: [FerratasController],
  providers: [FerratasService],
})
export class FerratasModule {}
