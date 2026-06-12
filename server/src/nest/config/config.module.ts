import { Module } from '@nestjs/common';
import { ConfigController } from './config.controller';

/** Public config domain (L2 leaf module). Registered in AppModule. */
@Module({
  controllers: [ConfigController],
})
export class ConfigModule {}
