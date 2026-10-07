import { AppSettings } from '../../db/entities/AppSettings.entity';
import { InviteTokens } from '../../db/entities/InviteTokens.entity';
import { Users } from '../../db/entities/Users.entity';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
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
  providers: [OidcService],
})
export class OidcModule {}
