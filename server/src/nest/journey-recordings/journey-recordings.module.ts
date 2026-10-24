import { AddonsModule } from '../addons/addons.module';
import { DawarichModule } from '../integrations/dawarich.module';
import { JourneyDomainModule } from '../journey/journey-domain.module';
import { JourneyDayImportController } from './journey-day-import.controller';
import { JourneyDayImportMcp } from './journey-day-import.mcp';
import { JourneyDayImportService } from './journey-day-import.service';
import { JourneyRecordingsController } from './journey-recordings.controller';
import { JourneyRecordingsMcp } from './journey-recordings.mcp';
import { JourneyRecordingsService } from './journey-recordings.service';
import { Module } from '@nestjs/common';

/**
 * A journey keeping the route recorded on its days (JRN-01): taking a day over
 * from the caller's Dawarich connection, its routes and its MCP tools. The
 * days themselves belong to the journey domain; this module only brings them
 * in from Dawarich, so neither of the two has to import the other. A day
 * taken over with its stays as drafts (JRN-02) lives here for the same reason.
 */
@Module({
  imports: [JourneyDomainModule, DawarichModule, AddonsModule],
  controllers: [JourneyRecordingsController, JourneyDayImportController],
  providers: [JourneyRecordingsService, JourneyRecordingsMcp, JourneyDayImportService, JourneyDayImportMcp],
})
export class JourneyRecordingsModule {}
