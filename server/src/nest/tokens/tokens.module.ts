import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { EphemeralTokenModule } from '../auth/ephemeral-token.module';

/**
 * Tokens that are not the login JWT: the long-lived MCP tokens a user manages
 * in settings, plus the short-lived ws and download tokens.
 *
 * A leaf module on purpose. It needs nothing but DatabaseService, which keeps
 * it cheap to import — AuthModule, AdminModule and the MCP transport all reach
 * for it, and any dependency added here lands in all three graphs.
 */
@Module({
  imports: [EphemeralTokenModule],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokensModule {}
