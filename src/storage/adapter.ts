import type { QuestionId } from '../content/types';
import type {
  Attempt,
  AttemptQuery,
  Bookmark,
  Draft,
  ExportBundleV1,
  Note,
  ReviewRecord,
  SkillMastery,
} from './types';

export interface StorageAdapter {
  getAttempts(q?: AttemptQuery): Promise<Attempt[]>;
  saveAttempt(a: Attempt): Promise<void>;
  getDraft(questionId: QuestionId): Promise<Draft | null>;
  saveDraft(d: Draft): Promise<void>;
  getMastery(): Promise<SkillMastery[]>;
  upsertMastery(m: SkillMastery): Promise<void>;
  getReviewRecords(): Promise<ReviewRecord[]>;
  upsertReviewRecord(r: ReviewRecord): Promise<void>;
  getNotes(questionId: QuestionId): Promise<Note[]>;
  saveNote(n: Note): Promise<void>;
  getBookmarks(): Promise<Bookmark[]>;
  toggleBookmark(questionId: QuestionId): Promise<void>;
  logActiveDay(dateISO: string): Promise<void>;
  getDayLog(): Promise<string[]>;
  exportAll(): Promise<ExportBundleV1>;
  importAll(b: ExportBundleV1): Promise<void>;
  /**
   * Clears every table. Not in ARCHITECTURE §8's literal interface list, but
   * needed for this phase's own DoD ("export -> wipe -> import restores
   * everything") and for Settings' "wipe data" feature (Phase 8).
   */
  wipeAll(): Promise<void>;
}
