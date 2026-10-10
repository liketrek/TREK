import { adminOidcUpdateRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

/** Body of the admin OIDC settings route OidcController serves. */
export class AdminOidcUpdateDto extends createZodDto(adminOidcUpdateRequestSchema) {}
