import { projectPlan, type DayLoad, type PlanContent, type PlanProgress } from '../../../engine/plan/projectPlan';
import { todayTarget } from '../../../engine/plan/todayTarget';
import type { PlanRecord, ReviewState } from '../../../storage/types';

interface PlanStripProps {
  plan: PlanRecord;
  content: PlanContent;
  progress: PlanProgress;
  reviewStates: ReviewState[];
  now: string;
  onOpenDetails: () => void;
}

function formatDate(dateIso: string): string {
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function shapeOf(day: DayLoad | undefined): string {
  if (!day) return 'nothing';
  return `${day.reviewCount} review${day.reviewCount === 1 ? '' : 's'} · ${day.newCount} new`;
}

/**
 * The active-plan strip (Study plan spec §4c) — the plan's entire footprint
 * on any screen besides its own dialogs. Deliberately carries no accent:
 * the hero stays the screen's one accent element, and this strip only
 * contextualizes it. Dry copy only — no "behind"/"missed"/"overdue" and no
 * red/warning color, by design (guidance, not gates).
 */
export function PlanStrip({ plan, content, progress, reviewStates, now, onOpenDetails }: PlanStripProps) {
  const planInputs = { scope: plan.scope, minutesPerDay: plan.minutesPerDay, activeDays: plan.activeDays };
  const dayTarget = todayTarget(planInputs, progress, reviewStates, content, now);
  const projection = projectPlan(planInputs, progress, reviewStates, content, now);
  const tomorrow = projection.dailyLoad[1];

  const statusText = (() => {
    if (!projection.finishDateIso) return null;
    if (plan.targetDate && projection.finishDateIso > plan.targetDate) {
      return `Finish moved to ${formatDate(projection.finishDateIso)}`;
    }
    return `On track — finish ~${formatDate(projection.finishDateIso)}`;
  })();

  const bodyText = !dayTarget.isActiveDay
    ? `Rest day · next: ${shapeOf(tomorrow)} tomorrow`
    : dayTarget.isDoneForToday
      ? `Done for today · next: ${shapeOf(tomorrow)}`
      : `Today: ${dayTarget.dueReviewCount} review${dayTarget.dueReviewCount === 1 ? '' : 's'} · ${dayTarget.newExerciseCount} new · ~${dayTarget.budgetMinutes} min`;

  const progressPct = dayTarget.budgetMinutes > 0 ? Math.min(1, dayTarget.minutesSpentToday / dayTarget.budgetMinutes) : 0;

  return (
    <button
      type="button"
      onClick={onOpenDetails}
      className="mb-8 flex w-full flex-col gap-2 rounded-lg border border-border bg-bg-raised px-4 py-3 text-left transition-colors duration-200 ease-out-motion hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-text">
          {dayTarget.isDoneForToday && <span className="mr-1.5 text-success">✓</span>}
          {bodyText}
        </p>
        {statusText && <p className="shrink-0 text-xs text-text-muted">{statusText}</p>}
      </div>
      {dayTarget.isActiveDay && !dayTarget.isDoneForToday && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-text-muted transition-[width] duration-300 ease-out-motion motion-reduce:transition-none"
            style={{ width: `${progressPct * 100}%` }}
          />
        </div>
      )}
    </button>
  );
}
