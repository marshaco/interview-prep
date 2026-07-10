import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getQuestion } from '../../content/registry';
import { buildHarness } from '../../engine/grading/harness';
import { grade } from '../../engine/grading/grade';
import { updateMastery } from '../../engine/mastery/mastery';
import { pythonRunner } from '../pythonRunner';
import { storageAdapter } from '../storageAdapter';
import type { RunResult } from '../../engine/runner/types';
import type { Scorecard as ScorecardData } from '../../engine/grading/types';
import { MonacoEditor } from '../components/editor/MonacoEditor';
import { PromptPane } from '../components/question/PromptPane';
import { HintsLadder } from '../components/question/HintsLadder';
import { Scorecard } from '../components/question/Scorecard';

const RUN_TIMEOUT_MS = 8000;
const DRAFT_AUTOSAVE_DEBOUNCE_MS = 1200;

interface PlayerResult {
  result: RunResult;
  scorecard?: ScorecardData;
}

export function QuestionPlayerPage() {
  const params = useParams<{ '*': string }>();
  const questionId = params['*'];
  const question = questionId ? getQuestion(questionId) : undefined;

  const [activeQuestionId, setActiveQuestionId] = useState(question?.id);
  const [code, setCode] = useState('');
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [playerResult, setPlayerResult] = useState<PlayerResult | null>(null);
  const runCounterRef = useRef(0);
  // Starts at 0, not Date.now() — reading the clock is impure and refs can't
  // be written during render; the real value is set in the effect below.
  const sessionStartRef = useRef(0);

  // Reset editor state when navigating to a different question. Adjusting
  // state during render (rather than in an effect) avoids the extra
  // commit-then-reset render pass — see https://react.dev/learn/you-might-not-need-an-effect.
  if (question?.id !== activeQuestionId) {
    setActiveQuestionId(question?.id);
    setCode('');
    setIsDraftLoaded(false);
    setHintsRevealed(0);
    setPlayerResult(null);
  }

  // Loading the draft is genuine async I/O (IndexedDB), so — unlike the
  // synchronous reset above — this has to be a real effect. Also starts the
  // attempt-duration clock for this question.
  useEffect(() => {
    if (!question) return;
    sessionStartRef.current = Date.now();
    let cancelled = false;
    void storageAdapter.getDraft(question.id).then((draft) => {
      if (cancelled) return;
      setCode(draft?.code ?? question.starterCode);
      setIsDraftLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [question]);

  // Debounced auto-save. Guarded on isDraftLoaded so we don't immediately
  // re-save the draft we just loaded (or overwrite it with '' during the
  // reset-then-load window on question change).
  useEffect(() => {
    if (!question || !isDraftLoaded) return;
    const timer = setTimeout(() => {
      void storageAdapter.saveDraft({ questionId: question.id, code, updatedAt: new Date().toISOString() });
    }, DRAFT_AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [code, question, isDraftLoaded]);

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

  function saveDraftNow() {
    if (!question) return;
    void storageAdapter.saveDraft({ questionId: question.id, code, updatedAt: new Date().toISOString() });
  }

  async function recordAttempt(scorecard: ScorecardData) {
    if (!question) return;
    const now = new Date().toISOString();
    const durationMs = Date.now() - sessionStartRef.current;

    await storageAdapter.saveAttempt({
      id: crypto.randomUUID(),
      questionId: question.id,
      code,
      scorecard,
      hintsUsed: hintsRevealed,
      durationMs,
      createdAt: now,
    });
    await storageAdapter.logActiveDay(now.slice(0, 10));

    const masteryRecords = await storageAdapter.getMastery();
    await Promise.all(
      question.skillIds.map((skillId) => {
        const previous = masteryRecords.find((m) => m.skillId === skillId);
        const updated = updateMastery(previous, skillId, scorecard.overall, hintsRevealed, now);
        return storageAdapter.upsertMastery(updated);
      }),
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
      if (scorecard) {
        await recordAttempt(scorecard);
      }
    } finally {
      setIsRunning(false);
    }
  }

  function handleReset() {
    if (!question) return;
    setCode(question.starterCode);
    setPlayerResult(null);
    // Persist immediately so navigating away and back doesn't silently
    // restore the pre-reset draft.
    void storageAdapter.saveDraft({
      questionId: question.id,
      code: question.starterCode,
      updatedAt: new Date().toISOString(),
    });
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
            <HintsLadder
              hints={question.hints}
              revealedCount={hintsRevealed}
              onReveal={() => setHintsRevealed((count) => Math.min(count + 1, question.hints.length))}
            />
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
            <MonacoEditor value={code} onChange={setCode} onRun={() => void execute('run')} onSave={saveDraftNow} />
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
