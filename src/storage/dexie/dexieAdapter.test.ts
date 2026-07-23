import { describe, expect, it } from 'vitest';
import { DexieAdapter } from './dexieAdapter';
import type { Scorecard } from '../../content/types';
import type { Attempt } from '../types';

function freshAdapter(): DexieAdapter {
  // Unique DB name per test so fake-indexeddb's process-lifetime storage
  // doesn't leak state between tests.
  return new DexieAdapter(`test-${crypto.randomUUID()}`);
}

function fakeScorecard(overall: number): Scorecard {
  return {
    questionId: 'linked-list/append',
    correctness: { correct: 1, total: 1 },
    edgeCases: { correct: 1, total: 1 },
    overall,
    failures: [],
    style: null,
    readability: null,
    complexity: null,
  };
}

function fakeAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: crypto.randomUUID(),
    questionId: 'linked-list/append',
    code: 'def append(head, value): ...',
    scorecard: fakeScorecard(100),
    hintsUsed: 0,
    durationMs: 1000,
    createdAt: '2026-01-01T00:00:00.000Z',
    context: 'practice',
    ...overrides,
  };
}

describe('DexieAdapter', () => {
  it('round-trips attempts, filterable by questionId', async () => {
    const adapter = freshAdapter();
    await adapter.saveAttempt(fakeAttempt({ id: 'a1', questionId: 'linked-list/append' }));
    await adapter.saveAttempt(fakeAttempt({ id: 'a2', questionId: 'linked-list/prepend' }));

    expect(await adapter.getAttempts()).toHaveLength(2);
    const appendOnly = await adapter.getAttempts({ questionId: 'linked-list/append' });
    expect(appendOnly).toHaveLength(1);
    expect(appendOnly[0]?.id).toBe('a1');
  });

  it('overwrites an attempt\'s tags without touching its other fields', async () => {
    const adapter = freshAdapter();
    await adapter.saveAttempt(fakeAttempt({ id: 'a1', code: 'def append(head, value): ...' }));

    await adapter.updateAttemptTags('a1', ['off_by_one', 'syntax']);

    const [attempt] = await adapter.getAttempts();
    expect(attempt?.tags).toEqual(['off_by_one', 'syntax']);
    expect(attempt?.code).toBe('def append(head, value): ...');
  });

  it('round-trips a draft, overwriting on repeated saves for the same question', async () => {
    const adapter = freshAdapter();
    await adapter.saveDraft({ questionId: 'linked-list/append', code: 'v1', updatedAt: '2026-01-01T00:00:00.000Z' });
    await adapter.saveDraft({ questionId: 'linked-list/append', code: 'v2', updatedAt: '2026-01-01T00:01:00.000Z' });

    const draft = await adapter.getDraft('linked-list/append');
    expect(draft?.code).toBe('v2');
    expect(await adapter.getDraft('linked-list/prepend')).toBeNull();
  });

  it('round-trips notes and bookmarks, toggling bookmarks on/off', async () => {
    const adapter = freshAdapter();
    await adapter.saveNote({ id: 'n1', questionId: 'linked-list/append', body: 'remember this', createdAt: '2026-01-01T00:00:00.000Z' });
    expect(await adapter.getNotes('linked-list/append')).toHaveLength(1);

    await adapter.toggleBookmark('linked-list/append');
    expect(await adapter.getBookmarks()).toHaveLength(1);
    await adapter.toggleBookmark('linked-list/append');
    expect(await adapter.getBookmarks()).toHaveLength(0);
  });

  it('marks a Learn stage complete idempotently', async () => {
    const adapter = freshAdapter();
    expect(await adapter.getLearnCompletions()).toEqual([]);

    await adapter.markLearnComplete('linked-list');
    await adapter.markLearnComplete('linked-list'); // idempotent re-mark
    const completions = await adapter.getLearnCompletions();
    expect(completions).toHaveLength(1);
    expect(completions[0]?.moduleId).toBe('linked-list');
  });

  it('logs active days and returns the day log', async () => {
    const adapter = freshAdapter();
    await adapter.logActiveDay('2026-01-01');
    await adapter.logActiveDay('2026-01-02');
    await adapter.logActiveDay('2026-01-01'); // idempotent re-log of the same day
    expect(await adapter.getDayLog()).toEqual(['2026-01-01', '2026-01-02']);
  });

  it('round-trips the plan record, returning null before one exists', async () => {
    const adapter = freshAdapter();
    expect(await adapter.getPlan()).toBeNull();

    await adapter.savePlan({
      scope: 'all',
      minutesPerDay: 30,
      activeDays: [true, true, true, true, true, false, false],
      targetDate: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      pausedAt: null,
    });
    const plan = await adapter.getPlan();
    expect(plan?.minutesPerDay).toBe(30);
    if (!plan) throw new Error('expected a plan to have been saved');

    await adapter.savePlan({ ...plan, minutesPerDay: 45 });
    expect((await adapter.getPlan())?.minutesPerDay).toBe(45);

    await adapter.deletePlan();
    expect(await adapter.getPlan()).toBeNull();
  });

  it('export -> wipe -> import restores every table', async () => {
    const adapter = freshAdapter();
    await adapter.saveAttempt(fakeAttempt({ id: 'a1' }));
    await adapter.saveDraft({ questionId: 'linked-list/append', code: 'draft', updatedAt: '2026-01-01T00:00:00.000Z' });
    await adapter.upsertReviewState({ questionId: 'linked-list/append', rung: 1, dueAt: '2026-01-05T00:00:00.000Z', lapses: 0, lastReviewedAt: '2026-01-02T00:00:00.000Z' });
    await adapter.saveNote({ id: 'n1', questionId: 'linked-list/append', body: 'note', createdAt: '2026-01-01T00:00:00.000Z' });
    await adapter.toggleBookmark('linked-list/append');
    await adapter.markLearnComplete('linked-list');
    await adapter.logActiveDay('2026-01-01');
    await adapter.savePlan({
      scope: 'all',
      minutesPerDay: 30,
      activeDays: [true, true, true, true, true, false, false],
      targetDate: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      pausedAt: null,
    });

    const bundle = await adapter.exportAll();
    expect(bundle.schemaVersion).toBe(1);

    await adapter.wipeAll();
    expect(await adapter.getAttempts()).toEqual([]);
    expect(await adapter.getBookmarks()).toEqual([]);

    await adapter.importAll(bundle);

    expect(await adapter.getAttempts()).toHaveLength(1);
    expect(await adapter.getDraft('linked-list/append')).not.toBeNull();
    expect(await adapter.getReviewStates()).toHaveLength(1);
    expect(await adapter.getNotes('linked-list/append')).toHaveLength(1);
    expect(await adapter.getBookmarks()).toHaveLength(1);
    expect(await adapter.getLearnCompletions()).toHaveLength(1);
    expect(await adapter.getDayLog()).toEqual(['2026-01-01']);
    expect((await adapter.getPlan())?.minutesPerDay).toBe(30);
  });

  it('importAll refuses an unknown schema version', async () => {
    const adapter = freshAdapter();
    const badBundle = { schemaVersion: 2, exportedAt: '2026-01-01T00:00:00.000Z', tables: {} };
    // @ts-expect-error deliberately passing a malformed bundle to prove the runtime guard fires
    await expect(adapter.importAll(badBundle)).rejects.toThrow(/Unknown export schema version/);
  });
});
