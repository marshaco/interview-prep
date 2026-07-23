import { useState } from 'react';
import { Dialog } from '../common/Dialog';
import { PlanScopeMap } from './PlanScopeMap';
import { formatPlanDate, roundMinutes } from './planFormat';
import { deriveThird, MAX_PACE_MINUTES, MIN_PACE_MINUTES } from '../../../engine/plan/deriveThird';
import { allAuthoredModuleIds } from '../../../engine/plan/scope';
import type { PlanContent, PlanProgress } from '../../../engine/plan/projectPlan';
import type { CodeQuestion, ModuleId, RoadmapModule } from '../../../content/types';
import type { PlanRecord, ReviewState } from '../../../storage/types';

const PACE_PRESETS = [15, 30, 45, 60, 90];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // index 0 = Sunday, matches Date#getDay()

type ActiveDays = [boolean, boolean, boolean, boolean, boolean, boolean, boolean];
type Mode = 'pace' | 'date';
type PaceSelection = number | 'custom';

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

/** Which chip a given minutesPerDay value corresponds to — a preset if it matches exactly, otherwise 'custom' (Study plan revision spec §5: one pace control, not two). */
function paceSelectionFor(minutesPerDay: number): PaceSelection {
  return PACE_PRESETS.includes(minutesPerDay) ? minutesPerDay : 'custom';
}

export function PlanSetupDialog({ modules, questions, progress, reviewStates, now, initialPlan, onStart, onCancel }: PlanSetupDialogProps) {
  const [scope, setScope] = useState<ModuleId[]>(initialPlan?.scope ?? allAuthoredModuleIds(modules));
  const [mode, setMode] = useState<Mode>(initialPlan?.pace.mode ?? 'pace');
  const initialMinutesPerDay = initialPlan?.pace.mode === 'pace' ? initialPlan.pace.minutesPerDay : 30;
  const [paceSelection, setPaceSelection] = useState<PaceSelection>(paceSelectionFor(initialMinutesPerDay));
  const [customMinutes, setCustomMinutes] = useState(paceSelectionFor(initialMinutesPerDay) === 'custom' ? initialMinutesPerDay : 30);
  const [targetDate, setTargetDate] = useState(initialPlan?.pace.mode === 'date' ? initialPlan.pace.targetDate : '');
  const [activeDays, setActiveDays] = useState<ActiveDays>(initialPlan?.activeDays ?? [true, true, true, true, true, true, true]);

  const minutesPerDay = paceSelection === 'custom' ? customMinutes : paceSelection;
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

  // Switching modes converts whatever's currently derived into the new
  // mode's input, so nothing is lost — the triangle just gets viewed from
  // its other side (Study plan revision spec §3).
  function switchMode(nextMode: Mode) {
    if (nextMode === mode) return;
    if (nextMode === 'date' && derivation?.feasible && derivation.finishDateIso) {
      setTargetDate(derivation.finishDateIso);
    } else if (nextMode === 'pace' && derivation?.feasible) {
      const selection = paceSelectionFor(derivation.minutesPerDay);
      setPaceSelection(selection);
      if (selection === 'custom') setCustomMinutes(derivation.minutesPerDay);
    }
    setMode(nextMode);
  }

  function handleStart() {
    if (!derivation?.feasible) return;
    const pace: PlanRecord['pace'] = mode === 'pace' ? { mode: 'pace', minutesPerDay } : { mode: 'date', targetDate: targetDate };
    onStart({
      scope,
      pace,
      activeDays,
      createdAt: initialPlan?.createdAt ?? now,
      pausedAt: initialPlan?.pausedAt ?? null,
    });
  }

  return (
    <Dialog title={initialPlan ? 'Edit study plan' : 'Set up a study plan'} onClose={onCancel}>
      <div className="flex flex-col gap-5">
        <PlanScopeMap modules={modules} questions={questions} selected={scope} onChange={setScope} />

        <div>
          <div className="mb-2 inline-flex rounded border border-border p-0.5">
            <button
              type="button"
              onClick={() => switchMode('pace')}
              aria-pressed={mode === 'pace'}
              className={`rounded px-3 py-1 text-xs transition-colors duration-200 ease-out-motion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                mode === 'pace' ? 'bg-accent-muted text-text' : 'text-text-muted hover:text-text'
              }`}
            >
              Daily time
            </button>
            <button
              type="button"
              onClick={() => switchMode('date')}
              aria-pressed={mode === 'date'}
              className={`rounded px-3 py-1 text-xs transition-colors duration-200 ease-out-motion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                mode === 'date' ? 'bg-accent-muted text-text' : 'text-text-muted hover:text-text'
              }`}
            >
              Finish date
            </button>
          </div>

          {mode === 'pace' ? (
            <div className="flex flex-wrap items-center gap-2">
              {PACE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPaceSelection(preset)}
                  aria-pressed={paceSelection === preset}
                  className={`rounded border px-3 py-1.5 text-sm transition-colors duration-200 ease-out-motion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    paceSelection === preset ? 'border-accent bg-accent-muted text-text' : 'border-border text-text-muted hover:border-accent hover:text-text'
                  }`}
                >
                  {preset}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPaceSelection('custom')}
                aria-pressed={paceSelection === 'custom'}
                className={`rounded border px-3 py-1.5 text-sm transition-colors duration-200 ease-out-motion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  paceSelection === 'custom' ? 'border-accent bg-accent-muted text-text' : 'border-border text-text-muted hover:border-accent hover:text-text'
                }`}
              >
                Custom
              </button>
              {paceSelection === 'custom' && (
                <input
                  type="number"
                  min={MIN_PACE_MINUTES}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.max(MIN_PACE_MINUTES, Number(e.target.value) || MIN_PACE_MINUTES))}
                  aria-label="Custom minutes per day"
                  className="w-20 rounded border border-border bg-bg-inset px-2 py-1.5 text-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                />
              )}
              <span className="text-sm text-text-muted">min/day</span>
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
                  activeDays[index] ? 'border-accent bg-accent-solid text-white' : 'border-border text-text-muted hover:border-accent hover:text-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-text-muted">
          {mode === 'date' && !targetDate && 'Pick a finish date to see the derived pace.'}
          {derivation?.feasible && mode === 'pace' && derivation.finishDateIso && `Finish: ${formatPlanDate(derivation.finishDateIso)}`}
          {derivation?.feasible && mode === 'date' && `${roundMinutes(derivation.minutesPerDay)} min/day`}
          {derivation && !derivation.feasible && mode === 'date' && `Needs ${MAX_PACE_MINUTES}+ min/day — extend the date or narrow the scope`}
          {derivation && !derivation.feasible && mode === 'pace' && `Even at ${MAX_PACE_MINUTES} min/day this doesn't finish within a couple of years — try a narrower scope`}
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
