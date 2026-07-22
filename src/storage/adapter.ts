import type { ModuleId, QuestionId } from '../content/types';
import type {
  Attempt,
  AttemptQuery,
  AttemptTag,
  Bookmark,
  Draft,
  ExportBundleV1,
  LearnCompletion,
  Note,
  ReviewRecord,
} from './types';

export interface StorageAdapter {
  getAttempts(q?: AttemptQuery): Promise<Attempt[]>;
  saveAttempt(a: Attempt): Promise<void>;
  /** Overwrites an existing attempt's self-tags (Triecode UI spec §10) — the attempt itself is otherwise immutable. */
  updateAttemptTags(attemptId: string, tags: AttemptTag[]): Promise<void>;
  getDraft(questionId: QuestionId): Promise<Draft | null>;
  saveDraft(d: Draft): Promise<void>;
  getReviewRecords(): Promise<ReviewRecord[]>;
  upsertReviewRecord(r: ReviewRecord): Promise<void>;
  getLearnCompletions(): Promise<LearnCompletion[]>;
  /** Idempotent — marking an already-complete module complete again is a no-op update, not an error. */
  markLearnComplete(moduleId: ModuleId): Promise<void>;
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
