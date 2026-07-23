import { useRef, useState } from 'react';
import { getModule, getQuestion } from '../../../content/registry';
import { DEFAULT_FAST_THRESHOLD_MS, scheduleReview } from '../../../engine/srs/scheduler';
import { useQuestionPlayer } from '../../hooks/useQuestionPlayer';
import { storageAdapter } from '../../storageAdapter';
import { QuestionPlayerLayout } from '../question/QuestionPlayerLayout';
import type { QuestionId } from '../../../content/types';
import type { ReviewState } from '../../../storage/types';

export interface SessionEntry {
  questionId: QuestionId;
  /** False for an ad-hoc drill item that wasn't actually due — a failed attempt on it must not lapse the schedule (Review system spec §4b). */
  wasDue: boolean;
}

export interface SessionOutcome {
  questionId: QuestionId;
  moduleId: string;
  passed: boolean;
}

interface ReviewSessionPlayerProps {
  entries: SessionEntry[];
  index: number;
  reviewStatesById: ReadonlyMap<QuestionId, ReviewState>;
  reviewCountsById: ReadonlyMap<QuestionId, number>;
  onResolved: (outcome: SessionOutcome) => void;
  onEndSession: () => void;
}

function ordinal(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}

function daysAgo(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 86_400_000));
}

/**
 * Drives one queue item's play/grade/schedule lifecycle inside a review
 * session — chrome-stripped like the old Interview Mode was (hints hidden,
 * cold solve), but review sessions have absorbed that role entirely
 * (Review system spec §3). A failing submit doesn't advance the queue: the
 * self-tag UI (already built into QuestionPlayerLayout) lets the user keep
 * trying, and "Skip" is a deliberate two-step action (reveal the reference
 * solution, then confirm) so a lapse is never a silent side effect of
 * clicking away.
 */
export function ReviewSessionPlayer({
  entries,
  index,
  reviewStatesById,
  reviewCountsById,
  onResolved,
  onEndSession,
}: ReviewSessionPlayerProps) {
  const entry = entries[index];
  const question = entry ? getQuestion(entry.questionId) : undefined;
  const module = question ? getModule(question.moduleId) : undefined;
  const state = entry ? reviewStatesById.get(entry.questionId) : undefined;

  const player = useQuestionPlayer(question, 'review');
  const submitCountRef = useRef(0);
  const [skipConfirming, setSkipConfirming] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  if (!entry || !question || !module) return null;

  async function finalizePass() {
    if (!question) return;
    setIsFinalizing(true);
    try {
      const now = new Date().toISOString();
      const cleanPass = submitCountRef.current === 1;
      const attempts = await storageAdapter.getAttempts({ questionId: question.id });
      const lastAttempt = attempts[attempts.length - 1];
      const durationMs = lastAttempt?.durationMs ?? 0;
      const threshold = question.reviewFastThresholdMs ?? DEFAULT_FAST_THRESHOLD_MS;
      const fast = cleanPass && durationMs < threshold;

      if (state) {
        await storageAdapter.upsertReviewState(scheduleReview(state, { passed: true, cleanPass, fast }, now));
      }
      // Let the passing scorecard register before the queue moves on —
      // "auto-advance" (Review system spec §3) shouldn't mean "vanish
      // before you see it passed."
      await new Promise((resolve) => setTimeout(resolve, 900));
      onResolved({ questionId: question.id, moduleId: question.moduleId, passed: true });
    } finally {
      setIsFinalizing(false);
    }
  }

  async function handleSubmit() {
    submitCountRef.current += 1;
    const result = await player.submit();
    if (result?.scorecard?.overall === 100) {
      await finalizePass();
    }
    return result;
  }

  async function handleSkip() {
    if (!question || !entry) return;
    if (!skipConfirming) {
      setSkipConfirming(true);
      return;
    }
    setIsFinalizing(true);
    try {
      const now = new Date().toISOString();
      // An ad-hoc item that wasn't actually due doesn't lapse on failure —
      // only a real due review's schedule is touched (Review system spec §4b).
      if (state && entry.wasDue) {
        await storageAdapter.upsertReviewState(scheduleReview(state, { passed: false, cleanPass: false, fast: false }, now));
      }
      onResolved({ questionId: question.id, moduleId: question.moduleId, passed: false });
    } finally {
      setIsFinalizing(false);
    }
  }

  const scorecard = player.playerResult?.scorecard;
  const hasFailed = scorecard !== undefined && scorecard.overall < 100;
  const reviewCount = reviewCountsById.get(question.id) ?? 0;
  const nextRung = state ? Math.min(5, state.rung + 1) : 1;
  const previewIntervalDays = ([1, 3, 7, 14, 30, 60] as const)[nextRung] ?? 60;
  const lastReviewedDaysAgo = daysAgo(state?.lastReviewedAt ?? new Date().toISOString());

  const provenance = (
    <div className="mb-4 rounded border border-border bg-bg-inset p-3 text-xs">
      <p className="font-medium text-text">{module.title}</p>
      <p className="mt-1 text-text-muted">
        {ordinal(reviewCount + 1)} review · last reviewed {lastReviewedDaysAgo} day{lastReviewedDaysAgo === 1 ? '' : 's'} ago
      </p>
      <p className="mt-1 text-text-muted">Pass → next review in {previewIntervalDays} days</p>
    </div>
  );

  return (
    <QuestionPlayerLayout
      question={question}
      player={{ ...player, submit: handleSubmit }}
      onBack={onEndSession}
      backLabel="End session"
      hideHints
      provenance={provenance}
      headerRight={
        <span className="text-xs uppercase tracking-wide text-text-muted">
          Review · {index + 1} of {entries.length}
        </span>
      }
      subHeader={
        <div className="flex gap-2 overflow-x-auto border-b border-border bg-bg-inset px-4 py-2">
          {entries.map((item, i) => {
            const q = getQuestion(item.questionId);
            const isCurrent = i === index;
            const isDone = i < index;
            return (
              <div
                key={`${item.questionId}-${i}`}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs whitespace-nowrap ${
                  isCurrent
                    ? 'border-accent bg-accent-muted text-text'
                    : isDone
                      ? 'border-border text-text-muted opacity-60'
                      : 'border-border text-text-muted'
                }`}
              >
                {isDone && <span className="text-success">✓</span>}
                <span>{q?.title ?? item.questionId}</span>
              </div>
            );
          })}
        </div>
      }
      footer={
        hasFailed && (
          <div className="mt-4 flex items-center gap-3">
            {skipConfirming && (
              <pre className="w-full overflow-x-auto rounded border border-border bg-bg-inset p-3 font-mono text-xs text-text">
                {question.solution}
              </pre>
            )}
            <button
              type="button"
              onClick={() => void handleSkip()}
              disabled={isFinalizing}
              className="rounded border border-border px-4 py-2 text-sm text-text-muted transition-colors duration-200 ease-out-motion hover:border-accent hover:text-text disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {skipConfirming ? 'Continue →' : 'Skip → (counts as a lapse)'}
            </button>
          </div>
        )
      }
    />
  );
}
