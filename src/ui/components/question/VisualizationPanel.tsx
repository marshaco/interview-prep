import { useState } from 'react';
import { buildTraceHarness } from '../../../engine/grading/trace';
import { pythonRunner } from '../../pythonRunner';
import { LinkedListView } from '../viz/LinkedListView';
import type { CodeQuestion } from '../../../content/types';
import type { VizFrame } from '../../../engine/grading/types';

const TRACE_TIMEOUT_MS = 8000;

interface VisualizationPanelProps {
  question: CodeQuestion;
  code: string;
}

/**
 * On-demand trace run: builds a separate harness from the question's
 * `visualization.demoScript` (independent of the grading tests) and replays
 * the resulting frames through LinkedListView. Only rendered once a Submit
 * has produced a scorecard — see QuestionPlayerLayout.
 */
export function VisualizationPanel({ question, code }: VisualizationPanelProps) {
  const [frames, setFrames] = useState<VizFrame[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const visualization = question.visualization;
  if (!visualization) return null;

  async function runTrace() {
    if (!visualization) return;
    setIsLoading(true);
    setError(null);
    try {
      const harness = buildTraceHarness(question.spec, visualization.demoScript);
      const result = await pythonRunner.run({
        runId: `${question.id}-trace-${crypto.randomUUID()}`,
        userCode: code,
        harness,
        timeoutMs: TRACE_TIMEOUT_MS,
      });
      if (result.status !== 'ok') {
        setError(`Couldn't build a trace for this run (${result.status}).`);
        return;
      }
      setFrames(result.report?.frames ?? []);
    } finally {
      setIsLoading(false);
    }
  }

  if (frames) {
    return <LinkedListView frames={frames} />;
  }

  return (
    <div className="rounded border border-border bg-bg-raised p-4">
      <button
        type="button"
        onClick={() => void runTrace()}
        disabled={isLoading}
        className="rounded border border-border bg-bg px-3 py-1.5 text-sm text-accent transition-colors duration-200 ease-out-motion hover:border-accent disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {isLoading ? 'Building trace…' : '▶ Watch it build'}
      </button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
