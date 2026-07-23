import type { ModuleId, RoadmapModule } from '../../content/types';

// The union is purely documentation — ModuleId is a bare `string` alias, so
// TS can't actually distinguish 'all' from it — but it's worth keeping at
// every call site as a reminder of the two valid shapes 'all' can take.
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type PlanScope = 'all' | ModuleId;

function isGhostModule(module: RoadmapModule): boolean {
  return module.stages.every((stage) => stage.items.length === 0);
}

/**
 * Resolves a plan's scope to the set of module ids it covers (Study plan
 * spec §1) — `'all'` is every authored module; a specific module id is
 * that module plus all its prerequisite ancestors, transitively. Only
 * authored (non-ghost) modules can ever be scheduled — an unauthored
 * ancestor is silently skipped rather than blocking the whole scope, since
 * content landing later (the module flips from ghost to live) should just
 * widen what the next recompute covers, not require replanning.
 */
export function resolveScopeModuleIds(scope: PlanScope, modules: RoadmapModule[]): Set<ModuleId> {
  if (scope === 'all') {
    return new Set(modules.filter((m) => !isGhostModule(m)).map((m) => m.id));
  }

  const byId = new Map(modules.map((m) => [m.id, m]));
  const result = new Set<ModuleId>();

  function visit(id: ModuleId): void {
    if (result.has(id)) return;
    const module = byId.get(id);
    if (!module || isGhostModule(module)) return;
    result.add(id);
    for (const prereqId of module.prerequisites) visit(prereqId);
  }

  visit(scope);
  return result;
}
