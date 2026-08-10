import { Module } from '@nestjs/common';
import { AdminOidcController, OidcController } from './oidc.controller';
import { AuditModule } from '../audit/audit.module';
import { OidcService } from './oidc.service';
import { AuthModule } from '../auth/auth.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';

@Module({
  imports: [AuthModule, TripMembershipModule, AuditModule],
  controllers: [OidcController, AdminOidcController],
  providers: [OidcService],
})
export class OidcModule {}
