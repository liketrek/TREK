import { JourneyBookRevisions } from '../../db/entities/JourneyBookRevisions.entity';
import { JourneyBooks } from '../../db/entities/JourneyBooks.entity';
import { JourneyEntries } from '../../db/entities/JourneyEntries.entity';
import { JourneyEntryPhotos } from '../../db/entities/JourneyEntryPhotos.entity';
import { JourneyPhotos } from '../../db/entities/JourneyPhotos.entity';
import { AddonsModule } from '../addons/addons.module';
import { PhotoSignalsModule } from '../photos/photo-signals.module';
import { SettingsModule } from '../settings/settings.module';
import { BookDesignDraftStore, InMemoryBookDesignDraftStore } from './book-design-draft.store';
import { JourneyAiPhotosService } from './journey-ai-photos.service';
import { JourneyBookEditService } from './journey-book-edit.service';
import { JourneyBookPhotosMcp } from './journey-book-photos.mcp';
import { JourneyBookPhotosService } from './journey-book-photos.service';
import { JourneyBookMcp } from './journey-book.mcp';
import { JourneyBookService } from './journey-book.service';
import { JourneyDomainModule } from './journey-domain.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * TREK Studio books: storing them (`JourneyBookService`, the REST routes in
 * journey.controller.ts) and changing them page by page through the shared
 * edit engine (`JourneyBookEditService`, the MCP tools in journey-book.mcp.ts),
 * and picking photos for it from the gallery (`JourneyBookPhotosService`,
 * `suggest_book_photos`, on the pixel signals of PhotoSignalsModule).
 *
 * The storing and the editing service are exported: the journey controller
 * saves through the first, and the assistant's Studio chat reads and writes
 * through both. So is `JourneyAiPhotosService`, which tells the assistant
 * which photos a page image may show.
 */
@Module({
  imports: [
    AddonsModule,
    JourneyDomainModule,
    PhotoSignalsModule,
    // The user's language, for the words travel elements print.
    SettingsModule,
    // JB1-JB7, the gallery and entries the edit engine checks ids against, and which photos each entry shows;
    // the revisions a whole-book design keeps for its undo.
    MikroOrmModule.forFeature([JourneyBooks, JourneyBookRevisions, JourneyPhotos, JourneyEntries, JourneyEntryPhotos]),
  ],
  providers: [
    JourneyAiPhotosService,
    JourneyBookService,
    JourneyBookEditService,
    JourneyBookMcp,
    JourneyBookPhotosService,
    JourneyBookPhotosMcp,
    // The assistant's whole-book design drafts (journey-book-design.module.ts reads and writes them too).
    { provide: BookDesignDraftStore, useClass: InMemoryBookDesignDraftStore },
  ],
  exports: [JourneyAiPhotosService, JourneyBookService, JourneyBookEditService, BookDesignDraftStore],
})
export class JourneyBookModule {}
