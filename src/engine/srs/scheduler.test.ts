import { describe, expect, it } from 'vitest';
import { deriveReviewQuality, review } from './scheduler';
import type { ReviewRecord } from '../../storage/types';

const NOW = '2026-01-01T00:00:00.000Z';

describe('deriveReviewQuality', () => {
  it('buckets overall score in steps of 20, matching masteryStars', () => {
    expect(deriveReviewQuality(100, 0)).toBe(5);
    expect(deriveReviewQuality(80, 0)).toBe(4);
    expect(deriveReviewQuality(60, 0)).toBe(3);
    expect(deriveReviewQuality(40, 0)).toBe(2);
    expect(deriveReviewQuality(0, 0)).toBe(0);
  });

  it('subtracts 1 for heavy hint usage (3+ hints)', () => {
    expect(deriveReviewQuality(100, 3)).toBe(4);
    expect(deriveReviewQuality(100, 4)).toBe(4);
  });

  it('does not penalize fewer than 3 hints', () => {
    expect(deriveReviewQuality(100, 2)).toBe(5);
  });

  it('clamps to [0, 5]', () => {
    expect(deriveReviewQuality(0, 4)).toBe(0);
    expect(deriveReviewQuality(100, 0)).toBeLessThanOrEqual(5);
  });
});

describe('review', () => {
  it('initializes a new record at ease 2.5, interval 1, due now, on a lapse', () => {
    const result = review(undefined, 'linked-list/append', 2, NOW);
    expect(result.ease).toBeCloseTo(2.3); // 2.5 - 0.2
    expect(result.intervalDays).toBe(1);
    expect(result.lapses).toBe(1);
  });

  it('lapse (quality < 3) resets interval to 1 day and drops ease by 0.2', () => {
    const record: ReviewRecord = { skillId: 's', ease: 2.5, intervalDays: 10, dueAt: NOW, lapses: 0 };
    const result = review(record, 's', 1, NOW);
    expect(result.intervalDays).toBe(1);
    expect(result.ease).toBeCloseTo(2.3);
    expect(result.lapses).toBe(1);
  });

  it('floors ease at 1.3 on repeated lapses', () => {
    let record: ReviewRecord | undefined;
    for (let i = 0; i < 20; i++) {
      record = review(record, 's', 0, NOW);
    }
    expect(record?.ease).toBeGreaterThanOrEqual(1.3);
    expect(record?.ease).toBeCloseTo(1.3);
  });

  it('success (quality >= 3) multiplies interval by the new ease', () => {
    const record: ReviewRecord = { skillId: 's', ease: 2.0, intervalDays: 4, dueAt: NOW, lapses: 0 };
    const result = review(record, 's', 5, NOW); // ease 2.0 + 0.10 = 2.10
    expect(result.ease).toBeCloseTo(2.1);
    expect(result.intervalDays).toBe(Math.round(4 * 2.1)); // 8
  });

  it('quality 3 (bare pass) still nudges ease down slightly, quality 5 nudges it up', () => {
    const record: ReviewRecord = { skillId: 's', ease: 2.0, intervalDays: 4, dueAt: NOW, lapses: 0 };
    const bare = review(record, 's', 3, NOW);
    const perfect = review(record, 's', 5, NOW);
    expect(bare.ease).toBeLessThan(record.ease);
    expect(perfect.ease).toBeGreaterThan(record.ease);
  });

  it('dueAt advances by exactly intervalDays from now', () => {
    const record: ReviewRecord = { skillId: 's', ease: 2.0, intervalDays: 1, dueAt: NOW, lapses: 0 };
    const result = review(record, 's', 5, NOW);
    const daysBetween = (Date.parse(result.dueAt) - Date.parse(NOW)) / 86_400_000;
    expect(daysBetween).toBe(result.intervalDays);
  });

  // Property tests per ARCHITECTURE §7.3: intervals grow monotonically on
  // success, reset on lapse, ease stays within bounds — checked over many
  // randomized sequences rather than a fixed example.
  describe('properties (randomized)', () => {
    it('ease always stays within [1.3, 2.8]', () => {
      for (let trial = 0; trial < 200; trial++) {
        let record: ReviewRecord | undefined;
        let now = NOW;
        for (let step = 0; step < 30; step++) {
          const quality = Math.floor(Math.random() * 6);
          record = review(record, 's', quality, now);
          expect(record.ease).toBeGreaterThanOrEqual(1.3);
          expect(record.ease).toBeLessThanOrEqual(2.8);
          now = record.dueAt;
        }
      }
    });

    it('a run of successes (quality >= 3) grows the interval monotonically', () => {
      for (let trial = 0; trial < 100; trial++) {
        let record: ReviewRecord | undefined;
        let now = NOW;
        let previousInterval = 0;
        for (let step = 0; step < 10; step++) {
          const quality = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5
          record = review(record, 's', quality, now);
          expect(record.intervalDays).toBeGreaterThanOrEqual(previousInterval);
          previousInterval = record.intervalDays;
          now = record.dueAt;
        }
      }
    });

    it('a lapse always resets the interval to 1 day, regardless of prior interval', () => {
      for (let trial = 0; trial < 100; trial++) {
        const priorInterval = 1 + Math.floor(Math.random() * 200);
        const record: ReviewRecord = { skillId: 's', ease: 2.0, intervalDays: priorInterval, dueAt: NOW, lapses: 0 };
        const quality = Math.floor(Math.random() * 3); // 0, 1, or 2
        const result = review(record, 's', quality, NOW);
        expect(result.intervalDays).toBe(1);
      }
    });
  });
});
