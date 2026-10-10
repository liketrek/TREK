import type { SchemaVersion } from '../entities/SchemaVersion.entity';
import { TrekRepository } from './_shared/trek-repository';

export class SchemaVersionRepository extends TrekRepository<SchemaVersion> {}
