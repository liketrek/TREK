import { toRowId } from '../common/row-id';
import type { OriginSnapshot, OriginWriter } from './place-origins.helpers';
import { PlaceOriginsService } from './place-origins.service';
import {
  applyDecorators,
  Injectable,
  SetMetadata,
  UseInterceptors,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { placeFieldOriginsSchema } from '@trek/shared';

import type { Request } from 'express';
import { mergeMap, type Observable } from 'rxjs';

/**
 * What a place route writes, for its origin tracking:
 * - `client`: a create or update from the app, which reports `fieldOrigins`;
 * - `upload`: the user's own picture for the place;
 * - `attachment`: a trip file made the picture;
 * - `import`: new places from a file or a shared list.
 */
type PlaceOriginRoute = 'client' | 'upload' | 'attachment' | 'import';

const ROUTE_KEY = 'trekPlaceOriginRoute';

/** Records where the shareable details a place route wrote came from, once the route answered. */
export function TrackPlaceOrigins(route: PlaceOriginRoute): MethodDecorator {
  return applyDecorators(SetMetadata(ROUTE_KEY, route), UseInterceptors(PlaceOriginsInterceptor));
}

/**
 * The REST side of the origin tracking. It reads the place's values before
 * the handler runs and records what changed after it answered, so the
 * controller's routes stay as they are, and an offline replay, which goes
 * through the same routes, is recorded the same way. A handler that throws
 * records nothing.
 */
@Injectable()
export class PlaceOriginsInterceptor implements NestInterceptor {
  constructor(
    private readonly origins: PlaceOriginsService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const route = this.reflector.get<PlaceOriginRoute | undefined>(ROUTE_KEY, context.getHandler()) ?? 'client';
    const req = context.switchToHttp().getRequest<Request>();
    const placeId = route === 'import' ? null : toRowId(req.params?.id);
    const before = placeId === null ? null : await this.origins.valuesBefore(placeId);
    return next.handle().pipe(
      mergeMap(async (body: unknown) => {
        await this.recordAnswer(route, { body, before, claims: req.body as unknown });
        return body;
      }),
    );
  }

  private async recordAnswer(
    route: PlaceOriginRoute,
    answer: { body: unknown; before: OriginSnapshot | null; claims: unknown },
  ): Promise<void> {
    if (route === 'import') {
      await this.origins.recordImported(idsOf((answer.body as { places?: unknown } | null)?.places));
      return;
    }
    const id = idsOf([(answer.body as { place?: unknown } | null)?.place])[0];
    if (id === undefined) return;
    await this.origins.record(id, answer.before, writerFor(route, answer.claims));
  }
}

function writerFor(route: Exclude<PlaceOriginRoute, 'import'>, body: unknown): OriginWriter {
  // A picture route writes the picture only; whatever else changed while it ran keeps its own origin.
  if (route === 'upload') return { kind: 'fixed', origin: 'user', field: 'image' };
  if (route === 'attachment') return { kind: 'fixed', origin: 'attachment', field: 'image' };
  // The pipe has refused a malformed body before the handler ran; this reads the same field again.
  const parsed = placeFieldOriginsSchema.safeParse((body as { fieldOrigins?: unknown } | null)?.fieldOrigins);
  return { kind: 'client', claims: parsed.success ? parsed.data : undefined };
}

/** The ids of the places in an answer. */
function idsOf(places: unknown): number[] {
  if (!Array.isArray(places)) return [];
  return places
    .map((place: unknown) => (place as { id?: unknown } | null)?.id)
    .filter((id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0);
}
