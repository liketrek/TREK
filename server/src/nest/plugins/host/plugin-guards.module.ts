import { Module } from '@nestjs/common';
import { PermissionsModule } from '../../permissions/permissions.module';
import { AddonsModule } from '../../addons/addons.module';
import { PluginGuards } from './plugin-guards.service';

/**
 * A leaf module whose only job is to hand PluginGuards to the domain modules.
 *
 * It cannot live in PluginsModule: that module imports 22 domain modules, so a
 * domain importing it back to reach the guards would close a hard cycle
 * (PluginsModule -> TodoModule -> PluginsModule) and the only way out would be
 * forwardRef. PermissionsModule and AddonsModule are themselves leaves and
 * DatabaseModule is @Global, so this module imports nothing that leads back here.
 *
 * Same shape and same reason as MailerModule, which broke
 * AuthModule <-> NotificationsModule.
 */
@Module({
  imports: [PermissionsModule, AddonsModule],
  providers: [PluginGuards],
  exports: [PluginGuards],
})
export class PluginGuardsModule {}
