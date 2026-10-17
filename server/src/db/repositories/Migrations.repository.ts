import type { Migrations } from '../entities/Migrations.entity';
import { TrekRepository } from './_shared/trek-repository';

export class MigrationsRepository extends TrekRepository<Migrations> {}
