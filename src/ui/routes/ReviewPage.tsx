import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getModule, getQuestion, modules, questions } from '../../content/registry';
import { computeModuleMastery } from '../../engine/mastery/mastery';
import { selectNextAction } from '../../engine/nextAction/selectNextAction';
import { RUNG_INTERVALS_DAYS } from '../../engine/srs/scheduler';
import { buildReviewQueue, countDueThisWeek, countDueTomorrow, DEFAULT_SESSION_CAP, QUICK_SESSION_CAP } from '../../engine/srs/queue';
import { localDateIso } from '../../engine/srs/streaks';
import { storageAdapter } from '../storageAdapter';
import { AppShell } from '../components/shell/AppShell';
import { ProgressRing } from '../components/common/ProgressRing';
import { ReviewSessionPlayer, type SessionEntry, type SessionOutcome } from '../components/review/ReviewSessionPlayer';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { Attempt, ReviewState } from '../../storage/types';
import type { ModuleId, QuestionId } from '../../content/types';

interface ReviewPageData {
  attempts: Attempt[];
  reviewStates: ReviewState[];
  learnCompletions: Set<ModuleId>;
}

interface SummaryData {
  outcomes: SessionOutcome[];
  masteryBefore: Map<ModuleId, number>;
  masteryAfter: Map<ModuleId, number>;
}

function masteryByModule(attempts: Attempt[], learnCompletions: ReadonlySet<ModuleId>): Map<ModuleId, number> {
  const map = new Map<ModuleId, number>();
  for (const module of modules) {
    map.set(module.id, computeModuleMastery(module, attempts, learnCompletions.has(module.id)));
  }
  return map;
}

function daysAgo(iso: string, todayIso: string): number {
  return Math.max(0, Math.floor((Date.parse(todayIso) - Date.parse(iso)) / 86_400_000));
}

/** Up to 5 reviewable, already-solved questions from the module with the lowest mastery score — the caught-up state's escape hatch (Review system spec §4b). Null if nothing qualifies anywhere. */
function weakestModuleDrill(data: ReviewPageData, todayIso: string): SessionEntry[] | null {
  let best: { mastery: number; entries: SessionEntry[] } | null = null;
  for (const module of modules) {
    const candidateIds = module.stages
      .flatMap((stage) => stage.items.filter((item) => item.type === 'question').map((item) => item.questionId))
      .filter((id) => {
        const question = getQuestion(id);
        return question?.reviewable && data.attempts.some((a) => a.questionId === id && a.scorecard.overall === 100);
      });
    if (candidateIds.length === 0) continue;
    const mastery = computeModuleMastery(module, data.attempts, data.learnCompletions.has(module.id));
    if (!best || mastery < best.mastery) {
      best = {
        mastery,
        entries: candidateIds.slice(0, 5).map((id) => ({
          questionId: id,
          wasDue: data.reviewStates.some((s) => s.questionId === id && s.dueAt <= todayIso),
        })),
      };
    }
  }
  return best?.entries ?? null;
}

