import { useState } from 'react';
import { Dialog } from '../common/Dialog';
import { projectPlan, type PlanContent, type PlanProgress } from '../../../engine/plan/projectPlan';
import { getModule } from '../../../content/registry';
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

function formatDate(dateIso: string): string {
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function weekdayLabel(dateIso: string): string {
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' });
}

function scopeSummary(scope: PlanRecord['scope']): string {
  if (scope === 'all') return 'Everything';
  return `Through ${getModule(scope)?.title ?? scope}`;
}

export function PlanDetailsDialog({ plan, content, progress, reviewStates, now, onEdit, onPause, onDelete, onClose }: PlanDetailsDialogProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const projection = projectPlan({ scope: plan.scope, minutesPerDay: plan.minutesPerDay, activeDays: plan.activeDays }, progress, reviewStates, content, now);
  const upcomingActiveDays = projection.dailyLoad.filter((d) => d.isActiveDay).slice(0, 7);

  return (
    <Dialog title="Study plan" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">
          {scopeSummary(plan.scope)} · {plan.minutesPerDay} min/day
        </p>

        <div className="flex flex-col gap-1.5">
          {upcomingActiveDays.length === 0 && <p className="text-sm text-text-muted">Nothing left to schedule — the scope is complete.</p>}
          {upcomingActiveDays.map((day) => (
            <div key={day.dateIso} className="flex items-center justify-between text-sm">
              <span className="text-text">{weekdayLabel(day.dateIso)}</span>
              <span className="text-text-muted">
                {day.reviewCount} review{day.reviewCount === 1 ? '' : 's'} · {day.newCount} new · ~{Math.round(day.reviewMinutes + day.newMinutes)} min
              </span>
            </div>
          ))}
        </div>

        <p className="text-sm text-text-muted">
          {projection.finishDateIso ? `Projected finish: ~${formatDate(projection.finishDateIso)}` : 'Projected finish: not reached yet — try a shorter scope or more time per day.'}
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
