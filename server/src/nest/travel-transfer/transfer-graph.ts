import { TravelTransferOperations } from '../../db/entities/TravelTransferOperations.entity';
import { TRANSFER_GRAPH } from '../../db/json-columns';
import { TravelTransferOperationsRepository } from '../../db/repositories/TravelTransferOperations.repository';
import { decodeJson } from '../../utils/json-column';
import { TransferNative } from './transfer-native';
import { TransferNativeFiles, type HashedNativeFile } from './transfer-native-files';
import {
  FORMAT,
  canonical,
  sha,
  selected,
  validateGraph,
  fail,
  type Graph,
  type TransferRecord,
} from './transfer-wire';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TransferGraph {
  constructor(
    @InjectRepository(TravelTransferOperations) private readonly store: TravelTransferOperationsRepository,
    private readonly native: TransferNative,
    private readonly files: TransferNativeFiles,
  ) {}
  async full(id: number, files: HashedNativeFile[] = []): Promise<Graph> {
    const trip = await this.store.trip(id);
    if (!trip) fail('Trip unavailable', 404);
    const projection = await this.native.project(id);
    const saved = await this.store.graph(id);
    const graph: Graph = saved
      ? validateGraph(decodeJson(TRANSFER_GRAPH, saved.graph))
      : {
          format: FORMAT,
          trip: String(id),
          revision: 'native',
          complete: true,
          records: [],
          originals: [],
        };
    const old = graph.records.find((r) => r.id === 'trip');
    const current = {
      title: trip.title,
      notes: trip.description ?? '',
      start_date: trip.start_date ?? null,
      end_date: trip.end_date ?? null,
      currency: trip.currency,
      trek_archived: Boolean(trip.is_archived),
    };
    const fields = old ? { ...old.fields } : current;
    const states = { ...old?.source.fields };
    const cost = graph.records.find((r) => r.kind === 'cost_settings');
    if (!saved) {
      graph.records.push({
        id: 'cost_settings:root',
        kind: 'cost_settings',
        visibility: 'trip',
        fields: { currency: trip.currency ?? 'EUR', exponent: 2 },
        references: {},
        source: {
          provider: 'trek',
          fields: { currency: trip.currency === null ? 'unknown' : 'present', exponent: 'present' },
        },
      });
    }
    if (old) {
      const projected = this.rootFields(graph);
      if (cost && projected.currency !== trip.currency) {
        cost.fields.currency = trip.currency ?? 'EUR';
        cost.source.fields.currency = trip.currency === null ? 'unknown' : 'present';
        cost.fields.exponent = 2;
        cost.source.fields.exponent = 'present';
      }
      const prior = {
        title: projected.title,
        notes: projected.description ?? '',
        start_date: projected.start_date,
        end_date: projected.end_date,
        currency: projected.currency,
        trek_archived: Boolean(projected.is_archived),
      };
      for (const key of Object.keys(current) as (keyof typeof current)[]) {
        if (prior[key] !== current[key]) {
          fields[key] = current[key];
          states[key] = 'present';
        }
      }
    }
    const root: TransferRecord = {
      id: 'trip',
      kind: 'trip',
      fields,
      references: old?.references ?? {},
      visibility: 'trip',
      source: {
        ...old?.source,
        fields: { ...Object.fromEntries(Object.keys(fields).map((k) => [k, 'present' as const])), ...states },
      },
    };
    graph.records = [root, ...graph.records.filter((r) => r.id !== 'trip')];
    graph.trip = String(id);
    return validateGraph(
      this.files.enrich(this.native.merge(graph, projection), this.files.sources(projection, trip.cover_image), files),
    );
  }
  async snapshot(id: number, includePrivate: boolean, files: HashedNativeFile[] = []): Promise<Graph> {
    const graph = selected(await this.full(id, files), includePrivate);
    // Revision includes native root + every retained child and selected audience.
    graph.revision = sha(canonical({ ...graph, revision: '', include_private: includePrivate }));
    return graph;
  }
  rootFields(graph: Graph) {
    const root = graph.records.find((r) => r.id === 'trip');
    if (!root) fail('Trip root missing', 422);
    const fields = root.fields;
    if (typeof fields.title !== 'string' || !fields.title.trim() || fields.title.length > 160)
      fail('Invalid trip title', 422);
    const notes = fields.notes ?? null;
    if (notes !== null && (typeof notes !== 'string' || notes.length > 2000))
      fail('Trip notes exceed native limit', 422);
    const date = (value: unknown): string | null => {
      if (value === null || value === undefined) return null;
      if (
        typeof value !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        !Number.isFinite(Date.parse(value)) ||
        new Date(value).toISOString().slice(0, 10) !== value
      )
        fail('Invalid trip date', 422);
      return value as string;
    };
    const start_date = date(fields.start_date),
      end_date = date(fields.end_date);
    if (start_date && end_date && start_date > end_date) fail('End date precedes start date', 422);
    const costs = graph.records.filter((r) => r.kind === 'cost_settings');
    if (costs.length > 1) fail('Multiple native cost settings', 422);
    const currency = costs[0]?.fields.currency ?? fields.currency ?? 'EUR';
    if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) fail('Invalid native currency', 422);
    if (fields.trek_archived !== undefined && typeof fields.trek_archived !== 'boolean')
      fail('Invalid archive flag', 422);
    return {
      title: fields.title as string,
      description: notes as string | null,
      start_date,
      end_date,
      currency,
      is_archived: Number(fields.trek_archived ?? false),
    };
  }
}
