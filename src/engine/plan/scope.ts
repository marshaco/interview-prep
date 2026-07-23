import type { ModuleId, RoadmapModule } from '../../content/types';

/** An explicit list of module ids (Study plan revision spec §1) — no `'all'` sentinel; "everything" is just the list of every authored module at setup time. */
export type PlanScope = ModuleId[];

export function isGhostModule(module: RoadmapModule): boolean {
  return module.stages.every((stage) => stage.items.length === 0);
}

/**
 * Resolves a plan's scope list to the set of module ids the projection may
 * actually draw from (Study plan revision spec §4) — exactly the selected
 * ids, filtered to modules that both exist and are authored. No automatic
 * ancestor expansion: selecting a module whose prerequisites aren't also
 * selected is allowed (nothing is gated), it just means those prerequisites
 * contribute nothing to the projection, which is exactly the informational
 * "builds on" note's point.
 */
export function resolveScopeModuleIds(scope: PlanScope, modules: RoadmapModule[]): Set<ModuleId> {
  const authoredIds = new Set(modules.filter((m) => !isGhostModule(m)).map((m) => m.id));
  return new Set(scope.filter((id) => authoredIds.has(id)));
}

/** Every authored module id, in no particular order — "select All" and the `'all'` -> list migration both want exactly this set. */
export function allAuthoredModuleIds(modules: RoadmapModule[]): ModuleId[] {
  return modules.filter((m) => !isGhostModule(m)).map((m) => m.id);
}

/** Transitive prerequisite ancestors of a module (not including itself) — used for the mini-map's informational "builds on" note. */
export function getAncestorModuleIds(moduleId: ModuleId, modules: RoadmapModule[]): Set<ModuleId> {
  const byId = new Map(modules.map((m) => [m.id, m]));
  const result = new Set<ModuleId>();

  function visit(id: ModuleId): void {
    const module = byId.get(id);
    if (!module) return;
    for (const prereqId of module.prerequisites) {
      if (!result.has(prereqId)) {
        result.add(prereqId);
        visit(prereqId);
      }
    }
  }

  visit(moduleId);
  return result;
}
