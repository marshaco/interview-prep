import type { ModuleId, RoadmapModule } from '../../content/types';

/**
 * Longest-path depth from a root (no prerequisites) — assumes an acyclic
 * graph, enforced by content/validate.ts. Shared by Home's tiered layout
 * (ui/routes/HomePage.tsx) and selectNextAction's "first incomplete module
 * in DAG order" policy — one depth computation, two consumers.
 */
export function computeModuleDepths(modules: RoadmapModule[]): Map<ModuleId, number> {
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

/** Modules ordered by DAG depth (roots first); stable (preserves input order) among equal-depth modules. */
export function orderModulesByDag(modules: RoadmapModule[]): RoadmapModule[] {
  const depths = computeModuleDepths(modules);
  return [...modules].sort((a, b) => (depths.get(a.id) ?? 0) - (depths.get(b.id) ?? 0));
}
