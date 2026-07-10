import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactFlow, Background, Controls, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { modules } from '../../content/registry';
import { moduleProgress } from '../../engine/mastery/mastery';
import { storageAdapter } from '../storageAdapter';
import { RoadmapNode, type RoadmapNodeType } from '../components/roadmap/RoadmapNode';
import { computeRoadmapPositions } from '../components/roadmap/roadmapLayout';
import type { SkillId } from '../../content/types';
import type { SkillMastery } from '../../storage/types';

const nodeTypes = { roadmapModule: RoadmapNode };

export function RoadmapPage() {
  const navigate = useNavigate();
  const [masteryBySkill, setMasteryBySkill] = useState<ReadonlyMap<SkillId, SkillMastery>>(new Map());

  useEffect(() => {
    let cancelled = false;
    void storageAdapter.getMastery().then((records) => {
      if (cancelled) return;
      setMasteryBySkill(new Map(records.map((record) => [record.skillId, record])));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const positions = useMemo(() => computeRoadmapPositions(modules), []);

  const nodes: RoadmapNodeType[] = useMemo(
    () =>
      modules.map((module) => {
        const isGhost = module.stages.every((stage) => stage.items.length === 0);
        return {
          id: module.id,
          type: 'roadmapModule',
          position: positions.get(module.id) ?? { x: 0, y: 0 },
          data: {
            title: module.title,
            category: module.kind === 'data_structure' ? 'Data Structures' : 'Algorithms',
            isGhost,
            progress: moduleProgress(module.skills, masteryBySkill),
          },
        };
      }),
    [positions, masteryBySkill],
  );

  const edges: Edge[] = useMemo(
    () =>
      modules.flatMap((module) =>
        module.prerequisites.map((prereqId) => ({
          id: `${prereqId}->${module.id}`,
          source: prereqId,
          target: module.id,
        })),
      ),
    [],
  );

  return (
    <div className="flex h-screen flex-col bg-bg text-text">
      <header className="border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">Interview Prep Roadmap</h1>
        <p className="text-sm text-text-muted">
          <span className="text-accent">■</span> Data Structures &nbsp;
          <span className="text-accent-secondary">■</span> Algorithms
        </p>
      </header>
      <div className="min-h-0 flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => void navigate(`/modules/${node.id}`)}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          colorMode="dark"
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
