import { useState } from 'react';
import { Dialog } from '../common/Dialog';
import { deriveThird, MAX_PACE_MINUTES, MIN_PACE_MINUTES } from '../../../engine/plan/deriveThird';
import type { PlanScope } from '../../../engine/plan/scope';
import { orderModulesByDag } from '../../../engine/roadmap/dag';
import type { PlanContent, PlanProgress } from '../../../engine/plan/projectPlan';
import type { CodeQuestion, RoadmapModule } from '../../../content/types';
import type { PlanRecord, ReviewState } from '../../../storage/types';

const PACE_PRESETS = [15, 30, 45, 60, 90];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // index 0 = Sunday, matches Date#getDay()

type ActiveDays = [boolean, boolean, boolean, boolean, boolean, boolean, boolean];

interface PlanSetupDialogProps {
  modules: RoadmapModule[];
  questions: CodeQuestion[];
  progress: PlanProgress;
  reviewStates: ReviewState[];
  now: string;
  /** Non-null when reopened via "Edit" — prefills every field from the existing plan. */
  initialPlan: PlanRecord | null;
  onStart: (plan: PlanRecord) => void;
  onCancel: () => void;
}

function isGhostModule(module: RoadmapModule): boolean {
  return module.stages.every((stage) => stage.items.length === 0);
}

function formatDate(dateIso: string): string {
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function PlanSetupDialog({ modules, questions, progress, reviewStates, now, initialPlan, onStart, onCancel }: PlanSetupDialogProps) {
  const authoredModules = orderModulesByDag(modules).filter((m) => !isGhostModule(m));

  const [scope, setScope] = useState<PlanScope>(initialPlan?.scope ?? 'all');
  const [mode, setMode] = useState<'pace' | 'date'>(initialPlan?.targetDate ? 'date' : 'pace');
  const [minutesPerDay, setMinutesPerDay] = useState(initialPlan?.minutesPerDay ?? 30);
  const [targetDate, setTargetDate] = useState(initialPlan?.targetDate ?? '');
  const [activeDays, setActiveDays] = useState<ActiveDays>(initialPlan?.activeDays ?? [true, true, true, true, true, true, true]);

  const content: PlanContent = { modules, questions };

  const derivation =
    mode === 'pace'
      ? deriveThird(scope, activeDays, { kind: 'pace', minutesPerDay }, progress, reviewStates, content, now)
      : targetDate
        ? deriveThird(scope, activeDays, { kind: 'date', targetDate }, progress, reviewStates, content, now)
        : null;

  function toggleDay(index: number) {
    setActiveDays((days) => days.map((d, i) => (i === index ? !d : d)) as ActiveDays);
  }

  function handleStart() {
    if (!derivation?.feasible) return;
    onStart({
      scope,
      minutesPerDay: mode === 'pace' ? minutesPerDay : derivation.minutesPerDay,
      activeDays,
      targetDate: mode === 'date' && targetDate ? targetDate : null,
      createdAt: initialPlan?.createdAt ?? now,
      pausedAt: initialPlan?.pausedAt ?? null,
    });
  }

  return (
    <Dialog title={initialPlan ? 'Edit study plan' : 'Set up a study plan'} onClose={onCancel}>
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="plan-scope" className="mb-1.5 block text-xs font-medium text-text-muted">
            Scope
          </label>
          <select
            id="plan-scope"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="w-full rounded border border-border bg-bg-inset px-3 py-2 text-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="all">Everything</option>
            {authoredModules.map((m) => (
              <option key={m.id} value={m.id}>
                Through {m.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Pace</span>
            <button
              type="button"
              onClick={() => setMode((m) => (m === 'pace' ? 'date' : 'pace'))}
              className="text-xs text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {mode === 'pace' ? 'Set a finish date instead →' : 'Set a pace instead →'}
            </button>
          </div>

          {mode === 'pace' ? (
            <div className="flex flex-wrap gap-2">
              {PACE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMinutesPerDay(preset)}
                  className={`rounded border px-3 py-1.5 text-sm transition-colors duration-200 ease-out-motion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    minutesPerDay === preset ? 'border-accent bg-accent-muted text-text' : 'border-border text-text-muted hover:border-accent hover:text-text'
                  }`}
                >
                  {preset}
                </button>
              ))}
              <input
                type="number"
                min={MIN_PACE_MINUTES}
                value={minutesPerDay}
                onChange={(e) => setMinutesPerDay(Math.max(MIN_PACE_MINUTES, Number(e.target.value) || MIN_PACE_MINUTES))}
                aria-label="Custom minutes per day"
                className="w-20 rounded border border-border bg-bg-inset px-2 py-1.5 text-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              <span className="self-center text-sm text-text-muted">min/day</span>
            </div>
          ) : (
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded border border-border bg-bg-inset px-3 py-2 text-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-text-muted">Active days</span>
          <div className="flex gap-1.5">
            {WEEKDAY_LABELS.map((label, index) => (
              <button
                key={index}
                type="button"
                onClick={() => toggleDay(index)}
                aria-pressed={activeDays[index]}
                aria-label={`Toggle ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index]}`}
                className={`h-8 w-8 rounded-full border text-xs transition-colors duration-200 ease-out-motion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  activeDays[index] ? 'border-accent bg-accent-muted text-text' : 'border-border text-text-muted hover:border-accent hover:text-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-text-muted">
          {derivation === null && 'Pick a finish date to see the derived pace.'}
          {derivation?.feasible &&
            mode === 'pace' &&
            (derivation.finishDateIso ? `→ finish ~${formatDate(derivation.finishDateIso)}` : '→ finish date unavailable')}
          {derivation?.feasible && mode === 'date' && `→ ~${derivation.minutesPerDay} min/day`}
          {derivation && !derivation.feasible &&
            (mode === 'date'
              ? `Not reachable by ${targetDate ? formatDate(targetDate) : 'that date'} at any daily pace under ${Math.round(MAX_PACE_MINUTES / 60)}h — pick a later date or narrower scope.`
              : `Even at ${MAX_PACE_MINUTES} min/day this doesn't finish within a couple of years — try a narrower scope.`)}
        </p>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleStart}
            disabled={derivation === null || !derivation.feasible}
            className="rounded bg-accent-solid px-4 py-2 text-sm font-medium text-white transition-colors duration-200 ease-out-motion hover:bg-accent-solid/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {initialPlan ? 'Save changes' : 'Start plan'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-text-muted transition-colors duration-200 ease-out-motion hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Cancel
          </button>
        </div>
      </div>
    </Dialog>
  );
}
