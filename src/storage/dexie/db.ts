import Dexie, { type Table } from 'dexie';
import type { Attempt, Bookmark, Draft, Note, ReviewRecord, SkillMastery } from '../types';

// dayLog rows are wrapped in an object (rather than storing the bare ISO
// date string) so every table uniformly stores objects with a keyPath —
// simpler than mixing Dexie's inbound/outbound key conventions.
export interface DayLogRow {
  date: string;
}

export class AppDatabase extends Dexie {
  attempts!: Table<Attempt, string>;
  drafts!: Table<Draft, string>;
  mastery!: Table<SkillMastery, string>;
  reviewRecords!: Table<ReviewRecord, string>;
  notes!: Table<Note, string>;
  bookmarks!: Table<Bookmark, string>;
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
  }
}
