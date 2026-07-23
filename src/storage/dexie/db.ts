import Dexie, { type Table } from 'dexie';
import type { Attempt, Bookmark, Draft, LearnCompletion, Note, ReviewState } from '../types';

// dayLog rows are wrapped in an object (rather than storing the bare ISO
// date string) so every table uniformly stores objects with a keyPath —
// simpler than mixing Dexie's inbound/outbound key conventions.
export interface DayLogRow {
  date: string;
}

export class AppDatabase extends Dexie {
  attempts!: Table<Attempt, string>;
  drafts!: Table<Draft, string>;
  reviewStates!: Table<ReviewState, string>;
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
    // v4: the per-skill SM-2-lite scheduler is replaced by a per-exercise
    // fixed-interval ladder (Review system spec §2) — reviewRecords (keyed
    // by skillId) is dropped, reviewStates (keyed by questionId) takes over.
    this.version(4).stores({
      reviewRecords: null,
      reviewStates: 'questionId',
    });
  }
}
