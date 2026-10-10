import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { McpTokens } from '../../db/entities/McpTokens.entity';
import { Users } from '../../db/entities/Users.entity';
import { TokenService } from './token.service';
import { EphemeralTokenModule } from '../auth-core/ephemeral-token.module';

/**
 * Tokens that are not the login JWT: the long-lived MCP tokens a user manages
 * in settings, plus the short-lived ws and download tokens.
 *
 * A leaf module on purpose. It needs nothing but its own two repositories,
 * which keeps it cheap to import — AuthModule, AdminModule and the MCP
 * transport all reach for it, and any dependency added here lands in all
 * three graphs. `forFeature([McpTokens, Users])` resolves `TokenService`'s
 * `@InjectRepository`s from THIS module's own graph regardless of who
 * imports `TokensModule` (Plan 3b Task 1's guard-injection blast-radius
 * reasoning does not apply here: that was about a class Nest instantiates by
 * reference from `@UseGuards()`, resolved from the HOST CONTROLLER's module;
 * `TokenService` is an ordinary provider declared in this module's own
 * `providers`, so its constructor dependencies resolve from this module's
 * own `imports`, exactly like any other Nest provider).
 */
@Module({
  imports: [EphemeralTokenModule, MikroOrmModule.forFeature([McpTokens, Users])],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokensModule {}
