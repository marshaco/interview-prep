import { describe, expect, it } from 'vitest';
import { buildReviewQueue, countDueThisWeek, countDueTomorrow } from './queue';
import type { ReviewState } from '../../storage/types';
import type { CodeQuestion } from '../../content/types';

const TODAY = '2026-01-10T00:00:00.000Z';

function fakeQuestion(id: string, moduleId: string): CodeQuestion {
  return {
    id,
    kind: 'method_impl',
    moduleId,
    skillIds: [],
    title: id,
    prompt: '',
    starterCode: '',
    solution: '',
    hints: ['a', 'b', 'c', 'd'],
    spec: { mode: 'function', entryPoint: 'fn', argTypes: [], resultType: 'value', tests: [] },
    reviewable: true,
    estimatedMinutes: 20,
  };
}

function fakeState(questionId: string, dueAt: string, rung: number, overrides: Partial<ReviewState> = {}): ReviewState {
  return { questionId, dueAt, rung, lapses: 0, lastReviewedAt: dueAt, ...overrides };
}

describe('buildReviewQueue', () => {
  it('excludes states not yet due', () => {
    const states = [fakeState('a', '2026-01-05T00:00:00.000Z', 0), fakeState('b', '2026-01-20T00:00:00.000Z', 0)];
    const result = buildReviewQueue(states, [fakeQuestion('a', 'm1'), fakeQuestion('b', 'm1')], TODAY);
    expect(result.map((r) => r.questionId)).toEqual(['a']);
  });

  it('sorts most-overdue first, ties broken by lower rung first', () => {
    const states = [
      fakeState('same-day-high-rung', '2026-01-09T00:00:00.000Z', 4),
      fakeState('same-day-low-rung', '2026-01-09T00:00:00.000Z', 0),
      fakeState('more-overdue', '2026-01-01T00:00:00.000Z', 2),
    ];
    const questions = states.map((s) => fakeQuestion(s.questionId, 'm1'));
    const result = buildReviewQueue(states, questions, TODAY);
    expect(result.map((r) => r.questionId)).toEqual(['more-overdue', 'same-day-low-rung', 'same-day-high-rung']);
  });

  it('caps the queue size, keeping the most overdue within the cap', () => {
    const states = Array.from({ length: 20 }, (_, i) =>
      fakeState(`q${i}`, `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`, 0),
    );
    const questions = states.map((s) => fakeQuestion(s.questionId, 'm1'));
    const result = buildReviewQueue(states, questions, TODAY, 5);
    expect(result).toHaveLength(5);
    // The 5 earliest dueAt dates are the most overdue.
    expect(result.map((r) => r.questionId)).toEqual(['q0', 'q1', 'q2', 'q3', 'q4']);
  });

  it('is empty when nothing is due', () => {
    expect(buildReviewQueue([], [], TODAY)).toEqual([]);
  });

  it('separates adjacent same-module items via a one-swap interleave pass', () => {
    // Urgency order alone would be m1-a, m1-b, m2-a — the two m1 items are
    // adjacent, and a later m2 item is available to swap into the middle.
    const states = [
      fakeState('m1-a', '2026-01-01T00:00:00.000Z', 0),
      fakeState('m1-b', '2026-01-03T00:00:00.000Z', 0),
      fakeState('m2-a', '2026-01-08T00:00:00.000Z', 0),
    ];
    const questions = [fakeQuestion('m1-a', 'm1'), fakeQuestion('m1-b', 'm1'), fakeQuestion('m2-a', 'm2')];
    const result = buildReviewQueue(states, questions, TODAY);
    expect(result.map((r) => r.questionId)).toEqual(['m1-a', 'm2-a', 'm1-b']);
  });

  it('leaves a trailing same-module pair alone when no later item can swap in (single-pass limitation)', () => {
    const states = [
      fakeState('m2-a', '2026-01-03T00:00:00.000Z', 0),
      fakeState('m1-b', '2026-01-04T00:00:00.000Z', 0),
      fakeState('m1-a', '2026-01-05T00:00:00.000Z', 0),
    ];
    const questions = [fakeQuestion('m2-a', 'm2'), fakeQuestion('m1-b', 'm1'), fakeQuestion('m1-a', 'm1')];
    const result = buildReviewQueue(states, questions, TODAY);
    expect(result.map((r) => r.questionId)).toEqual(['m2-a', 'm1-b', 'm1-a']);
  });
});

describe('countDueTomorrow', () => {
  it('counts states due on the calendar day right after today', () => {
    const states = [fakeState('a', '2026-01-11T08:00:00.000Z', 0), fakeState('b', '2026-01-12T00:00:00.000Z', 0)];
    expect(countDueTomorrow(states, TODAY)).toBe(1);
  });
});

describe('countDueThisWeek', () => {
  it('counts states due within the next 7 days, excluding already-due ones', () => {
    const states = [
      fakeState('already-due', '2026-01-09T00:00:00.000Z', 0),
      fakeState('in-3-days', '2026-01-13T00:00:00.000Z', 0),
      fakeState('in-8-days', '2026-01-18T00:00:00.000Z', 0),
    ];
    expect(countDueThisWeek(states, TODAY)).toBe(1);
  });

  it('counts an item due exactly 7 calendar days out even at a later time-of-day than midnight', () => {
    // TODAY is midnight; a review scheduled mid-afternoon exactly 7 days
    // later has a *timestamp* past today's midnight + 7*86400000ms, which a
    // naive millisecond comparison would wrongly exclude.
    const states = [fakeState('exactly-7-days', '2026-01-17T15:41:13.263Z', 0)];
    expect(countDueThisWeek(states, TODAY)).toBe(1);
  });
});
