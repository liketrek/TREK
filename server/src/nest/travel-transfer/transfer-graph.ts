import { TravelTransferOperations } from '../../db/entities/TravelTransferOperations.entity';
import { TRANSFER_GRAPH } from '../../db/json-columns';
import { TravelTransferOperationsRepository } from '../../db/repositories/TravelTransferOperations.repository';
import { decodeJson } from '../../utils/json-column';
import { canonical, sha, selected, validateGraph, fail, type Graph, type TransferRecord } from './transfer-wire';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TransferGraph {
  constructor(@InjectRepository(TravelTransferOperations) private readonly store: TravelTransferOperationsRepository) {}
  async full(id: number): Promise<Graph> {
    const unsupported = await this.store.unprojectedDomain(id);
    if (unsupported) fail(`Native ${unsupported} transfer projection is not supported yet. No data was omitted.`, 422);
    const trip = await this.store.trip(id);
    if (!trip) fail('Trip unavailable', 404);
    const saved = await this.store.graph(id);
    if (!saved) fail('Native trip transfer projection is not supported yet. No data was omitted.', 422);
    // The initial projector writes only title/notes/dates. Refuse later native
    // settings edits rather than presenting the saved graph as their export.
    if (trip.currency !== 'EUR' || trip.cover_image != null || trip.is_archived !== 0 || trip.reminder_days !== 0)
      fail('Native trip settings projection is not supported yet. No data was omitted.', 422);
    const graph: Graph = validateGraph(decodeJson(TRANSFER_GRAPH, saved.graph));
    const old = graph.records.find((r) => r.id === 'trip');
    const current = {
      title: trip.title,
      notes: trip.description ?? null,
      start_date: trip.start_date ?? null,
      end_date: trip.end_date ?? null,
    };
    const fields = old ? { ...old.fields } : current;
    const states = { ...old?.source.fields };
    if (old) {
      const projected = this.rootFields(graph);
      const prior = {
        title: projected.title,
        notes: projected.description,
        start_date: projected.start_date,
        end_date: projected.end_date,
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
    return validateGraph(graph);
  }
  async snapshot(id: number, includePrivate: boolean): Promise<Graph> {
    const graph = selected(await this.full(id), includePrivate);
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
    return { title: fields.title as string, description: notes as string | null, start_date, end_date };
  }
}
