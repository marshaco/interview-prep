import { describe, expect, it } from 'vitest';
import { DEFAULT_FAST_THRESHOLD_MS, MAX_RUNG, RUNG_INTERVALS_DAYS, enterReview, scheduleReview } from './scheduler';
import type { ReviewState } from '../../storage/types';

const NOW = '2026-01-01T00:00:00.000Z';

function daysLater(days: number): string {
  const date = new Date(NOW);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function daysLaterAtRung(rung: number): string {
  return daysLater(RUNG_INTERVALS_DAYS[rung] ?? 60);
}

function stateAtRung(rung: number, overrides: Partial<ReviewState> = {}): ReviewState {
  return { questionId: 'linked-list/append', rung, dueAt: NOW, lapses: 0, lastReviewedAt: NOW, ...overrides };
}

describe('enterReview', () => {
  it('starts a freshly-passed exercise at rung 0, due tomorrow', () => {
    const state = enterReview('linked-list/append', NOW);
    expect(state).toEqual({ questionId: 'linked-list/append', rung: 0, dueAt: daysLater(1), lapses: 0, lastReviewedAt: NOW });
  });
});

describe('scheduleReview', () => {
  it('advances 2 rungs on a clean, fast pass', () => {
    const next = scheduleReview(stateAtRung(0), { passed: true, cleanPass: true, fast: true }, NOW);
    expect(next.rung).toBe(2);
    expect(next.dueAt).toBe(daysLaterAtRung(2));
    expect(next.lastReviewedAt).toBe(NOW);
  });

  it('advances 1 rung on a clean but not-fast pass', () => {
    const next = scheduleReview(stateAtRung(0), { passed: true, cleanPass: true, fast: false }, NOW);
    expect(next.rung).toBe(1);
    expect(next.dueAt).toBe(daysLaterAtRung(1));
  });

  it('stays on the same rung for a scraped pass (multiple submits)', () => {
    const next = scheduleReview(stateAtRung(2), { passed: true, cleanPass: false, fast: false }, NOW);
    expect(next.rung).toBe(2);
    expect(next.dueAt).toBe(daysLaterAtRung(2));
  });

  it('lapses to rung 0 and increments lapses on a failed review', () => {
    const next = scheduleReview(stateAtRung(4, { lapses: 1 }), { passed: false, cleanPass: false, fast: false }, NOW);
    expect(next.rung).toBe(0);
    expect(next.lapses).toBe(2);
    expect(next.dueAt).toBe(daysLater(1));
  });

  it('does not advance past the cap even on a clean fast pass at the top rung', () => {
    const next = scheduleReview(stateAtRung(MAX_RUNG), { passed: true, cleanPass: true, fast: true }, NOW);
    expect(next.rung).toBe(MAX_RUNG);
    expect(next.dueAt).toBe(daysLaterAtRung(MAX_RUNG));
  });

  it('computes the correct due date for every rung on the ladder', () => {
    RUNG_INTERVALS_DAYS.forEach((days, rung) => {
      const next = scheduleReview(stateAtRung(rung), { passed: true, cleanPass: false, fast: false }, NOW);
      expect(next.dueAt).toBe(daysLater(days));
    });
  });

  it('exposes a sane default fast-pass threshold', () => {
    expect(DEFAULT_FAST_THRESHOLD_MS).toBe(10 * 60 * 1000);
  });
});
