import { buildRegionGraph, type BuiltWaterGraph, WaterCollector } from '../paddle-routing/water-graph.contract';
import { extractPaddleFeatures, type ExtractedFeature } from './paddle-extract';

export type ImportPhase = 'read' | 'build';

export interface ImportOutcome {
  timestamp: number | null;
  features: ExtractedFeature[];
  /** The region's water network for routing (PAD-11); null when the extract holds no water it routes on. */
  graph: BuiltWaterGraph | null;
}

/**
 * One region's read: its paddle obstacles and, from the same passes, the
 * water network the router plans on. Pure work on a file, so it runs in a
 * thread of its own and the server keeps answering meanwhile.
 */
export async function importExtract(
  path: string,
  regionId: string,
  onProgress: (phase: ImportPhase, fraction: number | null) => void,
): Promise<ImportOutcome> {
  let collector: WaterCollector | null = null;
  const { timestamp, features, coordOf } = await extractPaddleFeatures(
    path,
    (fraction) => onProgress('read', fraction),
    (want) => (collector = new WaterCollector(want)),
  );
  onProgress('build', null);
  const sourceTimestamp = timestamp === null ? null : new Date(timestamp * 1000).toISOString();
  const graph = collector ? buildRegionGraph(collector, coordOf, { regionId, sourceTimestamp }) : null;
  return { timestamp, features, graph };
}
