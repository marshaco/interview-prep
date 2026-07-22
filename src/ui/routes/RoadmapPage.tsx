import { useEffect, useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { modules } from '../../content/registry';
import { computeModuleMastery } from '../../engine/mastery/mastery';
import { storageAdapter } from '../storageAdapter';
import { RoadmapNode, type RoadmapNodeType } from '../components/roadmap/RoadmapNode';
import { computeRoadmapPositions } from '../components/roadmap/roadmapLayout';
import { AppNav } from '../components/common/AppNav';
import { ModuleDetails } from '../components/module/ModuleDetails';
import type { ModuleId } from '../../content/types';
import type { Attempt } from '../../storage/types';

const nodeTypes = { roadmapModule: RoadmapNode };

type Category = 'data_structure' | 'algorithm';

const CATEGORY_TABS: { kind: Category; label: string; accentClass: string; activeClass: string }[] = [
  {
    kind: 'data_structure',
    label: 'Data Structures',
    accentClass: 'text-accent',
    activeClass: 'border-accent bg-accent-muted text-text',
  },
  {
    kind: 'algorithm',
    label: 'Algorithms',
    accentClass: 'text-accent-secondary',
    activeClass: 'border-accent-secondary bg-accent-secondary-muted text-text',
  },
];

export function RoadmapPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('data_structure');
  const [selectedModuleId, setSelectedModuleId] = useState<ModuleId | null>(null);
  const [renderedModuleId, setRenderedModuleId] = useState<ModuleId | null>(null);

  // Adjust derived state during render (not an effect) — see
  // useQuestionPlayer's question-change reset for the same pattern. Keeping
  // the last-open module rendered while the panel is sliding shut avoids a
  // blank-panel flash; switching category closes whatever's open, since it
  // belongs to the graph that's about to disappear.
  if (selectedModuleId !== null && selectedModuleId !== renderedModuleId) {
    setRenderedModuleId(selectedModuleId);
  }
  const [categoryForReset, setCategoryForReset] = useState(activeCategory);
  if (activeCategory !== categoryForReset) {
    setCategoryForReset(activeCategory);
    setSelectedModuleId(null);
  }

  useEffect(() => {
    let cancelled = false;
    void storageAdapter.getAttempts().then((allAttempts) => {
      if (cancelled) return;
      setAttempts(allAttempts);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedModuleId(null);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categoryModules = useMemo(() => modules.filter((m) => m.kind === activeCategory), [activeCategory]);

  const positions = useMemo(() => computeRoadmapPositions(categoryModules), [categoryModules]);

  const nodes: RoadmapNodeType[] = useMemo(
    () =>
      categoryModules.map((module) => {
        const isGhost = module.stages.every((stage) => stage.items.length === 0);
        return {
          id: module.id,
          type: 'roadmapModule',
          position: positions.get(module.id) ?? { x: 0, y: 0 },
          data: {
            title: module.title,
            category: module.kind === 'data_structure' ? 'Data Structures' : 'Algorithms',
            isGhost,
            progress: computeModuleMastery(module, attempts, false),
            onActivate: () => setSelectedModuleId(module.id),
          },
        };
      }),
    [categoryModules, positions, attempts],
  );

  const edges: Edge[] = useMemo(
    () =>
      categoryModules.flatMap((module) =>
        module.prerequisites
          .filter((prereqId) => categoryModules.some((m) => m.id === prereqId))
          .map((prereqId) => ({
            id: `${prereqId}->${module.id}`,
            source: prereqId,
            target: module.id,
          })),
      ),
    [categoryModules],
  );

  return (
    <div className="flex h-screen flex-col bg-bg text-text">
      <AppNav />
      <header className="border-b border-border px-4 py-3">
        <h1 className="mb-3 text-lg font-semibold">Interview Prep Roadmap</h1>
        <div className="flex gap-2">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.kind}
              type="button"
              onClick={() => setActiveCategory(tab.kind)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-200 ease-out-motion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                activeCategory === tab.kind ? tab.activeClass : 'border-border text-text-muted hover:text-text'
              }`}
            >
              <span className={activeCategory === tab.kind ? '' : tab.accentClass}>■</span> {tab.label}
            </button>
          ))}
        </div>
      </header>
      <div className="relative min-h-0 flex-1">
        <ReactFlow
          key={activeCategory}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onPaneClick={() => setSelectedModuleId(null)}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          colorMode="dark"
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>

        <div
          className={`absolute inset-y-0 right-0 z-10 w-full max-w-[420px] transform overflow-y-auto border-l border-border bg-bg-raised shadow-xl transition-transform duration-200 ease-out-motion ${
            selectedModuleId ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-xs uppercase tracking-wide text-text-muted">Module</span>
            <button
              type="button"
              onClick={() => setSelectedModuleId(null)}
              aria-label="Close module panel"
              className="rounded p-1 text-text-muted transition-colors duration-200 ease-out-motion hover:bg-bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              ✕
            </button>
          </div>
          <div className="p-5">{renderedModuleId && <ModuleDetails moduleId={renderedModuleId} />}</div>
        </div>
      </div>
    </div>
  );
}
