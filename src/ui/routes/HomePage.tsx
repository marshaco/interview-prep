import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { modules, questions } from '../../content/registry';
import { computeModuleDepths } from '../../engine/roadmap/dag';
import { selectNextAction, type NextAction } from '../../engine/nextAction/selectNextAction';
import { computeModuleMastery } from '../../engine/mastery/mastery';
import { countSolvedThisWeek, countTotalMastered } from '../../engine/stats/homeStats';
import { currentStreak, localDateIso } from '../../engine/srs/streaks';
import { storageAdapter } from '../storageAdapter';
import { AppShell } from '../components/shell/AppShell';
import { ProgressRing } from '../components/common/ProgressRing';
import { StreakCalendar } from '../components/common/StreakCalendar';
import { PlanStrip } from '../components/plan/PlanStrip';
import { PlanSetupDialog } from '../components/plan/PlanSetupDialog';
import { PlanDetailsDialog } from '../components/plan/PlanDetailsDialog';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { ModuleId, RoadmapModule } from '../../content/types';
import type { Attempt, PlanRecord, ReviewState } from '../../storage/types';

const MIN_DAYS_FOR_HEATMAP = 7;
const CARD_WIDTH = 200;

interface HomeData {
  attempts: Attempt[];
  dayLog: string[];
  reviewStates: ReviewState[];
  learnCompletions: Set<ModuleId>;
  plan: PlanRecord | null;
}

type PlanDialogView = 'none' | 'setup' | 'details';

function moduleQuestionIds(module: RoadmapModule): string[] {
  return module.stages.flatMap((stage) => stage.items.filter((item) => item.type === 'question').map((item) => item.questionId));
}

function isGhostModule(module: RoadmapModule): boolean {
  return module.stages.every((stage) => stage.items.length === 0);
}

/** "Learn ✓ · 3 of 11 solved" when Learn is done, so the ring % and this line never look like they disagree. */
function moduleSubline(module: RoadmapModule, isLearnComplete: boolean, solvedCount: number, totalCount: number): string {
  const hasLearnStage = module.stages.some((stage) => stage.type === 'learn' && stage.items.length > 0);
  const solvedPart = `${solvedCount} of ${totalCount} solved`;
  return hasLearnStage && isLearnComplete ? `Learn ✓ · ${solvedPart}` : solvedPart;
}

function heroCopy(nextAction: NextAction): { text: string; href: string } {
  switch (nextAction.kind) {
    case 'review':
      return { text: `${nextAction.dueCount} review${nextAction.dueCount === 1 ? '' : 's'} due — Start review →`, href: '/review' };
    case 'learn':
      return { text: `Continue: ${nextAction.moduleTitle} — Learn →`, href: nextAction.href };
    case 'exercise':
      return { text: `Continue: ${nextAction.moduleTitle} — ${nextAction.questionTitle} →`, href: nextAction.href };
    case 'none':
      return { text: "You're caught up on everything available — nice work.", href: '/' };
  }
}

