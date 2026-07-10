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

  it('round-trips a draft, overwriting on repeated saves for the same question', async () => {
    const adapter = freshAdapter();
    await adapter.saveDraft({ questionId: 'linked-list/append', code: 'v1', updatedAt: '2026-01-01T00:00:00.000Z' });
    await adapter.saveDraft({ questionId: 'linked-list/append', code: 'v2', updatedAt: '2026-01-01T00:01:00.000Z' });

    const draft = await adapter.getDraft('linked-list/append');
    expect(draft?.code).toBe('v2');
    expect(await adapter.getDraft('linked-list/prepend')).toBeNull();
  });

  it('round-trips mastery records, upserting by skillId', async () => {
    const adapter = freshAdapter();
    await adapter.upsertMastery({ skillId: 'linked-list/append', score: 50, attempts: 1, updatedAt: '2026-01-01T00:00:00.000Z' });
    await adapter.upsertMastery({ skillId: 'linked-list/append', score: 75, attempts: 2, updatedAt: '2026-01-02T00:00:00.000Z' });

    const mastery = await adapter.getMastery();
    expect(mastery).toHaveLength(1);
    expect(mastery[0]?.score).toBe(75);
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

  it('logs active days and returns the day log', async () => {
    const adapter = freshAdapter();
    await adapter.logActiveDay('2026-01-01');
    await adapter.logActiveDay('2026-01-02');
    await adapter.logActiveDay('2026-01-01'); // idempotent re-log of the same day
    expect(await adapter.getDayLog()).toEqual(['2026-01-01', '2026-01-02']);
  });

  it('export -> wipe -> import restores every table', async () => {
    const adapter = freshAdapter();
    await adapter.saveAttempt(fakeAttempt({ id: 'a1' }));
    await adapter.saveDraft({ questionId: 'linked-list/append', code: 'draft', updatedAt: '2026-01-01T00:00:00.000Z' });
    await adapter.upsertMastery({ skillId: 'linked-list/append', score: 80, attempts: 3, updatedAt: '2026-01-01T00:00:00.000Z' });
    await adapter.upsertReviewRecord({ skillId: 'linked-list/append', ease: 2.5, intervalDays: 3, dueAt: '2026-01-05T00:00:00.000Z', lapses: 0 });
    await adapter.saveNote({ id: 'n1', questionId: 'linked-list/append', body: 'note', createdAt: '2026-01-01T00:00:00.000Z' });
    await adapter.toggleBookmark('linked-list/append');
    await adapter.logActiveDay('2026-01-01');

    const bundle = await adapter.exportAll();
    expect(bundle.schemaVersion).toBe(1);

    await adapter.wipeAll();
    expect(await adapter.getAttempts()).toEqual([]);
    expect(await adapter.getMastery()).toEqual([]);
    expect(await adapter.getBookmarks()).toEqual([]);

    await adapter.importAll(bundle);

    expect(await adapter.getAttempts()).toHaveLength(1);
    expect(await adapter.getDraft('linked-list/append')).not.toBeNull();
    expect(await adapter.getMastery()).toHaveLength(1);
    expect(await adapter.getReviewRecords()).toHaveLength(1);
    expect(await adapter.getNotes('linked-list/append')).toHaveLength(1);
    expect(await adapter.getBookmarks()).toHaveLength(1);
    expect(await adapter.getDayLog()).toEqual(['2026-01-01']);
  });

  it('importAll refuses an unknown schema version', async () => {
    const adapter = freshAdapter();
    const badBundle = { schemaVersion: 2, exportedAt: '2026-01-01T00:00:00.000Z', tables: {} };
    // @ts-expect-error deliberately passing a malformed bundle to prove the runtime guard fires
    await expect(adapter.importAll(badBundle)).rejects.toThrow(/Unknown export schema version/);
  });
});
