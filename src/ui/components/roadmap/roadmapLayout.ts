import type { ModuleId, RoadmapModule } from '../../../content/types';

const LAYER_WIDTH = 240;
const ROW_HEIGHT = 110;

/** Longest-path depth from a root (no prerequisites) — assumes an acyclic graph, enforced by content/validate.ts. */
function computeLayerDepths(modules: RoadmapModule[]): Map<ModuleId, number> {
  const byId = new Map(modules.map((m) => [m.id, m]));
  const depths = new Map<ModuleId, number>();

  function depthOf(id: ModuleId): number {
    const cached = depths.get(id);
    if (cached !== undefined) return cached;
    const module = byId.get(id);
    if (!module || module.prerequisites.length === 0) {
      depths.set(id, 0);
      return 0;
    }
    const depth = 1 + Math.max(...module.prerequisites.map((prereqId) => depthOf(prereqId)));
    depths.set(id, depth);
    return depth;
  }

  for (const module of modules) depthOf(module.id);
  return depths;
}

/** Positions nodes left-to-right by prerequisite depth, stacking same-depth nodes vertically. */
export function computeRoadmapPositions(modules: RoadmapModule[]): Map<ModuleId, { x: number; y: number }> {
  const depths = computeLayerDepths(modules);
  const rowIndexByLayer = new Map<number, number>();
  const positions = new Map<ModuleId, { x: number; y: number }>();

  for (const module of modules) {
    const layer = depths.get(module.id) ?? 0;
    const rowIndex = rowIndexByLayer.get(layer) ?? 0;
    rowIndexByLayer.set(layer, rowIndex + 1);
    positions.set(module.id, { x: layer * LAYER_WIDTH, y: rowIndex * ROW_HEIGHT });
  }

  return positions;
}
