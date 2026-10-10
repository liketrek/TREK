import { AppSettings } from '../../db/entities/AppSettings.entity';
import { InviteTokens } from '../../db/entities/InviteTokens.entity';
import { Users } from '../../db/entities/Users.entity';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { InMemoryOidcFlowStore, OidcFlowStore } from './oidc-flow.store';
import { AdminOidcController, OidcController } from './oidc.controller';
import { OidcService } from './oidc.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    AuthModule,
    TripMembershipModule,
    AuditModule,
    MikroOrmModule.forFeature([Users, InviteTokens, AppSettings]),
  ],
  controllers: [OidcController, AdminOidcController],
  // The login states and codes stay in this process's memory; a store shared
  // between processes would be provided here instead.
  providers: [OidcService, { provide: OidcFlowStore, useClass: InMemoryOidcFlowStore }],
})
export class OidcModule {}
