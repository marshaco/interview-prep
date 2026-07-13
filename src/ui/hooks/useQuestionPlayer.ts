import { useEffect, useMemo, useRef, useState } from 'react';
import { buildHarness } from '../../engine/grading/harness';
import { grade } from '../../engine/grading/grade';
import { updateMastery } from '../../engine/mastery/mastery';
import { deriveReviewQuality, review } from '../../engine/srs/scheduler';
import { localDateIso } from '../../engine/srs/streaks';
import { pythonRunner } from '../pythonRunner';
import { storageAdapter } from '../storageAdapter';
import type { RunResult } from '../../engine/runner/types';
import type { Scorecard as ScorecardData } from '../../engine/grading/types';
import type { CodeQuestion } from '../../content/types';

const RUN_TIMEOUT_MS = 8000;
const DRAFT_AUTOSAVE_DEBOUNCE_MS = 1200;

export interface PlayerResult {
  result: RunResult;
  scorecard?: ScorecardData;
}

/**
 * Drives a single question's play/grade/persist lifecycle: draft
 * load/autosave, Run vs Submit, and — on a successful Submit — recording an
 * Attempt and updating mastery for every skill the question touches.
 * Extracted out of QuestionPlayerPage so the Guided Build stepper can reuse
 * the exact same behavior instead of re-implementing it.
 */
export function useQuestionPlayer(question: CodeQuestion | undefined) {
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

  // Reset player state when navigating to a different question. Adjusting
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
    // Local date, not now.slice(0, 10) (which is UTC) — a day's activity
    // must land on the user's actual calendar day for streaks to be honest.
    await storageAdapter.logActiveDay(localDateIso(new Date()));

    const masteryRecords = await storageAdapter.getMastery();
    const reviewRecords = await storageAdapter.getReviewRecords();
    const quality = deriveReviewQuality(scorecard.overall, hintsRevealed);

    await Promise.all(
      question.skillIds.flatMap((skillId) => {
        const previousMastery = masteryRecords.find((m) => m.skillId === skillId);
        const updatedMastery = updateMastery(previousMastery, skillId, scorecard.overall, hintsRevealed, now);

        const previousReview = reviewRecords.find((r) => r.skillId === skillId);
        const updatedReview = review(previousReview, skillId, quality, now);

        return [storageAdapter.upsertMastery(updatedMastery), storageAdapter.upsertReviewRecord(updatedReview)];
      }),
    );
  }

  async function execute(kind: 'run' | 'submit'): Promise<PlayerResult | null> {
    const harness = kind === 'run' ? visibleHarness : fullHarness;
    if (!harness || !question) return null;

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
      const next: PlayerResult = { result, scorecard };
      setPlayerResult(next);
      if (scorecard) {
        await recordAttempt(scorecard);
      }
      return next;
    } finally {
      setIsRunning(false);
    }
  }

  function reset() {
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

  return {
    code,
    setCode,
    hintsRevealed,
    revealHint: () => setHintsRevealed((count) => Math.min(count + 1, question?.hints.length ?? 4)),
    isRunning,
    playerResult,
    run: () => execute('run'),
    submit: () => execute('submit'),
    reset,
    saveDraftNow,
  };
}
