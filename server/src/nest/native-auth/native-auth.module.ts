import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { RateLimitModule } from '../common/rate-limit.module';
import { NativeAuthController } from './native-auth.controller';
import { NativeAuthService } from './native-auth.service';
import { InMemoryNativeHandoffStore, NativeHandoffStore } from './native-handoff.store';
import { Module } from '@nestjs/common';

/**
 * The sign-in hand-off for the native apps (/api/auth/native). The session
 * comes from AuthModule's LoginSessionService. The codes wait in this
 * process's memory; a store shared between processes would be provided here
 * instead.
 */
@Module({
  imports: [AuthModule, AuditModule, RateLimitModule],
  controllers: [NativeAuthController],
  providers: [NativeAuthService, { provide: NativeHandoffStore, useClass: InMemoryNativeHandoffStore }],
})
export class NativeAuthModule {}
