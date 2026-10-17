import { ConfigController } from './config.controller';
import { Module } from '@nestjs/common';

/** Public config domain (L2 leaf module). Registered in AppModule. */
@Module({
  controllers: [ConfigController],
})
export class ConfigModule {}
