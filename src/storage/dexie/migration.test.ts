import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';
import { AppDatabase } from './db';

/** Recreates the exact v1-v5 schema (before the Study plan revision's v6/v7 migrations existed) so these tests exercise the real Dexie upgrade chain, not a hand-rolled approximation of one. */
function openLegacyV5Database(name: string): Dexie {
  const db = new Dexie(name);
  db.version(1).stores({
    attempts: 'id, questionId, createdAt',
    drafts: 'questionId',
    mastery: 'skillId',
    reviewRecords: 'skillId',
    notes: 'id, questionId',
    bookmarks: 'questionId',
    dayLog: 'date',
  });
  db.version(2).stores({ mastery: null });
  db.version(3).stores({ learnCompletions: 'moduleId' });
  db.version(4).stores({ reviewRecords: null, reviewStates: 'questionId' });
  db.version(5).stores({ plan: 'id' });
  return db;
}

describe('plan schema migration (v5 -> v7)', () => {
  it("migrates a legacy 'all'-scope, pace-mode plan to the list-scope + pace-union shape", async () => {
    const dbName = `test-migration-${crypto.randomUUID()}`;
    const legacyDb = openLegacyV5Database(dbName);
    await legacyDb.open();
    await legacyDb.table('plan').put({
      id: 'singleton',
      scope: 'all',
      minutesPerDay: 45,
      targetDate: null,
      activeDays: [true, true, true, true, true, false, false],
      createdAt: '2026-01-01T00:00:00.000Z',
      pausedAt: null,
    });
    legacyDb.close();

    const upgraded = new AppDatabase(dbName);
    await upgraded.open();
    const row = await upgraded.plan.get('singleton');

    expect(row?.pace).toEqual({ mode: 'pace', minutesPerDay: 45 });
    expect(row?.activeDays).toEqual([true, true, true, true, true, false, false]);
    expect(new Set(row?.scope)).toEqual(new Set(['arrays-hashing', 'stack', 'linked-list', 'two-pointers']));
    upgraded.close();
  });

  it('migrates a legacy single-module scope to that module plus its full ancestor closure', async () => {
    const dbName = `test-migration-${crypto.randomUUID()}`;
    const legacyDb = openLegacyV5Database(dbName);
    await legacyDb.open();
    await legacyDb.table('plan').put({
      id: 'singleton',
      scope: 'linked-list',
      minutesPerDay: 30,
      targetDate: '2026-06-01',
      activeDays: [true, true, true, true, true, true, true],
      createdAt: '2026-01-01T00:00:00.000Z',
      pausedAt: null,
    });
    legacyDb.close();

    const upgraded = new AppDatabase(dbName);
    await upgraded.open();
    const row = await upgraded.plan.get('singleton');

    // targetDate was set on the legacy row, so it should migrate to date-mode
    // (not pace-mode) even though minutesPerDay was also present.
    expect(row?.pace).toEqual({ mode: 'date', targetDate: '2026-06-01' });
    // linked-list depends on two-pointers, which depends on arrays-hashing —
    // the migration should preserve that effective coverage, not shrink it
    // to just ['linked-list'].
    expect(new Set(row?.scope)).toEqual(new Set(['linked-list', 'two-pointers', 'arrays-hashing']));
    upgraded.close();
  });

  it('leaves a fresh (post-migration) database with no plan row untouched', async () => {
    const dbName = `test-migration-${crypto.randomUUID()}`;
    const upgraded = new AppDatabase(dbName);
    await upgraded.open();
    expect(await upgraded.plan.get('singleton')).toBeUndefined();
    upgraded.close();
  });
});
