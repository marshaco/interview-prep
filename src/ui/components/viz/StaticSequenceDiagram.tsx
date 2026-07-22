import type { SequenceDiagramSpec } from '../../../content/types';

const NODE_WIDTH = 52;
const NODE_HEIGHT = 36;
const NODE_GAP = 34;
const NODE_Y = 20;
const LABEL_Y = NODE_Y + NODE_HEIGHT + 16;

/**
 * Static, hand-authored illustration for a Learn-stage lesson: boxes,
 * optional arrows between them, optional pointer labels underneath. Never
 * depends on user code or a submitted attempt — see VizFrame (§9) for the
 * code-driven, post-hoc-replay counterpart used during grading.
 */
export function StaticSequenceDiagram({ nodes, connected = true, circular = false, caption }: SequenceDiagramSpec) {
  if (nodes.length === 0) return null;

  const hasLabels = nodes.some((n) => n.label);
  const svgHeight = NODE_Y + NODE_HEIGHT + (hasLabels ? 34 : 12);
  const lastBoxRightEdge = 20 + (nodes.length - 1) * (NODE_WIDTH + NODE_GAP) + NODE_WIDTH;
  // Connected, non-circular diagrams draw a trailing "None" label past the
  // last box — it needs real room, not just a margin.
  const trailingWidth = connected && !circular ? 68 : 20;
  const svgWidth = Math.max(160, lastBoxRightEdge + trailingWidth);

  return (
    <figure className="my-4 rounded border border-border bg-bg-inset p-4">
      <div className="overflow-x-auto">
        <svg width={svgWidth} height={svgHeight} className="block">
          <defs>
            <marker id="static-diagram-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--color-text-muted)" />
            </marker>
          </defs>
          {nodes.map((node, index) => {
            const x = 20 + index * (NODE_WIDTH + NODE_GAP);
            const boxColor = node.highlight ? 'var(--color-accent)' : 'var(--color-border)';
            return (
              <g key={index}>
                <rect
                  x={x}
                  y={NODE_Y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={6}
                  fill="var(--color-bg-raised)"
                  stroke={boxColor}
                  strokeWidth={node.highlight ? 2 : 1}
                />
                <text
                  x={x + NODE_WIDTH / 2}
                  y={NODE_Y + NODE_HEIGHT / 2 + 5}
                  textAnchor="middle"
                  fontSize="13"
                  fill="var(--color-text)"
                >
                  {node.value}
                </text>
                {node.label && (
                  <text
                    x={x + NODE_WIDTH / 2}
                    y={LABEL_Y}
                    textAnchor="middle"
                    fontSize="11"
                    fill="var(--color-accent)"
                  >
                    {node.label}
                  </text>
                )}
                {connected && index < nodes.length - 1 && (
                  <line
                    x1={x + NODE_WIDTH}
                    y1={NODE_Y + NODE_HEIGHT / 2}
                    x2={x + NODE_WIDTH + NODE_GAP - 8}
                    y2={NODE_Y + NODE_HEIGHT / 2}
                    stroke="var(--color-text-muted)"
                    strokeWidth={1.5}
                    markerEnd="url(#static-diagram-arrowhead)"
                  />
                )}
              </g>
            );
          })}

          {connected && !circular && (
            <>
              <line
                x1={lastBoxRightEdge}
                y1={NODE_Y + NODE_HEIGHT / 2}
                x2={lastBoxRightEdge + 20}
                y2={NODE_Y + NODE_HEIGHT / 2}
                stroke="var(--color-text-muted)"
                strokeWidth={1.5}
                markerEnd="url(#static-diagram-arrowhead)"
              />
              <text x={lastBoxRightEdge + 28} y={NODE_Y + NODE_HEIGHT / 2 + 5} fontSize="12" fill="var(--color-text-muted)">
                None
              </text>
            </>
          )}

          {connected && circular && nodes.length > 1 && (
            <path
              d={`M ${20 + (nodes.length - 1) * (NODE_WIDTH + NODE_GAP) + NODE_WIDTH / 2} ${NODE_Y}
                  C ${20 + (nodes.length - 1) * (NODE_WIDTH + NODE_GAP) + NODE_WIDTH / 2} ${NODE_Y - 20},
                    ${20 + NODE_WIDTH / 2} ${NODE_Y - 20},
                    ${20 + NODE_WIDTH / 2} ${NODE_Y}`}
              fill="none"
              stroke="var(--color-accent-secondary)"
              strokeWidth={1.5}
              markerEnd="url(#static-diagram-arrowhead)"
            />
          )}
        </svg>
      </div>
      {caption && <figcaption className="mt-2 text-xs text-text-muted">{caption}</figcaption>}
    </figure>
  );
}
