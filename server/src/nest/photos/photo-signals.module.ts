import { TrekPhotoSignals } from '../../db/entities/TrekPhotoSignals.entity';
import { MemoriesModule } from '../memories/memories.module';
import { InlinePhotoSignalsRunner, PHOTO_SIGNALS_RUNNER } from './photo-signals-runner';
import { PhotoSignalsService } from './photo-signals.service';
import { WorkerPhotoSignalsRunner } from './worker-photo-signals-runner';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** The worker thread where the build ships its script; the calling thread under the TypeScript sources (the tests). */
export function photoSignalsRunner(entry = join(__dirname, 'photo-signals.worker.js')) {
  return existsSync(entry) ? new WorkerPhotoSignalsRunner(entry) : new InlinePhotoSignalsRunner();
}

/**
 * What a photo's pixels say, measured once per photo off the event loop and
 * kept in `trek_photo_signals` (PhotoSignalsService). Its own module rather
 * than part of TrekPhotosModule: reading a photo's bytes needs the memories
 * resolver, and MemoriesModule imports TrekPhotosModule, so the leaf has to
 * stay a leaf.
 */
@Module({
  imports: [MemoriesModule, MikroOrmModule.forFeature([TrekPhotoSignals])],
  providers: [PhotoSignalsService, { provide: PHOTO_SIGNALS_RUNNER, useFactory: () => photoSignalsRunner() }],
  exports: [PhotoSignalsService],
})
export class PhotoSignalsModule {}
