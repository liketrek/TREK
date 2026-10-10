import { Module } from '@nestjs/common';
import { EphemeralTokenService } from './ephemeral-token.service';

/**
 * A leaf module whose only job is to hand EphemeralTokenService out.
 *
 * It cannot live in AuthModule: TokensModule mints download and ws tokens too,
 * and AuthModule already imports TokensModule, so importing it back would close
 * a cycle. TokensModule is also documented as a deliberate leaf that three
 * graphs reach for, so a dependency added there lands in all of them.
 *
 * Same shape and same reason as MailerModule, which broke
 * AuthModule <-> NotificationsModule, and PluginGuardsModule.
 */
@Module({
  providers: [EphemeralTokenService],
  exports: [EphemeralTokenService],
})
export class EphemeralTokenModule {}
