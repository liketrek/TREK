import { Trips } from '../db/entities/Trips.entity';
import { Users } from '../db/entities/Users.entity';
import { AddonsModule } from '../nest/addons/addons.module';
import { PermissionsModule } from '../nest/permissions/permissions.module';
import { PluginGuards } from './plugin-guards.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * A leaf module whose only job is to hand PluginGuards to the domain modules.
 *
 * It cannot live in PluginsModule: that module imports 22 domain modules, so a
 * domain importing it back to reach the guards would close a hard cycle
 * (PluginsModule -> TodoModule -> PluginsModule) and the only way out would be
 * forwardRef. PermissionsModule and AddonsModule are themselves leaves and
 * DatabaseModule is @Global, so this module imports nothing that leads back here.
 * `MikroOrmModule.forFeature([Users])` (Plan 3j Task 1 — PluginGuards' own
 * role lookup, PG3/PG4, now goes through UsersRepository) is the same kind of
 * leaf: it hands out a repository token, not a domain module, so it doesn't
 * reopen the cycle either — this module is the one that CONSTRUCTS
 * PluginGuards, so it (not each importer) owns the forFeature list.
 *
 * Same shape and same reason as MailerModule, which broke
 * AuthModule <-> NotificationsModule.
 */
@Module({
  imports: [PermissionsModule, AddonsModule, MikroOrmModule.forFeature([Users, Trips])],
  providers: [PluginGuards],
  exports: [PluginGuards],
})
export class PluginGuardsModule {}
