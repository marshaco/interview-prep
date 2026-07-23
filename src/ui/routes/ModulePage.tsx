import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getModule, modules, questions } from '../../content/registry';
import { computeModuleMastery } from '../../engine/mastery/mastery';
import { selectNextAction } from '../../engine/nextAction/selectNextAction';
import { localDateIso } from '../../engine/srs/streaks';
import { storageAdapter } from '../storageAdapter';
import { AppShell } from '../components/shell/AppShell';
import { EmptyState } from '../components/common/EmptyState';
import { ProgressRing } from '../components/common/ProgressRing';
import { ModuleStepper } from '../components/module/ModuleStepper';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { Attempt, ReviewState } from '../../storage/types';
import type { ModuleId } from '../../content/types';

interface ModulePageData {
  attempts: Attempt[];
  reviewStates: ReviewState[];
  learnCompletions: Set<ModuleId>;
}

export function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const module = moduleId ? getModule(moduleId) : undefined;
  useDocumentTitle(module?.title ?? 'Module');
  const [data, setData] = useState<ModulePageData | null>(null);

  useEffect(() => {
    if (!module) return;
    let cancelled = false;
    void Promise.all([
      storageAdapter.getAttempts(),
      storageAdapter.getReviewStates(),
      storageAdapter.getLearnCompletions(),
    ]).then(([attempts, reviewStates, learnCompletions]) => {
      if (cancelled) return;
      setData({ attempts, reviewStates, learnCompletions: new Set(learnCompletions.map((c) => c.moduleId)) });
    });
    return () => {
      cancelled = true;
    };
  }, [module]);

  if (!module) {
    return (
      <EmptyState
        title="Module not found"
        description="This roadmap node doesn't exist, or its id changed."
        actionLabel="← Back to home"
        actionHref="/"
      />
    );
  }

  if (!data) {
    return (
      <AppShell>
        <p className="text-text-muted">Loading…</p>
      </AppShell>
    );
  }

  const category = module.kind === 'data_structure' ? 'Data Structures' : 'Algorithms';
  const categoryText = module.kind === 'data_structure' ? 'text-accent' : 'text-accent-secondary';
  const dependents = modules.filter((m) => m.prerequisites.includes(module.id)).map((m) => m.title);
  const isLearnComplete = data.learnCompletions.has(module.id);
  const progress = computeModuleMastery(module, data.attempts, isLearnComplete);
  const today = localDateIso(new Date());

  // Same ProgressSnapshot Home uses — the ring on this header is the same
  // identity element, so it must agree on which module is the frontier.
  const nextAction = selectNextAction({
    modules,
    questions,
    attempts: data.attempts,
    reviewStates: data.reviewStates,
    learnCompletions: data.learnCompletions,
    todayIso: today,
  });
  const isFrontier = (nextAction.kind === 'exercise' || nextAction.kind === 'learn') && nextAction.moduleId === module.id;

  return (
    <AppShell>
      <Link
        to="/"
        className="mb-6 inline-block text-sm text-text-muted transition-colors duration-200 ease-out-motion hover:text-accent"
      >
        ← Home
      </Link>

      <div className="mb-10 flex items-start gap-4">
        <ProgressRing progress={progress} size="lg" isFrontier={isFrontier} />
        <div className="min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wide ${categoryText}`}>{category}</p>
          <h1 className="mt-1 text-xl font-semibold text-text">{module.title}</h1>
          <p className="mt-1 text-sm text-text-muted">{module.summary}</p>
          {dependents.length > 0 && <p className="mt-2 text-xs text-text-muted">Leads to: {dependents.join(', ')}</p>}
        </div>
      </div>

      <ModuleStepper
        module={module}
        attempts={data.attempts}
        isLearnComplete={isLearnComplete}
        reviewStates={data.reviewStates}
        todayIso={today}
      />
    </AppShell>
  );
}