export function ReviewPage() {
  useDocumentTitle('Review');
  // Read once at mount, not reactive state — a ref (rather than useState)
  // so it never has to appear in an effect's dependency array.
  const initialStartIdRef = useRef(new URLSearchParams(window.location.search).get('start'));
  const [data, setData] = useState<ReviewPageData | null>(null);
  const [sessionEntries, setSessionEntries] = useState<SessionEntry[] | null>(null);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessionOutcomes, setSessionOutcomes] = useState<SessionOutcome[]>([]);
  const [sessionMasteryBefore, setSessionMasteryBefore] = useState<Map<ModuleId, number> | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  const startSession = useCallback(
    (entries: SessionEntry[], attemptsSnapshot: Attempt[], learnCompletions: ReadonlySet<ModuleId>) => {
      if (entries.length === 0) return;
      setSessionEntries(entries);
      setSessionIndex(0);
      setSessionOutcomes([]);
      setSessionMasteryBefore(masteryByModule(attemptsSnapshot, learnCompletions));
      setSummary(null);
    },
    [],
  );

  async function refreshData(): Promise<ReviewPageData> {
    const [attempts, reviewStates, learnCompletions] = await Promise.all([
      storageAdapter.getAttempts(),
      storageAdapter.getReviewStates(),
      storageAdapter.getLearnCompletions(),
    ]);
    const next: ReviewPageData = { attempts, reviewStates, learnCompletions: new Set(learnCompletions.map((c) => c.moduleId)) };
    setData(next);
    return next;
  }

  // Fetches on mount and, if the page was opened as a Module-page due-glyph
  // launch (?start=<questionId>), immediately starts that single-item
  // session once the data needed to build its provenance is in hand.
  useEffect(() => {
    let cancelled = false;
    void Promise.all([storageAdapter.getAttempts(), storageAdapter.getReviewStates(), storageAdapter.getLearnCompletions()]).then(
      ([attempts, reviewStates, learnCompletionsRaw]) => {
        if (cancelled) return;
        const learnCompletions = new Set(learnCompletionsRaw.map((c) => c.moduleId));
        setData({ attempts, reviewStates, learnCompletions });

        const startId = initialStartIdRef.current;
        if (startId) {
          const state = reviewStates.find((s) => s.questionId === startId);
          const wasDue = state ? state.dueAt <= localDateIso(new Date()) : false;
          startSession([{ questionId: startId, wasDue }], attempts, learnCompletions);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [startSession]);

  const today = localDateIso(new Date());

  async function finishSession(outcomes: SessionOutcome[]) {
    const fresh = await refreshData();
    setSummary({
      outcomes,
      masteryBefore: sessionMasteryBefore ?? new Map<ModuleId, number>(),
      masteryAfter: masteryByModule(fresh.attempts, fresh.learnCompletions),
    });
    setSessionEntries(null);
  }

  function handleResolved(outcome: SessionOutcome) {
    const nextOutcomes = [...sessionOutcomes, outcome];
    setSessionOutcomes(nextOutcomes);
    if (sessionIndex + 1 >= (sessionEntries?.length ?? 0)) {
      void finishSession(nextOutcomes);
    } else {
      setSessionIndex((i) => i + 1);
    }
  }

  function handleEndSession() {
    void finishSession(sessionOutcomes);
  }

  if (!data) {
    return (
      <AppShell>
        <p className="text-text-muted">Loading…</p>
      </AppShell>
    );
  }

  if (sessionEntries) {
    const reviewStatesById = new Map(data.reviewStates.map((s) => [s.questionId, s]));
    const reviewCountsById = new Map<QuestionId, number>();
    for (const id of new Set(sessionEntries.map((e) => e.questionId))) {
      reviewCountsById.set(id, data.attempts.filter((a) => a.questionId === id && a.context === 'review').length);
    }
    return (
      <ReviewSessionPlayer
        // A fresh key per queue item remounts the player instead of resetting
        // per-item state (submit count, skip-confirm) via an effect.
        key={`${sessionIndex}-${sessionEntries[sessionIndex]?.questionId ?? 'none'}`}
        entries={sessionEntries}
        index={sessionIndex}
        reviewStatesById={reviewStatesById}
        reviewCountsById={reviewCountsById}
        onResolved={handleResolved}
        onEndSession={handleEndSession}
      />
    );
  }

  if (summary) {
    const passed = summary.outcomes.filter((o) => o.passed);
    const lapsed = summary.outcomes.filter((o) => !o.passed);
    const touchedModuleIds = [...new Set(summary.outcomes.map((o) => o.moduleId))];
    const dueThisWeek = countDueThisWeek(data.reviewStates, today);
    const dueTomorrow = countDueTomorrow(data.reviewStates, today);
    const forecast =
      dueTomorrow > 0
        ? `Next: ${dueTomorrow} due tomorrow`
        : dueThisWeek > 0
          ? `Next: ${dueThisWeek} due this week`
          : 'Next: nothing due for a while';
    const nextAction = selectNextAction({
      modules,
      questions,
      attempts: data.attempts,
      reviewStates: data.reviewStates,
      learnCompletions: data.learnCompletions,
      todayIso: today,
    });
    const continueAction =
      nextAction.kind === 'exercise' || nextAction.kind === 'learn'
        ? { label: `Continue practicing: ${nextAction.moduleTitle} →`, href: nextAction.href }
        : null;

    return (
      <AppShell>
        <h1 className="mb-6 text-xl font-semibold text-text">Session complete</h1>

        {passed.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Passed</h2>
            <div className="flex flex-col gap-1.5">
              {passed.map((o, i) => (
                <div key={`${o.questionId}-${i}`} className="flex items-center gap-2 text-sm text-text">
                  <span className="text-success">✓</span>
                  <span>{getQuestion(o.questionId)?.title ?? o.questionId}</span>
                  <span className="text-text-muted">({getModule(o.moduleId)?.title ?? o.moduleId})</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {lapsed.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Lapsed</h2>
            <div className="flex flex-col gap-1.5">
              {lapsed.map((o, i) => (
                <div key={`${o.questionId}-${i}`} className="flex items-center gap-2 text-sm text-text">
                  <span className="text-text-muted">↺</span>
                  <span>{getQuestion(o.questionId)?.title ?? o.questionId}</span>
                  <span className="text-text-muted">({getModule(o.moduleId)?.title ?? o.moduleId})</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {touchedModuleIds.length > 0 && (
          <section className="mb-6 flex flex-wrap gap-6">
            {touchedModuleIds.map((moduleId) => (
              <MasteryDelta
                key={moduleId}
                title={getModule(moduleId)?.title ?? moduleId}
                from={summary.masteryBefore.get(moduleId) ?? 0}
                to={summary.masteryAfter.get(moduleId) ?? 0}
              />
            ))}
          </section>
        )}

        <p className="mb-6 text-sm text-text-muted">{forecast}</p>

        {continueAction ? (
          <Link
            to={continueAction.href}
            className="inline-block rounded bg-accent-solid px-4 py-2 text-sm font-medium text-white transition-colors duration-200 ease-out-motion hover:bg-accent-solid/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {continueAction.label}
          </Link>
        ) : (
          <Link
            to="/"
            className="inline-block rounded bg-accent-solid px-4 py-2 text-sm font-medium text-white transition-colors duration-200 ease-out-motion hover:bg-accent-solid/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Done →
          </Link>
        )}
      </AppShell>
    );
  }

  const dueQueue = buildReviewQueue(data.reviewStates, questions, today, DEFAULT_SESSION_CAP);
  const totalDueCount = data.reviewStates.filter((s) => s.dueAt <= today).length;

  if (totalDueCount === 0) {
    const poolEmpty = data.reviewStates.length === 0;
    const dueTomorrow = countDueTomorrow(data.reviewStates, today);
    const dueThisWeek = countDueThisWeek(data.reviewStates, today);
    const drillEntries = poolEmpty ? null : weakestModuleDrill(data, today);

    if (poolEmpty) {
      const nextAction = selectNextAction({
        modules,
        questions,
        attempts: data.attempts,
        reviewStates: data.reviewStates,
        learnCompletions: data.learnCompletions,
        todayIso: today,
      });
      const continueHref = nextAction.kind === 'exercise' || nextAction.kind === 'learn' ? nextAction.href : '/';
      return (
        <AppShell>
          <p className="mb-2 text-lg font-semibold text-text">All caught up</p>
          <p className="mb-6 text-sm text-text-muted">
            Solved exercises come back for review on a spaced schedule — nothing here yet.
          </p>
          <Link
            to={continueHref}
            className="inline-block rounded bg-accent-solid px-4 py-2 text-sm font-medium text-white transition-colors duration-200 ease-out-motion hover:bg-accent-solid/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Continue practicing →
          </Link>
        </AppShell>
      );
    }

    return (
      <AppShell>
        <p className="mb-2 text-lg font-semibold text-text">All caught up</p>
        <p className="mb-6 text-sm text-text-muted">
          {dueTomorrow} due tomorrow · {dueThisWeek} due this week
        </p>
        {drillEntries && (
          <button
            type="button"
            onClick={() => startSession(drillEntries, data.attempts, data.learnCompletions)}
            className="rounded border border-border px-4 py-2 text-sm text-text transition-colors duration-200 ease-out-motion hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Drill weakest module →
          </button>
        )}
      </AppShell>
    );
  }

  const estimatedMinutes = totalDueCount * 6;

  return (
    <AppShell>
      <button
        type="button"
        onClick={() => startSession(dueQueue.map((item) => ({ questionId: item.questionId, wasDue: true })), data.attempts, data.learnCompletions)}
        className="mb-2 block w-full rounded-lg border border-border bg-bg-elevated px-6 py-5 text-left transition-colors duration-200 ease-out-motion hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <p className="text-lg font-semibold text-accent">
          {totalDueCount} due — Start session →
        </p>
      </button>
      <div className="mb-6 flex items-center gap-4">
        <p className="text-sm text-text-muted">~{estimatedMinutes} min</p>
        {totalDueCount > QUICK_SESSION_CAP && (
          <button
            type="button"
            onClick={() =>
              startSession(
                dueQueue.slice(0, QUICK_SESSION_CAP).map((item) => ({ questionId: item.questionId, wasDue: true })),
                data.attempts,
                data.learnCompletions,
              )
            }
            className="text-sm text-text-muted underline-offset-2 transition-colors duration-200 ease-out-motion hover:text-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Quick 5 →
          </button>
        )}
      </div>

      <table className="w-full text-left text-sm text-text-muted">
        <thead>
          <tr className="border-b border-border/50 text-xs uppercase tracking-wide">
            <th className="py-2 font-medium">Exercise</th>
            <th className="py-2 font-medium">Module</th>
            <th className="py-2 font-medium">Last reviewed</th>
            <th className="py-2 font-medium">Interval</th>
          </tr>
        </thead>
        <tbody>
          {dueQueue.map((item) => {
            const question = getQuestion(item.questionId);
            const state = data.reviewStates.find((s) => s.questionId === item.questionId);
            const intervalDays = RUNG_INTERVALS_DAYS[item.rung] ?? RUNG_INTERVALS_DAYS[0];
            return (
              <tr key={item.questionId} className="border-b border-border/30">
                <td className="py-2 text-text">{question?.title ?? item.questionId}</td>
                <td className="py-2">{question ? (getModule(question.moduleId)?.title ?? question.moduleId) : ''}</td>
                <td className="py-2">{state ? `${daysAgo(state.lastReviewedAt, today)}d ago` : '—'}</td>
                <td className="py-2">{intervalDays}d</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </AppShell>
  );
}

function MasteryDelta({ title, from, to }: { title: string; from: number; to: number }) {
  const [progress, setProgress] = useState(from);
  useEffect(() => {
    const handle = requestAnimationFrame(() => setProgress(to));
    return () => cancelAnimationFrame(handle);
  }, [to]);

  const deltaPct = Math.round((to - from) * 100);
  return (
    <div className="flex items-center gap-3">
      <ProgressRing progress={progress} size="lg" />
      <div>
        <p className="text-sm font-medium text-text">{title}</p>
        <p className="text-xs text-text-muted">
          {deltaPct >= 0 ? '+' : ''}
          {deltaPct}%
        </p>
      </div>
    </div>
  );
}
