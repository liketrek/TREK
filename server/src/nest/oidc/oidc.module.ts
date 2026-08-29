import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { AdminOidcController, OidcController } from './oidc.controller';
import { OidcService } from './oidc.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [AuthModule, TripMembershipModule, AuditModule],
  controllers: [OidcController, AdminOidcController],
  providers: [OidcService],
})
export class OidcModule {}
