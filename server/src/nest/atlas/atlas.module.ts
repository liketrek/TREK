import { Module } from '@nestjs/common';
import { AtlasController } from './atlas.controller';
import { AtlasService } from './atlas.service';

/** Atlas addon domain (L7 leaf module). Registered in AppModule. */
@Module({
  controllers: [AtlasController],
  providers: [AtlasService],
})
export class AtlasModule {}
