import { Users } from '../../db/entities/Users.entity';
import { UserLookupService } from './user-lookup.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/** A leaf module handing UserLookupService out; it imports no domain. */
@Module({
  imports: [MikroOrmModule.forFeature([Users])],
  providers: [UserLookupService],
  exports: [UserLookupService],
})
export class UserLookupModule {}
