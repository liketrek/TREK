import { Module } from '@nestjs/common';
import { OidcController } from './oidc.controller';
import { OidcService } from './oidc.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OidcController],
  providers: [OidcService],
})
export class OidcModule {}
