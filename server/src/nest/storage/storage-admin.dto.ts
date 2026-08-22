import { createZodDto } from 'nestjs-zod';
import { storageConfigPutSchema, storageMigrationRequestSchema, storageTestRequestSchema } from '@trek/shared';

/**
 * createZodDto wrappers over the @trek/shared storage contracts — the global
 * ZodValidationPipe (APP_PIPE) validates @Body() params typed with these, and
 * validate-body-contracts.ts refuses boot for any unwrapped mutation body.
 * The PUT body is storageConfigPutSchema (config + optimistic-concurrency
 * `version`, audit #7) — storageConfigSchema alone still backs the seed file.
 */
export class StorageConfigDto extends createZodDto(storageConfigPutSchema) {}
export class StorageTestRequestDto extends createZodDto(storageTestRequestSchema) {}
export class StorageMigrationRequestDto extends createZodDto(storageMigrationRequestSchema) {}
