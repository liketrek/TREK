import { Module } from '@nestjs/common';
import { NativeAuthController } from './native-auth.controller';
import { NativeAuthService } from './native-auth.service';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { RateLimitModule } from '../common/rate-limit.module';

@Module({
  imports: [AuthModule, AuditModule, RateLimitModule],
  controllers: [NativeAuthController],
  providers: [NativeAuthService],
})
export class NativeAuthModule {}
