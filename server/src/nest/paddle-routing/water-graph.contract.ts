import { buildWaterGraph } from './build/build-graph';
import { WaterCollector } from './build/collect';
import { SNAP_M } from './engine/router';
import { encodeWaterGraph } from './water-graph';
import type { PaddleRegionGraphStats } from '@trek/shared';

/**
 * PAD-11, what the paddle region import uses of routing: a collector that
 * rides along the extract's passes, and the build of the region's network
 * from what it kept, as the bytes of the network's file.
 */
export { WaterCollector };

export interface BuiltWaterGraph {
  bytes: Uint8Array;
  rev: string;
  stats: PaddleRegionGraphStats;
  box: { minLat: number; minLng: number; maxLat: number; maxLng: number };
}

export function buildRegionGraph(
  collector: WaterCollector,
  coordOf: (nodeId: number) => [number, number] | null,
  meta: { regionId: string; sourceTimestamp: string | null },
): BuiltWaterGraph | null {
  const graph = buildWaterGraph(collector.water, coordOf, meta);
  if (graph.nodeLat.length === 0 && graph.lakes.length === 0) return null;
  const box = { minLat: 90, minLng: 180, maxLat: -90, maxLng: -180 };
  for (let i = 0; i < graph.nodeLat.length; i++) {
    box.minLat = Math.min(box.minLat, graph.nodeLat[i] as number);
    box.maxLat = Math.max(box.maxLat, graph.nodeLat[i] as number);
    box.minLng = Math.min(box.minLng, graph.nodeLng[i] as number);
    box.maxLng = Math.max(box.maxLng, graph.nodeLng[i] as number);
  }
  for (const lake of graph.lakes) {
    box.minLat = Math.min(box.minLat, lake.lat0);
    box.minLng = Math.min(box.minLng, lake.lng0);
    box.maxLat = Math.max(box.maxLat, lake.lat0 + (lake.height * lake.cell) / 111_195);
    box.maxLng = Math.max(
      box.maxLng,
      lake.lng0 + (lake.width * lake.cell) / (111_195 * Math.cos((lake.lat0 * Math.PI) / 180)),
    );
  }
  // Widened by the snap distance: a point on the bank beside the outermost water still finds this network.
  const padLat = SNAP_M / 111_195;
  const padLng = SNAP_M / (111_195 * Math.cos((((box.minLat + box.maxLat) / 2) * Math.PI) / 180));
  box.minLat -= padLat;
  box.maxLat += padLat;
  box.minLng -= padLng;
  box.maxLng += padLng;
  const { bytes, rev } = encodeWaterGraph(graph);
  return { bytes, rev, stats: graph.stats, box };
}
