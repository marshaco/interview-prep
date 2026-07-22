import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { ProgressRing } from '../common/ProgressRing';
import type { ModuleCategory } from '../../../content/types';

export interface RoadmapNodeData extends Record<string, unknown> {
  title: string;
  category: ModuleCategory;
  isGhost: boolean;
  progress: number; // 0-1
  onActivate: () => void;
}

export type RoadmapNodeType = Node<RoadmapNodeData, 'roadmapModule'>;

export function RoadmapNode({ data }: NodeProps<RoadmapNodeType>) {
  const isDataStructure = data.category === 'Data Structures';
  const borderClass = data.isGhost ? 'border-border' : isDataStructure ? 'border-accent' : 'border-accent-secondary';
  const ringClass = data.isGhost ? 'stroke-border' : isDataStructure ? 'stroke-accent' : 'stroke-accent-secondary';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={data.onActivate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          data.onActivate();
        }
      }}
      className={`flex w-44 items-center gap-2 rounded-lg border-2 bg-bg-raised px-3 py-2 transition-colors duration-200 ease-out-motion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${borderClass} ${data.isGhost ? 'opacity-60' : ''}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-border" />
      <ProgressRing progress={data.progress} size={28} strokeWidth={3} className={ringClass} />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium text-text">{data.title}</span>
        <span className="text-[10px] uppercase tracking-wide text-text-muted">
          {data.isGhost ? 'coming soon' : data.category}
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-border" />
    </div>
  );
}
