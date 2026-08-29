import { AllowedFileTypesService } from './allowed-file-types.service';
import { Module } from '@nestjs/common';

/**
 * A leaf so both upload paths can reach the extension list without importing
 * each other's domain. DatabaseModule is @Global, so this imports nothing.
 */
@Module({
  providers: [AllowedFileTypesService],
  exports: [AllowedFileTypesService],
})
export class AllowedFileTypesModule {}
