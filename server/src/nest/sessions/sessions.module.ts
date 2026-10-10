import { UserSessions } from '../../db/entities/UserSessions.entity';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { SessionPurgeJob } from './session-purge.job';
import { SessionsService } from './sessions.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Session tokens and the rows that let them be revoked. A leaf: it imports no
 * other domain module, so auth (sign-in, logout, the session list), oidc
 * (sign-in) and admin (resets) can all import it without a cycle. The routes
 * over it live in auth, beside the other /api/auth account routes.
 */
@Module({
  imports: [SchedulingModule, MikroOrmModule.forFeature([UserSessions])],
  providers: [SessionsService, SessionPurgeJob],
  exports: [SessionsService],
})
export class SessionsModule {}
