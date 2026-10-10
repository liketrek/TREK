import { createZodDto } from 'nestjs-zod';
import { adminOidcUpdateRequestSchema } from '@trek/shared';

/** Body of the admin OIDC settings route OidcController serves. */
export class AdminOidcUpdateDto extends createZodDto(adminOidcUpdateRequestSchema) {}
