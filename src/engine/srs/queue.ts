import type { CodeQuestion, QuestionId } from '../../content/types';
import type { ReviewState } from '../../storage/types';

export const DEFAULT_SESSION_CAP = 10;
export const QUICK_SESSION_CAP = 5;

export interface ReviewQueueItem {
  questionId: QuestionId;
  overdueDays: number;
  rung: number;
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.floor((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);
}

/**
 * One adjacent-swap pass: if consecutive items share a module, swap the
 * second with the nearest later item from a different module (Review
 * system spec §3 — "do not over-engineer beyond one adjacent-swap pass").
 * Takes `questions` (not the content registry) so this stays a pure
 * function over its inputs, same pattern computeModuleMastery uses.
 */
function interleaveByModule(items: ReviewQueueItem[], questions: CodeQuestion[]): ReviewQueueItem[] {
  const moduleOf = new Map(questions.map((q) => [q.id, q.moduleId]));
  const result = [...items];
  for (let i = 1; i < result.length; i++) {
    const current = result[i];
    const previous = result[i - 1];
    if (!current || !previous) continue;
    if (moduleOf.get(current.questionId) !== moduleOf.get(previous.questionId)) continue;

    for (let j = i + 1; j < result.length; j++) {
      const candidate = result[j];
      if (candidate && moduleOf.get(candidate.questionId) !== moduleOf.get(previous.questionId)) {
        result[i] = candidate;
        result[j] = current;
        break;
      }
    }
  }
  return result;
}

/**
 * Builds a review session queue (Review system spec §3): every due
 * exercise, ordered most-overdue-first (ties broken by lower rung —
 * fragile memories before stable ones), interleaved across modules, capped
 * at `cap`. Pass `QUICK_SESSION_CAP` for the "Quick 5" variant — it's just
 * the first 5 of the same ordering, not a separately-selected set.
 */
export function buildReviewQueue(
  reviewStates: ReviewState[],
  questions: CodeQuestion[],
  todayIso: string,
  cap = DEFAULT_SESSION_CAP,
): ReviewQueueItem[] {
  const due = reviewStates.filter((state) => state.dueAt <= todayIso);

  const items: ReviewQueueItem[] = due.map((state) => ({
    questionId: state.questionId,
    overdueDays: Math.max(0, daysBetween(state.dueAt, todayIso)),
    rung: state.rung,
  }));

  items.sort((a, b) => b.overdueDays - a.overdueDays || a.rung - b.rung);

  return interleaveByModule(items.slice(0, cap), questions);
}

function addDaysToIso(iso: string, days: number): string {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

/** Count of reviewStates due on the calendar day right after `todayIso` — the caught-up state's forecast line. */
export function countDueTomorrow(reviewStates: ReviewState[], todayIso: string): number {
  const tomorrow = addDaysToIso(todayIso, 1).slice(0, 10);
  return reviewStates.filter((s) => s.dueAt.slice(0, 10) === tomorrow).length;
}

/**
 * Count of reviewStates due within the next 7 calendar days (excluding
 * anything already due today or earlier). Compares calendar dates, not raw
 * timestamps — `todayIso` is a midnight-normalized calendar date (per
 * `localDateIso`) while `dueAt` carries the real time-of-day a review was
 * scheduled at, so a millisecond-level comparison would wrongly exclude an
 * item due exactly 7 days out at any time later than midnight.
 */
export function countDueThisWeek(reviewStates: ReviewState[], todayIso: string): number {
  const today = todayIso.slice(0, 10);
  const cutoff = addDaysToIso(todayIso, 7).slice(0, 10);
  return reviewStates.filter((s) => {
    const dueDate = s.dueAt.slice(0, 10);
    return dueDate > today && dueDate <= cutoff;
  }).length;
}
