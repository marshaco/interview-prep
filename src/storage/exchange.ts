import type { AppDatabase } from './dexie/db';
import type { ExportBundleV1 } from './types';

export async function buildExportBundle(db: AppDatabase): Promise<ExportBundleV1> {
  const [attempts, drafts, reviewRecords, notes, bookmarks, dayLogRows] = await Promise.all([
    db.attempts.toArray(),
    db.drafts.toArray(),
    db.reviewRecords.toArray(),
    db.notes.toArray(),
    db.bookmarks.toArray(),
    db.dayLog.toArray(),
  ]);

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    tables: {
      attempts,
      drafts,
      reviewRecords,
      notes,
      bookmarks,
      dayLog: dayLogRows.map((row) => row.date),
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
  const tables = [db.attempts, db.drafts, db.reviewRecords, db.notes, db.bookmarks, db.dayLog];
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((table) => table.clear()));
    await Promise.all([
      db.attempts.bulkAdd(bundle.tables.attempts),
      db.drafts.bulkAdd(bundle.tables.drafts),
      db.reviewRecords.bulkAdd(bundle.tables.reviewRecords),
      db.notes.bulkAdd(bundle.tables.notes),
      db.bookmarks.bulkAdd(bundle.tables.bookmarks),
      db.dayLog.bulkAdd(bundle.tables.dayLog.map((date) => ({ date }))),
    ]);
  });
}
