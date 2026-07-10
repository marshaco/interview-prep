import type { RunResult, RunStatus } from '../../../engine/runner/types';
import type { Scorecard as ScorecardData } from '../../../engine/grading/types';

interface ScorecardProps {
  result: RunResult;
  scorecard?: ScorecardData;
}

const STATUS_MESSAGE: Partial<Record<RunStatus, string>> = {
  timeout: 'Timed out — check for an infinite loop.',
  syntax_error: 'Syntax error',
  runtime_error: 'Runtime error',
  cancelled: 'Cancelled',
};

export function Scorecard({ result, scorecard }: ScorecardProps) {
  if (result.status !== 'ok') {
    return (
      <div className="rounded border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
        <p className="font-semibold">{STATUS_MESSAGE[result.status] ?? result.status}</p>
        {result.stderr && <pre className="mt-2 whitespace-pre-wrap font-mono text-xs">{result.stderr}</pre>}
      </div>
    );
  }

  const entries = result.report?.results ?? [];

  return (
    <div className="flex flex-col gap-3">
      {scorecard && (
        <div className="flex items-center gap-4 rounded border border-border bg-bg-raised p-3 text-sm">
          <span className="font-semibold text-text">Overall: {scorecard.overall}</span>
          <span className="text-text-muted">
            Correctness {scorecard.correctness.correct}/{scorecard.correctness.total}
          </span>
          <span className="text-text-muted">
            Edge cases {scorecard.edgeCases.correct}/{scorecard.edgeCases.total}
          </span>
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className={`rounded border p-3 text-sm ${
              entry.passed ? 'border-success/40 bg-success/10' : 'border-danger/40 bg-danger/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={entry.passed ? 'font-medium text-success' : 'font-medium text-danger'}>
                {entry.passed ? 'Passed' : 'Failed'}
              </span>
              <span className="text-xs uppercase tracking-wide text-text-muted">{entry.group}</span>
            </div>
            {entry.label && <p className="mt-1 text-text-muted">{entry.label}</p>}
            {entry.error && (
              <pre className="mt-1 whitespace-pre-wrap font-mono text-xs text-danger">{entry.error}</pre>
            )}
            {entry.group === 'visible' && !entry.passed && (
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 font-mono text-xs text-text-muted">
                <dt>args</dt>
                <dd>{JSON.stringify(entry.args)}</dd>
                <dt>expected</dt>
                <dd>{JSON.stringify(entry.expected)}</dd>
                <dt>got</dt>
                <dd>{JSON.stringify(entry.got)}</dd>
              </dl>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
