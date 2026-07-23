import { useEffect, useMemo, useRef, useState } from 'react';
import { buildHarness } from '../../engine/grading/harness';
import { grade } from '../../engine/grading/grade';
import { enterReview } from '../../engine/srs/scheduler';
import { localDateIso } from '../../engine/srs/streaks';
import { pythonRunner } from '../pythonRunner';
import { storageAdapter } from '../storageAdapter';
import type { RunResult } from '../../engine/runner/types';
import type { Scorecard as ScorecardData } from '../../engine/grading/types';
import type { CodeQuestion } from '../../content/types';
import type { AttemptContext, AttemptTag } from '../../storage/types';

const RUN_TIMEOUT_MS = 8000;
const DRAFT_AUTOSAVE_DEBOUNCE_MS = 1200;

export interface PlayerResult {
  result: RunResult;
  scorecard?: ScorecardData;
}

/**
 * Drives a single question's play/grade/persist lifecycle: draft
 * load/autosave, Run vs Submit, and — on a successful Submit — recording an
 * Attempt and updating the review schedule for every skill the question
 * touches. Extracted out of QuestionPlayerPage so the Guided Build stepper
 * can reuse the exact same behavior instead of re-implementing it.
 */
export function useQuestionPlayer(question: CodeQuestion | undefined, context: AttemptContext = 'practice') {
  const [activeQuestionId, setActiveQuestionId] = useState(question?.id);
  const [code, setCode] = useState('');
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [playerResult, setPlayerResult] = useState<PlayerResult | null>(null);
  const [lastAttemptId, setLastAttemptId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<AttemptTag[]>([]);
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
    setLastAttemptId(null);
    setSelectedTags([]);
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
    const attemptId = crypto.randomUUID();

    await storageAdapter.saveAttempt({
      id: attemptId,
      questionId: question.id,
      code,
      scorecard,
      hintsUsed: hintsRevealed,
      durationMs,
      createdAt: now,
      context,
    });
    setLastAttemptId(attemptId);
    setSelectedTags([]);
    // Local date, not now.slice(0, 10) (which is UTC) — a day's activity
    // must land on the user's actual calendar day for streaks to be honest.
    await storageAdapter.logActiveDay(localDateIso(new Date()));

    // Mastery is a pure computation over Attempt history (engine/mastery) —
    // nothing to write here. Entering the review pool only happens on a
    // first-ever pass of a reviewable exercise during ordinary practice —
    // review-session outcomes are scheduled explicitly by the review
    // session player (it has session-level context, like submit count and
    // whether the item was actually due, that this generic path lacks).
    if (context === 'practice' && question.reviewable && scorecard.overall === 100) {
      const existingStates = await storageAdapter.getReviewStates();
      const alreadyTracked = existingStates.some((s) => s.questionId === question.id);
      if (!alreadyTracked) {
        await storageAdapter.upsertReviewState(enterReview(question.id, now));
      }
    }
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
    setLastAttemptId(null);
    setSelectedTags([]);
    // Persist immediately so navigating away and back doesn't silently
    // restore the pre-reset draft.
    void storageAdapter.saveDraft({
      questionId: question.id,
      code: question.starterCode,
      updatedAt: new Date().toISOString(),
    });
  }

  async function toggleTag(tag: AttemptTag) {
    const next = selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag];
    setSelectedTags(next);
    if (lastAttemptId) {
      await storageAdapter.updateAttemptTags(lastAttemptId, next);
    }
  }

  return {
    code,
    setCode,
    hintsRevealed,
    revealHint: () => setHintsRevealed((count) => Math.min(count + 1, question?.hints.length ?? 4)),
    isRunning,
    playerResult,
    selectedTags,
    toggleTag: (tag: AttemptTag) => void toggleTag(tag),
    run: () => execute('run'),
    submit: () => execute('submit'),
    reset,
    saveDraftNow,
  };
}
