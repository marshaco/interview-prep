import { useState } from 'react';
import { Dialog } from '../common/Dialog';
import { formatPlanDate, roundMinutes } from './planFormat';
import { projectPlan, type DayLoad, type PlanContent, type PlanProgress } from '../../../engine/plan/projectPlan';
import { resolvePlanInputs } from '../../../engine/plan/resolvePlanInputs';
import { allAuthoredModuleIds } from '../../../engine/plan/scope';
import { getModule } from '../../../content/registry';
import type { RoadmapModule } from '../../../content/types';
import type { PlanRecord, ReviewState } from '../../../storage/types';

interface PlanDetailsDialogProps {
  plan: PlanRecord;
  content: PlanContent;
  progress: PlanProgress;
  reviewStates: ReviewState[];
  now: string;
  onEdit: () => void;
  onPause: () => void;
  onDelete: () => void;
  onClose: () => void;
}

/** "Thu 24" — weekday plus day-of-month, so every row in the day list is checkable against a calendar (Study plan revision spec §5). */
function dayLabel(dateIso: string): string {
  const date = new Date(`${dateIso}T00:00:00`);
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  return `${weekday} ${date.getDate()}`;
}

/** Every calendar day through the Nth active one, inclusive of any rest days in between — the day list must account for every day so the finish date is checkable by eye, not just list the active days in isolation. */
function daysThroughNActiveDays(dailyLoad: DayLoad[], n: number): DayLoad[] {
  let activeCount = 0;
  const result: DayLoad[] = [];
  for (const day of dailyLoad) {
    result.push(day);
    if (day.isActiveDay) activeCount += 1;
    if (activeCount >= n) break;
  }
  return result;
}

function scopeSummary(scope: PlanRecord['scope'], modules: RoadmapModule[]): string {
  const allAuthored = allAuthoredModuleIds(modules);
  if (allAuthored.length > 0 && allAuthored.every((id) => scope.includes(id)) && scope.length === allAuthored.length) {
    return 'Everything';
  }
  if (scope.length === 0) return 'No modules selected';
  const titles = scope.map((id) => getModule(id)?.title ?? id);
  return titles.join(', ');
}

export function PlanDetailsDialog({ plan, content, progress, reviewStates, now, onEdit, onPause, onDelete, onClose }: PlanDetailsDialogProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const planInputs = resolvePlanInputs(plan, progress, reviewStates, content, now);
  const projection = projectPlan(planInputs, progress, reviewStates, content, now);
  const days = daysThroughNActiveDays(projection.dailyLoad, 7);

  return (
    <Dialog title="Study plan" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">
          {scopeSummary(plan.scope, content.modules)} · {roundMinutes(planInputs.minutesPerDay)} min/day
        </p>

        <div className="flex flex-col gap-1.5">
          {days.length === 0 && <p className="text-sm text-text-muted">Nothing left to schedule — the scope is complete.</p>}
          {days.map((day) =>
            day.isActiveDay ? (
              <div key={day.dateIso} className="flex items-center justify-between text-sm">
                <span className="text-text">{dayLabel(day.dateIso)}</span>
                <span className="text-text-muted">
                  {day.reviewCount} review{day.reviewCount === 1 ? '' : 's'} · {day.newCount} new · {roundMinutes(day.reviewMinutes + day.newMinutes)} min
                </span>
              </div>
            ) : (
              <div key={day.dateIso} className="flex items-center justify-between text-sm opacity-60">
                <span className="text-text-muted">{dayLabel(day.dateIso)}</span>
                <span className="text-text-muted">rest</span>
              </div>
            ),
          )}
        </div>

        <p className="text-sm text-text-muted">
          {projection.finishDateIso ? `Projected finish: ${formatPlanDate(projection.finishDateIso)}` : 'Projected finish: not reached yet — try a shorter scope or more time per day.'}
        </p>

        <div className="flex items-center gap-4 border-t border-border pt-4">
          <button type="button" onClick={onEdit} className="text-sm text-text-muted transition-colors duration-200 ease-out-motion hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Edit
          </button>
          <button type="button" onClick={onPause} className="text-sm text-text-muted transition-colors duration-200 ease-out-motion hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Pause
          </button>
          {confirmingDelete ? (
            <>
              <span className="text-sm text-text-muted">Delete this plan?</span>
              <button type="button" onClick={onDelete} className="text-sm text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="text-sm text-text-muted transition-colors duration-200 ease-out-motion hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Never mind
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="text-sm text-text-muted transition-colors duration-200 ease-out-motion hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
