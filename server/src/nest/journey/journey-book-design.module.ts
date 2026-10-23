import { JourneyBookRevisions } from '../../db/entities/JourneyBookRevisions.entity';
import { JourneyEntryPhotos } from '../../db/entities/JourneyEntryPhotos.entity';
import { JourneyPhotos } from '../../db/entities/JourneyPhotos.entity';
import { AddonsModule } from '../addons/addons.module';
import { PhotoSignalsModule } from '../photos/photo-signals.module';
import { JourneyBookDesignController } from './journey-book-design.controller';
import { JourneyBookDesignMcp } from './journey-book-design.mcp';
import { JourneyBookDesignService } from './journey-book-design.service';
import { JourneyBookModule } from './journey-book.module';
import { JourneyDomainModule } from './journey-domain.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * The assistant designs the whole photo book: `design_book` and its draft,
 * the proposal card's routes over that draft, and the apply that writes it as
 * one change (journey-studio-wp13.md 6). The book itself, its edit engine
 * and the draft store come from JourneyBookModule; the pixel signals from
 * PhotoSignalsModule.
 */
@Module({
  imports: [
    AddonsModule,
    JourneyDomainModule,
    JourneyBookModule,
    PhotoSignalsModule,
    // The gallery the apply checks photos against, which photos each entry shows, and the revisions an undo reads.
    MikroOrmModule.forFeature([JourneyPhotos, JourneyEntryPhotos, JourneyBookRevisions]),
  ],
  controllers: [JourneyBookDesignController],
  providers: [JourneyBookDesignService, JourneyBookDesignMcp],
})
export class JourneyBookDesignModule {}
