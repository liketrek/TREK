import { Module } from '@nestjs/common';
import { OidcController } from './oidc.controller';
import { OidcService } from './oidc.service';
import { AuthModule } from '../auth/auth.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';

@Module({
  imports: [AuthModule, TripMembershipModule],
  controllers: [OidcController],
  providers: [OidcService],
})
export class OidcModule {}
