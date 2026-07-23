import Dexie, { type Table } from 'dexie';
import type { Attempt, Bookmark, Draft, LearnCompletion, Note, PlanRecord, ReviewState } from '../types';

// dayLog rows are wrapped in an object (rather than storing the bare ISO
// date string) so every table uniformly stores objects with a keyPath —
// simpler than mixing Dexie's inbound/outbound key conventions.
export interface DayLogRow {
  date: string;
}

// The single plan record (Study plan spec §3) wrapped with a fixed literal
// key, same "every table has a keyPath" reasoning as DayLogRow — there's
// only ever one row, at id 'singleton'.
export interface PlanRow extends PlanRecord {
  id: 'singleton';
}

export class AppDatabase extends Dexie {
  attempts!: Table<Attempt, string>;
  drafts!: Table<Draft, string>;
  reviewStates!: Table<ReviewState, string>;
  notes!: Table<Note, string>;
  bookmarks!: Table<Bookmark, string>;
  learnCompletions!: Table<LearnCompletion, string>;
  dayLog!: Table<DayLogRow, string>;
  plan!: Table<PlanRow, string>;

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
    // v5: the study plan (Study plan spec §3) — a single record (scope +
    // pace/date inputs only; no stored calendar) keyed at a fixed id since
    // there is never more than one.
    this.version(5).stores({
      plan: 'id',
    });
  }
}
