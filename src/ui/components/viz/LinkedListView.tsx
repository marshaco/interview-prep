import { useEffect, useState } from 'react';
import type { VizFrame } from '../../../engine/grading/types';

const AUTOPLAY_INTERVAL_MS = 900;
const NODE_WIDTH = 56;
const NODE_HEIGHT = 40;
const NODE_GAP = 40;
const NODE_Y = 24;

interface LinkedListViewProps {
  frames: VizFrame[];
}

/**
 * Post-hoc replay renderer for the trace-frame protocol (ARCHITECTURE §9):
 * steps through frames the harness already computed, rendering each frame's
 * flattened node-value list as boxes and arrows. Not a live debugger — all
 * frames exist up front, this just scrubs through them.
 */
export function LinkedListView({ frames }: LinkedListViewProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const atEnd = stepIndex >= frames.length - 1;

  // No setState when playback reaches the end — just stop scheduling the
  // next tick. `isPlaying` only turns false again via an explicit user click.
  useEffect(() => {
    if (!isPlaying || atEnd) return;
    const timer = setTimeout(() => setStepIndex((i) => i + 1), AUTOPLAY_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [isPlaying, stepIndex, frames.length, atEnd]);

  if (frames.length === 0) return null;

  const frame = frames[stepIndex];
  if (!frame) return null;

  const previousState = stepIndex > 0 ? frames[stepIndex - 1]?.state : undefined;
  const previousValues = Array.isArray(previousState) ? previousState : [];

  const currentState = Array.isArray(frame.state) ? frame.state : [];
  const hasCycle = currentState.at(-1) === '<cycle>';
  const values = currentState.filter((v) => v !== '<cycle>');

  const svgWidth = Math.max(240, 20 + values.length * (NODE_WIDTH + NODE_GAP) + 60);

  return (
    <div className="rounded border border-border bg-bg-raised p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">Watch it build</h3>
        <span className="text-xs text-text-muted">
          Step {stepIndex + 1} of {frames.length} — {frame.label}
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg width={svgWidth} height={NODE_Y + NODE_HEIGHT + 30} className="block">
          <defs>
            <marker id="viz-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--color-text-muted)" />
            </marker>
          </defs>
          {values.map((value, index) => {
            const x = 20 + index * (NODE_WIDTH + NODE_GAP);
            const isNew = index >= previousValues.length;
            const isChanged = !isNew && previousValues[index] !== value;
            const boxColor = isNew || isChanged ? 'var(--color-accent)' : 'var(--color-border)';
            return (
              <g key={index}>
                <rect
                  x={x}
                  y={NODE_Y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={6}
                  fill="var(--color-bg-inset)"
                  stroke={boxColor}
                  strokeWidth={isNew || isChanged ? 2 : 1}
                />
                <text
                  x={x + NODE_WIDTH / 2}
                  y={NODE_Y + NODE_HEIGHT / 2 + 5}
                  textAnchor="middle"
                  fontSize="14"
                  fill="var(--color-text)"
                >
                  {typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}
                </text>
                {index < values.length - 1 && (
                  <line
                    x1={x + NODE_WIDTH}
                    y1={NODE_Y + NODE_HEIGHT / 2}
                    x2={x + NODE_WIDTH + NODE_GAP - 8}
                    y2={NODE_Y + NODE_HEIGHT / 2}
                    stroke="var(--color-text-muted)"
                    strokeWidth={1.5}
                    markerEnd="url(#viz-arrowhead)"
                  />
                )}
              </g>
            );
          })}

          {values.length === 0 && (
            <text x={20} y={NODE_Y + NODE_HEIGHT / 2 + 5} fontSize="13" fill="var(--color-text-muted)">
              (empty)
            </text>
          )}

          {values.length > 0 && !hasCycle && (
            <>
              <line
                x1={20 + values.length * (NODE_WIDTH + NODE_GAP) - NODE_GAP}
                y1={NODE_Y + NODE_HEIGHT / 2}
                x2={20 + values.length * (NODE_WIDTH + NODE_GAP) - 8}
                y2={NODE_Y + NODE_HEIGHT / 2}
                stroke="var(--color-text-muted)"
                strokeWidth={1.5}
                markerEnd="url(#viz-arrowhead)"
              />
              <text
                x={20 + values.length * (NODE_WIDTH + NODE_GAP)}
                y={NODE_Y + NODE_HEIGHT / 2 + 5}
                fontSize="13"
                fill="var(--color-text-muted)"
              >
                None
              </text>
            </>
          )}

          {values.length > 0 && hasCycle && (
            <path
              d={`M ${20 + (values.length - 1) * (NODE_WIDTH + NODE_GAP) + NODE_WIDTH / 2} ${NODE_Y}
                  C ${20 + (values.length - 1) * (NODE_WIDTH + NODE_GAP) + NODE_WIDTH / 2} ${NODE_Y - 22},
                    ${20 + NODE_WIDTH / 2} ${NODE_Y - 22},
                    ${20 + NODE_WIDTH / 2} ${NODE_Y}`}
              fill="none"
              stroke="var(--color-accent-secondary)"
              strokeWidth={1.5}
              markerEnd="url(#viz-arrowhead)"
            />
          )}
        </svg>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            setStepIndex((i) => Math.max(0, i - 1));
          }}
          disabled={stepIndex === 0}
          className="rounded border border-border bg-bg px-2 py-1 text-xs text-text hover:border-accent disabled:opacity-40"
        >
          ← Prev
        </button>
        <button
          type="button"
          onClick={() => {
            if (atEnd) {
              setStepIndex(0);
              setIsPlaying(true);
            } else {
              setIsPlaying((p) => !p);
            }
          }}
          className="rounded border border-border bg-bg px-2 py-1 text-xs text-text hover:border-accent disabled:opacity-40"
        >
          {atEnd ? 'Replay' : isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            setStepIndex((i) => Math.min(frames.length - 1, i + 1));
          }}
          disabled={stepIndex >= frames.length - 1}
          className="rounded border border-border bg-bg px-2 py-1 text-xs text-text hover:border-accent disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
