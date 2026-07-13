/**
 * Local-timezone date string (YYYY-MM-DD), per ARCHITECTURE §7.4 ("Streak =
 * consecutive-day count computed at read time in the user's local
 * timezone"). Deliberately uses Date's local getters, not `toISOString()`
 * (which is UTC) — using UTC here would misattribute activity near a
 * timezone boundary to the wrong calendar day.
 */
export function localDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDaysIso(dateIso: string, delta: number): string {
  const [year, month, day] = dateIso.split('-').map(Number);
  const date = new Date(year ?? 0, (month ?? 1) - 1, day ?? 0);
  date.setDate(date.getDate() + delta);
  return localDateIso(date);
}

/**
 * Consecutive days of activity ending today (or, if today has no entry yet,
 * ending yesterday — the streak isn't broken until a full day is skipped).
 */
export function currentStreak(dayLog: string[], todayIso: string): number {
  const days = new Set(dayLog);
  let cursor = days.has(todayIso) ? todayIso : addDaysIso(todayIso, -1);
  if (!days.has(cursor)) return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDaysIso(cursor, -1);
  }
  return streak;
}

/** Longest run of consecutive days anywhere in the log. */
export function longestStreak(dayLog: string[]): number {
  const sortedDays = [...new Set(dayLog)].sort();
  let longest = 0;
  let running = 0;
  let previous: string | null = null;

  for (const day of sortedDays) {
    running = previous !== null && addDaysIso(previous, 1) === day ? running + 1 : 1;
    longest = Math.max(longest, running);
    previous = day;
  }

  return longest;
}
