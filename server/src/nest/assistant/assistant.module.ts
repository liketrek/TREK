import { AssistantMessages } from '../../db/entities/AssistantMessages.entity';
import { AssistantThreads } from '../../db/entities/AssistantThreads.entity';
import { AssistantToolCalls } from '../../db/entities/AssistantToolCalls.entity';
import { AddonsModule } from '../addons/addons.module';
import { AiConnectionsModule } from '../ai-connections/ai-connections.module';
import { AirportsModule } from '../airports/airports.module';
import { AuditModule } from '../audit/audit.module';
import { BookingImportModule } from '../booking-import/booking-import.module';
import { CollabModule } from '../collab/collab.module';
import { RateLimitModule } from '../common/rate-limit.module';
import { JourneyBookModule } from '../journey/journey-book.module';
import { JourneyDomainModule } from '../journey/journey-domain.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PhotoSignalsModule } from '../photos/photo-signals.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { SettingsModule } from '../settings/settings.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { AssistantAttachmentsController } from './assistant-attachments.controller';
import { AssistantBookContext } from './assistant-book-context';
import { AssistantBookGate } from './assistant-book-gate';
import { AssistantBookingImportService } from './assistant-booking-import.service';
import { AssistantFoundPlacesService } from './assistant-found-places.service';
import { AssistantProposalsService } from './assistant-proposals.service';
import { AssistantRenderRegistry, InMemoryAssistantRenderRegistry } from './assistant-render.registry';
import { AssistantRendersController } from './assistant-renders.controller';
import { AssistantRetentionJob } from './assistant-retention.job';
import { AssistantScopes } from './assistant-scope';
import { AssistantShareService } from './assistant-share.service';
import { AssistantStreamRegistry, InMemoryAssistantStreamRegistry } from './assistant-stream.registry';
import { AssistantToolsService } from './assistant-tools.service';
import { AssistantVision } from './assistant-vision';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { AssistantCardContext } from './cards/card-context';
import { JourneyAssistantController } from './journey-assistant.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * The trip assistant: conversations about a trip, answered by the language
 * model the user's connection reaches (AiConnectionsModule), working the trip
 * through the MCP tools of the global registry. A file attached in the chat
 * is read through the booking import, and an answer shared in the trip's
 * chat is posted through the collab chat. A card names an airport through the
 * airports' data. Its conversations are kept per user and trip and swept by
 * the retention job.
 *
 * The same assistant talks about a journey in TREK Studio
 * (JourneyAssistantController): its book's tools come from the registry
 * like any others, and the book card is read through the journey domain and
 * the book's edit service (JourneyDomainModule, JourneyBookModule), its
 * gallery in numbers through the photo signals (PhotoSignalsModule). Its
 * book writes are tried on the stored book before the user sees them
 * (AssistantBookGate, through the same edit service). A Studio turn may look
 * at a page as the Studio draws it (AssistantVision): the Studio tab uploads
 * the page to AssistantRendersController, which hands it to the waiting turn
 * through AssistantRenderRegistry, only the user's own photos drawn.
 */
@Module({
  imports: [
    AddonsModule,
    AiConnectionsModule,
    AirportsModule,
    AuditModule,
    BookingImportModule,
    CollabModule,
    JourneyBookModule,
    JourneyDomainModule,
    McpSharedModule,
    PermissionsModule,
    PhotoSignalsModule,
    RateLimitModule,
    SchedulingModule,
    SettingsModule,
    TripMembershipModule,
    MikroOrmModule.forFeature([AssistantThreads, AssistantMessages, AssistantToolCalls]),
  ],
  controllers: [
    AssistantController,
    AssistantAttachmentsController,
    JourneyAssistantController,
    AssistantRendersController,
  ],
  // The running turns and the page images they wait for stay in this
  // process's memory; registries shared between processes would be provided
  // here instead.
  providers: [
    AssistantService,
    AssistantToolsService,
    AssistantBookingImportService,
    AssistantFoundPlacesService,
    AssistantProposalsService,
    AssistantShareService,
    AssistantRetentionJob,
    AssistantCardContext,
    AssistantScopes,
    AssistantBookContext,
    AssistantBookGate,
    AssistantVision,
    { provide: AssistantStreamRegistry, useClass: InMemoryAssistantStreamRegistry },
    { provide: AssistantRenderRegistry, useClass: InMemoryAssistantRenderRegistry },
  ],
})
export class AssistantModule {}
