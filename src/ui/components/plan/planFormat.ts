/** "Oct 20" — the one date format every plan surface uses (Study plan revision spec §5: no tildes, plain and checkable). */
export function formatPlanDate(dateIso: string): string {
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Rounds a displayed minutes value to the nearest 5 (Study plan revision spec §5) — applies to derived/computed displays, never to a live input field showing exactly what the user typed. */
export function roundMinutes(minutes: number): number {
  return Math.round(minutes / 5) * 5;
}
