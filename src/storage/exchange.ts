import type { AppDatabase } from './dexie/db';
import type { ExportBundleV1 } from './types';

export async function buildExportBundle(db: AppDatabase): Promise<ExportBundleV1> {
  const [attempts, drafts, reviewStates, notes, bookmarks, learnCompletions, dayLogRows, planRow] = await Promise.all([
    db.attempts.toArray(),
    db.drafts.toArray(),
    db.reviewStates.toArray(),
    db.notes.toArray(),
    db.bookmarks.toArray(),
    db.learnCompletions.toArray(),
    db.dayLog.toArray(),
    db.plan.get('singleton'),
  ]);

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    tables: {
      attempts,
      drafts,
      reviewStates,
      notes,
      bookmarks,
      learnCompletions,
      dayLog: dayLogRows.map((row) => row.date),
      plan: planRow
        ? {
            scope: planRow.scope,
            pace: planRow.pace,
            activeDays: planRow.activeDays,
            createdAt: planRow.createdAt,
            pausedAt: planRow.pausedAt,
          }
        : null,
    },
  };
}

/**
 * Validates that an arbitrary parsed-JSON value is a well-formed
 * ExportBundleV1 before anything is allowed to import it — refuses unknown
 * schema versions per ARCHITECTURE §8. Called both defensively inside
 * DexieAdapter.importAll and (eventually, Phase 8) by the Settings import
 * flow on a file the user picked, which starts as genuinely untrusted `unknown`.
 */
export function validateExportBundle(data: unknown): ExportBundleV1 {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Import bundle must be an object');
  }
  const bundle = data as Record<string, unknown>;
  if (bundle.schemaVersion !== 1) {
    throw new Error(`Unknown export schema version: ${JSON.stringify(bundle.schemaVersion)}`);
  }
  if (typeof bundle.tables !== 'object' || bundle.tables === null) {
    throw new Error('Import bundle is missing tables');
  }
  if (typeof bundle.exportedAt !== 'string') {
    throw new Error('Import bundle is missing exportedAt');
  }
  return bundle as unknown as ExportBundleV1;
}

export async function applyImportBundle(db: AppDatabase, bundle: ExportBundleV1): Promise<void> {
  const tables = [db.attempts, db.drafts, db.reviewStates, db.notes, db.bookmarks, db.learnCompletions, db.dayLog, db.plan];
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((table) => table.clear()));
    const writes: Promise<unknown>[] = [
      db.attempts.bulkAdd(bundle.tables.attempts),
      db.drafts.bulkAdd(bundle.tables.drafts),
      // Older exports predate reviewStates (they used a per-skill reviewRecords
      // table that no longer exists) — fall back to empty rather than throwing.
      db.reviewStates.bulkAdd(bundle.tables.reviewStates ?? []),
      db.notes.bulkAdd(bundle.tables.notes),
      db.bookmarks.bulkAdd(bundle.tables.bookmarks),
      // Older exports predate learnCompletions — fall back to empty rather than throwing.
      db.learnCompletions.bulkAdd(bundle.tables.learnCompletions ?? []),
      db.dayLog.bulkAdd(bundle.tables.dayLog.map((date) => ({ date }))),
    ];
    // Older exports predate the plan record entirely; a null plan (no plan
    // set up, or genuinely absent from an old export) leaves the table empty.
    if (bundle.tables.plan) {
      writes.push(db.plan.put({ id: 'singleton', ...bundle.tables.plan }));
    }
    await Promise.all(writes);
  });
}
