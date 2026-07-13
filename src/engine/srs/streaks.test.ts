import { describe, expect, it } from 'vitest';
import { currentStreak, localDateIso, longestStreak } from './streaks';

describe('localDateIso', () => {
  it('formats using local date components, not UTC', () => {
    // 11:30pm local time should stay on the same local calendar day
    // regardless of what UTC date that instant falls on.
    const date = new Date(2026, 0, 15, 23, 30, 0); // Jan 15 2026, local time
    expect(localDateIso(date)).toBe('2026-01-15');
  });
});

describe('currentStreak', () => {
  it('is 0 with an empty day log', () => {
    expect(currentStreak([], '2026-01-10')).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    const log = ['2026-01-08', '2026-01-09', '2026-01-10'];
    expect(currentStreak(log, '2026-01-10')).toBe(3);
  });

  it('still counts the streak as alive if yesterday was logged but today has no entry yet', () => {
    const log = ['2026-01-08', '2026-01-09'];
    expect(currentStreak(log, '2026-01-10')).toBe(2);
  });

  it('is broken (0) if a full day was skipped', () => {
    const log = ['2026-01-05', '2026-01-06'];
    expect(currentStreak(log, '2026-01-10')).toBe(0);
  });

  it('ignores days after today and non-consecutive gaps', () => {
    const log = ['2026-01-01', '2026-01-08', '2026-01-09', '2026-01-10'];
    expect(currentStreak(log, '2026-01-10')).toBe(3);
  });
});

describe('longestStreak', () => {
  it('is 0 with an empty day log', () => {
    expect(longestStreak([])).toBe(0);
  });

  it('finds the longest run even if it is not the most recent one', () => {
    const log = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-10', '2026-01-20'];
    expect(longestStreak(log)).toBe(3);
  });

  it('handles unsorted and duplicate entries', () => {
    const log = ['2026-01-03', '2026-01-01', '2026-01-02', '2026-01-02'];
    expect(longestStreak(log)).toBe(3);
  });
});
