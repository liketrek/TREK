import { Users } from '../../db/entities/Users.entity';
import { likeAny, StorageReclaimSource } from '../storage/storage-reclaim-source.service';
import { Injectable } from '@nestjs/common';

/**
 * Tells the storage reclaim pass which avatar objects a user row still names
 * (#2924). `users.avatar` holds the bare object name of an uploaded avatar;
 * an https picture taken from the OIDC claim names no object of ours and
 * parses as nothing.
 */
@Injectable()
export class AuthStorageRefsService extends StorageReclaimSource {
  readonly id = 'auth';
  readonly claims = [{ category: 'avatars', prefix: '' }] as const;
  protected override readonly keyOptions = { bare: 'avatars' } as const;

  protected async storedValues(containing: readonly string[] | null): Promise<Array<string | null | undefined>> {
    const rows = await this.em
      .getRepository(Users)
      .find(likeAny<Users>(['avatar'], containing), { fields: ['avatar'] });
    return rows.map((row) => row.avatar);
  }
}
