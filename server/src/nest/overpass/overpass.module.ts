import { OverpassElementsClient } from './overpass-elements.service';
import { Module } from '@nestjs/common';

/**
 * The Overpass client shared by the domains that read OpenStreetMap elements
 * themselves. RuntimeEnvService (the mirrors and the deadline) comes from the
 * global AppConfigModule.
 */
@Module({
  providers: [OverpassElementsClient],
  exports: [OverpassElementsClient],
})
export class OverpassModule {}
