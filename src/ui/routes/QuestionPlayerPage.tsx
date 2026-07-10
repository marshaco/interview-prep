import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getQuestion } from '../../content/registry';
import { buildHarness } from '../../engine/grading/harness';
import { grade } from '../../engine/grading/grade';
import { pythonRunner } from '../pythonRunner';
import type { RunResult } from '../../engine/runner/types';
import type { Scorecard as ScorecardData } from '../../engine/grading/types';
import { MonacoEditor } from '../components/editor/MonacoEditor';
import { PromptPane } from '../components/question/PromptPane';
import { HintsLadder } from '../components/question/HintsLadder';
import { Scorecard } from '../components/question/Scorecard';

const RUN_TIMEOUT_MS = 8000;

interface PlayerResult {
  result: RunResult;
  scorecard?: ScorecardData;
}

export function QuestionPlayerPage() {
  const params = useParams<{ '*': string }>();
  const questionId = params['*'];
  const question = questionId ? getQuestion(questionId) : undefined;

  const [activeQuestionId, setActiveQuestionId] = useState(question?.id);
  const [code, setCode] = useState(question?.starterCode ?? '');
  const [isRunning, setIsRunning] = useState(false);
  const [playerResult, setPlayerResult] = useState<PlayerResult | null>(null);
  const runCounterRef = useRef(0);

  // Reset editor state when navigating to a different question. Adjusting
  // state during render (rather than in an effect) avoids the extra
  // commit-then-reset render pass — see https://react.dev/learn/you-might-not-need-an-effect.
  if (question?.id !== activeQuestionId) {
    setActiveQuestionId(question?.id);
    setCode(question?.starterCode ?? '');
    setPlayerResult(null);
  }

  const visibleHarness = useMemo(() => {
    if (!question) return null;
    return buildHarness({ ...question.spec, tests: question.spec.tests.filter((t) => t.group === 'visible') });
  }, [question]);

  const fullHarness = useMemo(() => {
    if (!question) return null;
    return buildHarness(question.spec);
  }, [question]);

  if (!question) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-text">Question not found.</p>
        <Link to="/" className="text-accent">
          Back to list
        </Link>
      </div>
    );
  }

  async function execute(kind: 'run' | 'submit') {
    const harness = kind === 'run' ? visibleHarness : fullHarness;
    if (!harness || !question) return;

    runCounterRef.current += 1;
    const runId = `${question.id}-${runCounterRef.current}`;
    setIsRunning(true);
    try {
      const result = await pythonRunner.run({
        runId,
        userCode: code,
        harness,
        timeoutMs: RUN_TIMEOUT_MS,
      });
      const scorecard = kind === 'submit' && result.status === 'ok' ? grade(question.id, result) : undefined;
      setPlayerResult({ result, scorecard });
    } finally {
      setIsRunning(false);
    }
  }

  function handleReset() {
    if (!question) return;
    setCode(question.starterCode);
    setPlayerResult(null);
  }

  return (
    <div className="flex h-screen flex-col bg-bg text-text">
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        <Link to="/" className="text-sm text-text-muted hover:text-accent">
          ← All questions
        </Link>
        <h1 className="text-sm font-semibold">{question.title}</h1>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="w-[380px] shrink-0 overflow-y-auto border-r border-border p-4">
          <PromptPane question={question} />
          <div className="mt-6">
            <HintsLadder hints={question.hints} />
          </div>
        </aside>
        <main className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            <button
              type="button"
              onClick={() => void execute('run')}
              disabled={isRunning}
              className="rounded border border-border bg-bg-raised px-3 py-1.5 text-sm text-text hover:border-accent disabled:opacity-50"
            >
              Run
            </button>
            <button
              type="button"
              onClick={() => void execute('submit')}
              disabled={isRunning}
              className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isRunning}
              className="rounded px-3 py-1.5 text-sm text-text-muted hover:text-text disabled:opacity-50"
            >
              Reset
            </button>
            {isRunning && <span className="text-xs text-text-muted">Running…</span>}
          </div>
          <div className="min-h-0 flex-1">
            <MonacoEditor value={code} onChange={setCode} onRun={() => void execute('run')} />
          </div>
          <div className="max-h-[40%] overflow-y-auto border-t border-border p-4">
            {playerResult ? (
              <Scorecard result={playerResult.result} scorecard={playerResult.scorecard} />
            ) : (
              <p className="text-sm text-text-muted">Run or Submit to see results.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
