import { Module } from '@nestjs/common';
import { PluginsController } from './plugins.controller';
import { PluginsFeedController } from './plugins-feed.controller';
import { PluginsProxyController } from './plugins-proxy.controller';
import { PluginFrameController } from './plugin-frame.controller';
import { PlaceDetailsController } from './place-details.controller';
import { TripWarningsController } from './trip-warnings.controller';
import { ViewContributionsController } from './view-contributions.controller';
import { TripCardContributionsController } from './trip-card-contributions.controller';
import { PluginPhotosController } from './plugin-photos.controller';
import { PluginCalendarController } from './plugin-calendar.controller';
import { MapMarkersController } from './map-markers.controller';
import { PluginActivityController } from './plugin-activity.controller';
import { PdfSectionsController } from './pdf-sections.controller';
import { AtlasLayersController } from './atlas-layers.controller';
import { JournalEntryRowsController } from './journal-entry-rows.controller';
import { PluginUserSettingsController } from './plugin-user-settings.controller';
import { PluginOAuthController } from './plugin-oauth.controller';
import { PluginOAuthService } from './plugin-oauth.service';
import { PluginsService } from './plugins.service';
import { PluginRuntimeService } from './plugin-runtime.service';
import { PluginRegistryService } from './registry/registry.service';

/**
 * Plugin system (#plugins). M0 read side + M2 isolated runtime + M3 frontend:
 * the runtime service owns the process supervisor and boots active plugins on
 * startup; the proxy forwards /api/plugins/:id/* to the child; the feed lists
 * active plugins for the client; the frame controller serves sandboxed page/
 * widget assets at /plugin-frame/:id/*.
 */
@Module({
  controllers: [PluginsController, PluginsFeedController, PluginsProxyController, PluginFrameController, PlaceDetailsController, TripWarningsController, ViewContributionsController, TripCardContributionsController, PluginPhotosController, PluginCalendarController, MapMarkersController, PdfSectionsController, AtlasLayersController, JournalEntryRowsController, PluginUserSettingsController, PluginOAuthController, PluginActivityController],
  providers: [PluginsService, PluginRuntimeService, PluginRegistryService, PluginOAuthService],
  // Exported so the admin addon-toggle handler can cascade-disable plugins whose
  // required addon was just turned off (#plugins dependencies).
  exports: [PluginRuntimeService],
})
export class PluginsModule {}
