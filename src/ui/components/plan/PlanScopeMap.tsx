import { useMemo } from 'react';
import { computeModuleDepths } from '../../../engine/roadmap/dag';
import { allAuthoredModuleIds, getAncestorModuleIds, isGhostModule } from '../../../engine/plan/scope';
import { LEARN_STAGE_MINUTES } from '../../../engine/plan/projectPlan';
import { estimateMinutes } from '../../../engine/plan/estimate';
import type { CodeQuestion, ModuleId, RoadmapModule } from '../../../content/types';

interface PlanScopeMapProps {
  modules: RoadmapModule[];
  questions: CodeQuestion[];
  selected: ModuleId[];
  onChange: (next: ModuleId[]) => void;
}

function moduleExerciseIds(module: RoadmapModule): string[] {
  return module.stages.flatMap((stage) => stage.items.filter((item) => item.type === 'question').map((item) => item.questionId));
}

function formatTotalTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/**
 * The setup mini-map (Study plan revision spec §1) — the same tiered DAG
 * layout Home uses, at reduced scale, as a set of toggle chips instead of
 * navigation links. Edges are omitted at this scale (they added more
 * clutter than information for a handful of tiers of small chips).
 */
export function PlanScopeMap({ modules, questions, selected, onChange }: PlanScopeMapProps) {
  const questionsById = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const depths = useMemo(() => computeModuleDepths(modules), [modules]);
  const tiers = useMemo(() => {
    const maxDepth = Math.max(0, ...modules.map((m) => depths.get(m.id) ?? 0));
    const rows: RoadmapModule[][] = Array.from({ length: maxDepth + 1 }, () => []);
    for (const module of modules) rows[depths.get(module.id) ?? 0]?.push(module);
    return rows;
  }, [depths, modules]);

  const selectedSet = new Set(selected);
  const authoredIds = new Set(allAuthoredModuleIds(modules));

  function toggle(moduleId: ModuleId) {
    onChange(selectedSet.has(moduleId) ? selected.filter((id) => id !== moduleId) : [...selected, moduleId]);
  }

  const notes = selected.flatMap((id) => {
    const module = modules.find((m) => m.id === id);
    if (!module) return [];
    const missingAncestors = [...getAncestorModuleIds(id, modules)].filter((a) => authoredIds.has(a) && !selectedSet.has(a));
    if (missingAncestors.length === 0) return [];
    const missingTitles = missingAncestors.map((a) => modules.find((m) => m.id === a)?.title ?? a);
    return [`${module.title} builds on ${missingTitles.join(', ')}`];
  });

  const scopedModules = modules.filter((m) => selectedSet.has(m.id) && authoredIds.has(m.id));
  const exerciseIds = new Set(scopedModules.flatMap(moduleExerciseIds));
  const learnStageCount = scopedModules.filter((m) => m.stages.some((s) => s.type === 'learn' && s.items.length > 0)).length;
  const totalMinutes =
    [...exerciseIds].reduce((sum, id) => {
      const question = questionsById.get(id);
      return sum + (question ? estimateMinutes(question, [], 'practice') : 0);
    }, 0) +
    learnStageCount * LEARN_STAGE_MINUTES;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">Scope</span>
        <div className="flex gap-3 text-xs">
          <button
            type="button"
            onClick={() => onChange(allAuthoredModuleIds(modules))}
            className="text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            None
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded border border-border/50 bg-bg-inset p-3">
        {tiers.map((tierModules, tierIndex) => (
          <div key={tierIndex} className="flex flex-wrap gap-1.5">
            {tierModules.map((module) => {
              const ghost = isGhostModule(module);
              const isSelected = selectedSet.has(module.id);
              if (ghost) {
                return (
                  <span
                    key={module.id}
                    className="rounded-full border border-border/50 px-2.5 py-1 text-xs text-text-muted opacity-50"
                    title="In development"
                  >
                    {module.title}
                  </span>
                );
              }
              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => toggle(module.id)}
                  aria-pressed={isSelected}
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors duration-200 ease-out-motion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isSelected ? 'border-accent bg-accent-muted text-text' : 'border-border text-text-muted hover:border-accent hover:text-text'
                  }`}
                >
                  {isSelected && <span className="text-accent">✓</span>}
                  {module.title}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {notes.length > 0 && (
        <div className="mt-2 flex flex-col gap-0.5">
          {notes.map((note) => (
            <p key={note} className="text-xs text-text-muted">
              Note: {note}
            </p>
          ))}
        </div>
      )}

      <p className="mt-2 text-sm text-text-muted">
        {scopedModules.length} module{scopedModules.length === 1 ? '' : 's'} · {exerciseIds.size} exercise{exerciseIds.size === 1 ? '' : 's'} ·{' '}
        {formatTotalTime(totalMinutes)} total
      </p>
    </div>
  );
}
