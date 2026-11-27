import { AppSettings } from '../../db/entities/AppSettings.entity';
import { InviteTokens } from '../../db/entities/InviteTokens.entity';
import { Users } from '../../db/entities/Users.entity';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { RateLimitModule } from '../common/rate-limit.module';
import { SessionsModule } from '../sessions/sessions.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { OidcBackchannelController } from './oidc-backchannel.controller';
import { OidcBackchannelService } from './oidc-backchannel.service';
import { InMemoryOidcFlowStore, OidcFlowStore } from './oidc-flow.store';
import { InMemoryOidcLogoutReplayStore, OidcLogoutReplayStore } from './oidc-logout-replay.store';
import { AdminOidcController, OidcController } from './oidc.controller';
import { OidcService } from './oidc.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    AuthModule,
    TripMembershipModule,
    AuditModule,
    RateLimitModule,
    SessionsModule,
    MikroOrmModule.forFeature([Users, InviteTokens, AppSettings]),
  ],
  controllers: [OidcController, OidcBackchannelController, AdminOidcController],
  // The login states and codes, and the logout tokens already acted on, stay in
  // this process's memory; stores shared between processes would be provided
  // here instead.
  providers: [
    OidcService,
    OidcBackchannelService,
    { provide: OidcFlowStore, useClass: InMemoryOidcFlowStore },
    { provide: OidcLogoutReplayStore, useFactory: () => new InMemoryOidcLogoutReplayStore() },
  ],
  // The AI assistant checks a ChatGPT sign-in's ID token with the same verifier.
  exports: [OidcService],
})
export class OidcModule {}
