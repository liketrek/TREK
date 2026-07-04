import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { attachZodBodySchemas } from '../common/api-zod';

/**
 * Swagger UI + OpenAPI spec for the REST API (#1412), gated behind
 * TREK_API_DOCS_ENABLED. Must run BEFORE app.init() — SwaggerModule.setup
 * registers Express-level routes, and a post-init Express route is
 * unreachable behind the Nest router (see bootstrap.ts).
 *
 *   /api/docs        Swagger UI (all controllers, try-it-out, auth button)
 *   /api/docs-json   raw OpenAPI 3 document (generated clients, Postman)
 *   /api/docs-yaml   same, as YAML
 *
 * The bearer button works with a plain TREK session JWT: extractToken
 * accepts `Authorization: Bearer` everywhere as the cookie fallback.
 */
export function setupApiDocs(app: INestApplication): void {
  const version: string = process.env.APP_VERSION || (require('../../../package.json') as { version: string }).version;
  const config = new DocumentBuilder()
    .setTitle('TREK API')
    .setDescription(
      'The REST API the TREK web app itself runs on. Authenticate with a session JWT — '
      + 'either the `trek_session` cookie (same browser) or an `Authorization: Bearer <jwt>` header.',
    )
    .setVersion(version)
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'session')
    .addCookieAuth('trek_session')
    .addSecurityRequirements('session')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Lift the Zod schemas the routes already validate with into the document —
  // no double annotation, every ZodValidationPipe body is documented.
  attachZodBodySchemas(app, document);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
    yamlDocumentUrl: 'api/docs-yaml',
    swaggerOptions: { persistAuthorization: true },
  });
}
