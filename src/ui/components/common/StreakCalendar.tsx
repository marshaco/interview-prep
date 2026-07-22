import { localDateIso } from '../../../engine/srs/streaks';

interface StreakCalendarProps {
  dayLog: string[];
  /** How many full weeks (columns) to show, most recent on the right. */
  weeks?: number;
  today: Date;
}

const DEFAULT_WEEKS = 12;

/**
 * GitHub-style activity heatmap over the last `weeks * 7` days. Columns are
 * simple 7-day blocks ending today, not aligned to calendar week boundaries
 * — a deliberate simplification that keeps the date math trivial while
 * still reading as a familiar "contribution calendar."
 */
export function StreakCalendar({ dayLog, weeks = DEFAULT_WEEKS, today }: StreakCalendarProps) {
  const activeDays = new Set(dayLog);
  const totalDays = weeks * 7;

  const days: string[] = [];
  for (let i = totalDays - 1; i >= 0; i -= 1) {
    const cursor = new Date(today);
    cursor.setDate(cursor.getDate() - i);
    days.push(localDateIso(cursor));
  }

  const columns: string[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    columns.push(days.slice(i, i + 7));
  }

  return (
    <div className="flex gap-[3px] overflow-x-auto pb-1">
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-[3px]">
          {column.map((dayIso) => {
            const isActive = activeDays.has(dayIso);
            const isToday = dayIso === localDateIso(today);
            return (
              <div
                key={dayIso}
                title={`${dayIso}${isActive ? ' — practiced' : ''}`}
                className={`h-3 w-3 rounded-sm ${isActive ? 'bg-success' : 'bg-border'} ${
                  isToday ? 'ring-1 ring-accent ring-offset-1 ring-offset-bg-raised' : ''
                }`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