/** Real DOM anchor positions for the module cards, so the SVG edge overlay lines up with wherever flex-wrap actually put each card. */
function useCardPositions(ids: string[], ready: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const callbackCache = useRef(new Map<string, (el: HTMLElement | null) => void>());
  const [positions, setPositions] = useState<Map<string, { x: number; y: number; width: number; height: number }>>(new Map());

  // Memoized per-id so the ref identity is stable across renders — an inline
  // `(el) => ...` would make React detach/reattach on every render.
  function setCardRef(id: string) {
    let cb = callbackCache.current.get(id);
    if (!cb) {
      cb = (el: HTMLElement | null) => {
        if (el) cardRefs.current.set(id, el);
        else cardRefs.current.delete(id);
      };
      callbackCache.current.set(id, cb);
    }
    return cb;
  }

  useLayoutEffect(() => {
    function measure() {
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const next = new Map<string, { x: number; y: number; width: number; height: number }>();
      for (const id of ids) {
        const el = cardRefs.current.get(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        next.set(id, {
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        });
      }
      setPositions(next);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
    // `ready` flips false -> true exactly once, after data loads and the real
    // cards (and their refs) exist in the DOM — that's what re-triggers measurement.
  }, [ids, ready]);

  return { containerRef, setCardRef, positions };
}

export function HomePage() {
  useDocumentTitle('Home');
  const [data, setData] = useState<HomeData | null>(null);
  const [planDialog, setPlanDialog] = useState<PlanDialogView>('none');

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      storageAdapter.getAttempts(),
      storageAdapter.getDayLog(),
      storageAdapter.getReviewStates(),
      storageAdapter.getLearnCompletions(),
      storageAdapter.getPlan(),
    ]).then(([attempts, dayLog, reviewStates, learnCompletions, plan]) => {
      if (cancelled) return;
      setData({ attempts, dayLog, reviewStates, learnCompletions: new Set(learnCompletions.map((c) => c.moduleId)), plan });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleStartPlan(plan: PlanRecord) {
    await storageAdapter.savePlan(plan);
    setData((d) => (d ? { ...d, plan } : d));
    setPlanDialog('none');
  }

  async function handlePausePlan() {
    if (!data?.plan) return;
    const paused: PlanRecord = { ...data.plan, pausedAt: new Date().toISOString() };
    await storageAdapter.savePlan(paused);
    setData((d) => (d ? { ...d, plan: paused } : d));
    setPlanDialog('none');
  }

  async function handleResumePlan() {
    if (!data?.plan) return;
    const resumed: PlanRecord = { ...data.plan, pausedAt: null };
    await storageAdapter.savePlan(resumed);
    setData((d) => (d ? { ...d, plan: resumed } : d));
  }

  async function handleDeletePlan() {
    await storageAdapter.deletePlan();
    setData((d) => (d ? { ...d, plan: null } : d));
    setPlanDialog('none');
  }

  const depths = useMemo(() => computeModuleDepths(modules), []);
  const tiers = useMemo(() => {
    const maxDepth = Math.max(0, ...modules.map((m) => depths.get(m.id) ?? 0));
    const rows: RoadmapModule[][] = Array.from({ length: maxDepth + 1 }, () => []);
    for (const module of modules) rows[depths.get(module.id) ?? 0]?.push(module);
    return rows;
  }, [depths]);

  // Only edges into a walkable (non-ghost) target render — a suggested path
  // that ends at "In development" isn't a path you can actually take, and
  // with only 4 authored modules so far, most of the DAG's edges connect
  // two ghosts several tiers apart, which is exactly the tangle/long-edge
  // clutter this filter removes.
  const edges = useMemo(
    () =>
      modules
        .filter((module) => !isGhostModule(module))
        .flatMap((module) => module.prerequisites.map((prereqId) => ({ source: prereqId, target: module.id }))),
    [],
  );

  const allModuleIds = useMemo(() => modules.map((m) => m.id), []);
  const { containerRef, setCardRef, positions } = useCardPositions(allModuleIds, data !== null);

  if (!data) {
    return (
      <AppShell>
        <p className="text-text-muted">Loading…</p>
      </AppShell>
    );
  }

  const today = localDateIso(new Date());
  const nextAction = selectNextAction({
    modules,
    questions,
    attempts: data.attempts,
    reviewStates: data.reviewStates,
    learnCompletions: data.learnCompletions,
    todayIso: today,
  });
  const frontierModuleId = nextAction.kind === 'exercise' || nextAction.kind === 'learn' ? nextAction.moduleId : null;
  const hero = heroCopy(nextAction);

  const streak = currentStreak(data.dayLog, today);
  const solvedThisWeek = countSolvedThisWeek(data.attempts, new Date().toISOString());
  const totalMastered = countTotalMastered(data.attempts);
  const showHeatmap = data.dayLog.length >= MIN_DAYS_FOR_HEATMAP;

  return (
    <AppShell>
      <Link
        to={hero.href}
        className="mb-6 block rounded-lg border border-border bg-bg-elevated px-6 py-5 transition-colors duration-200 ease-out-motion hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <p className="text-lg font-semibold text-accent">{hero.text}</p>
      </Link>

      {(streak > 0 || solvedThisWeek > 0 || totalMastered > 0) && (
        <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-muted">
          <span>
            <span className="font-semibold text-text">{streak}</span> day streak
          </span>
          <span>
            <span className="font-semibold text-text">{solvedThisWeek}</span> solved this week
          </span>
          <span>
            <span className="font-semibold text-text">{totalMastered}</span> mastered
          </span>
        </div>
      )}

      {data.plan && !data.plan.pausedAt ? (
        <PlanStrip
          plan={data.plan}
          content={{ modules, questions }}
          progress={{ attempts: data.attempts, learnCompletions: data.learnCompletions }}
          reviewStates={data.reviewStates}
          now={new Date().toISOString()}
          onOpenDetails={() => setPlanDialog('details')}
        />
      ) : (
        <button
          type="button"
          onClick={() => (data.plan?.pausedAt ? void handleResumePlan() : setPlanDialog('setup'))}
          className="mb-8 block text-sm text-text-muted transition-colors duration-200 ease-out-motion hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {data.plan?.pausedAt ? 'Resume plan →' : 'Set up a study plan →'}
        </button>
      )}

      {planDialog === 'setup' && (
        <PlanSetupDialog
          modules={modules}
          questions={questions}
          progress={{ attempts: data.attempts, learnCompletions: data.learnCompletions }}
          reviewStates={data.reviewStates}
          now={new Date().toISOString()}
          initialPlan={data.plan}
          onStart={(plan) => void handleStartPlan(plan)}
          onCancel={() => setPlanDialog('none')}
        />
      )}

      {planDialog === 'details' && data.plan && (
        <PlanDetailsDialog
          plan={data.plan}
          content={{ modules, questions }}
          progress={{ attempts: data.attempts, learnCompletions: data.learnCompletions }}
          reviewStates={data.reviewStates}
          now={new Date().toISOString()}
          onEdit={() => setPlanDialog('setup')}
          onPause={() => void handlePausePlan()}
          onDelete={() => void handleDeletePlan()}
          onClose={() => setPlanDialog('none')}
        />
      )}

      {showHeatmap && (
        <div className="mb-8">
          <StreakCalendar dayLog={data.dayLog} today={new Date()} />
        </div>
      )}

      <div ref={containerRef} className="relative mt-2 flex flex-col gap-10">
        <svg className="pointer-events-none absolute inset-0 hidden md:block" width="100%" height="100%">
          {edges.map(({ source, target }) => {
            const s = positions.get(source);
            const t = positions.get(target);
            if (!s || !t) return null;
            const x1 = s.x + s.width / 2;
            const y1 = s.y + s.height;
            const x2 = t.x + t.width / 2;
            const y2 = t.y;
            const midY = (y1 + y2) / 2;
            return (
              <path
                key={`${source}->${target}`}
                d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                stroke="var(--color-border-strong)"
                strokeWidth={1.5}
                strokeOpacity={0.25}
                fill="none"
              />
            );
          })}
        </svg>

        {tiers.map((tierModules, tierIndex) => (
          <div key={tierIndex} className="flex flex-wrap gap-4">
            {tierModules.map((module) => {
              const isGhost = isGhostModule(module);
              const isDataStructure = module.kind === 'data_structure';
              const categoryDotClass = isDataStructure ? 'bg-category-ds' : 'bg-accent-secondary';
              const isFrontier = module.id === frontierModuleId;
              const questionIds = moduleQuestionIds(module);
              const solvedCount = questionIds.filter((id) => data.attempts.some((a) => a.questionId === id && a.scorecard.overall === 100)).length;
              const isLearnComplete = data.learnCompletions.has(module.id);
              const progress = computeModuleMastery(module, data.attempts, isLearnComplete);

              if (isGhost) {
                return (
                  <div
                    key={module.id}
                    ref={setCardRef(module.id)}
                    style={{ width: CARD_WIDTH }}
                    className="rounded-lg px-3 py-2.5 opacity-50"
                  >
                    <p className="truncate text-sm font-medium text-text-muted">{module.title}</p>
                    <p className="text-xs text-text-muted">In development</p>
                  </div>
                );
              }

              return (
                <Link
                  key={module.id}
                  to={`/modules/${module.id}`}
                  ref={setCardRef(module.id)}
                  style={{ width: CARD_WIDTH }}
                  className={`flex items-center gap-3 rounded-lg border bg-bg-raised px-3 py-2.5 transition-colors duration-200 ease-out-motion hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isFrontier ? 'border-accent' : 'border-border'
                  }`}
                >
                  <ProgressRing progress={progress} size="sm" isFrontier={isFrontier} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${categoryDotClass}`} aria-hidden />
                      <p className="truncate text-sm font-medium text-text">{module.title}</p>
                    </div>
                    <p className="text-xs text-text-muted">{moduleSubline(module, isLearnComplete, solvedCount, questionIds.length)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
