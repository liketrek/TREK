import { createZodDto } from 'nestjs-zod';
import { storageConfigSchema, storageMigrationRequestSchema, storageTestRequestSchema } from '@trek/shared';

/**
 * createZodDto wrappers over the @trek/shared storage contracts — the global
 * ZodValidationPipe (APP_PIPE) validates @Body() params typed with these, and
 * validate-body-contracts.ts refuses boot for any unwrapped mutation body.
 */
export class StorageConfigDto extends createZodDto(storageConfigSchema) {}
export class StorageTestRequestDto extends createZodDto(storageTestRequestSchema) {}
export class StorageMigrationRequestDto extends createZodDto(storageMigrationRequestSchema) {}
