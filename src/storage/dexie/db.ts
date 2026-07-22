import Dexie, { type Table } from 'dexie';
import type { Attempt, Bookmark, Draft, LearnCompletion, Note, ReviewRecord } from '../types';

// dayLog rows are wrapped in an object (rather than storing the bare ISO
// date string) so every table uniformly stores objects with a keyPath —
// simpler than mixing Dexie's inbound/outbound key conventions.
export interface DayLogRow {
  date: string;
}

export class AppDatabase extends Dexie {
  attempts!: Table<Attempt, string>;
  drafts!: Table<Draft, string>;
  reviewRecords!: Table<ReviewRecord, string>;
  notes!: Table<Note, string>;
  bookmarks!: Table<Bookmark, string>;
  learnCompletions!: Table<LearnCompletion, string>;
  dayLog!: Table<DayLogRow, string>;

  constructor(name = 'interview-prep') {
    super(name);
    this.version(1).stores({
      attempts: 'id, questionId, createdAt',
      drafts: 'questionId',
      mastery: 'skillId',
      reviewRecords: 'skillId',
      notes: 'id, questionId',
      bookmarks: 'questionId',
      dayLog: 'date',
    });
    // v2: mastery is now a pure computation over attempts (engine/mastery),
    // not stored state — the per-skill EWMA table it replaced is dropped.
    this.version(2).stores({
      mastery: null,
    });
    // v3: one row per module whose Learn stage has been explicitly marked
    // complete (Triecode UI spec §9) — feeds selectNextAction and the
    // module stepper's frontier logic.
    this.version(3).stores({
      learnCompletions: 'moduleId',
    });
  }
}
