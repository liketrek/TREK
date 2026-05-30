import { Module } from '@nestjs/common';
import { DaysController } from './days.controller';
import { DaysService } from './days.service';
import { DayNotesController } from './day-notes.controller';
import { DayNotesService } from './day-notes.service';

/**
 * Days + day-notes domain (S6 — Phase 2 trip sub-domain). The single prefix
 * /api/trips/:tripId/days covers both the days mount and the nested
 * /days/:dayId/notes mount.
 */
@Module({
  controllers: [DaysController, DayNotesController],
  providers: [DaysService, DayNotesService],
})
export class DaysModule {}
