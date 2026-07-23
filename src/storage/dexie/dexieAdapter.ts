import type { ModuleId, QuestionId } from '../../content/types';
import type { StorageAdapter } from '../adapter';
import type {
  Attempt,
  AttemptQuery,
  AttemptTag,
  Bookmark,
  Draft,
  ExportBundleV1,
  LearnCompletion,
  Note,
  PlanRecord,
  ReviewState,
} from '../types';
import { applyImportBundle, buildExportBundle, validateExportBundle } from '../exchange';
import { AppDatabase } from './db';

export class DexieAdapter implements StorageAdapter {
  private db: AppDatabase;

  constructor(name?: string) {
    this.db = new AppDatabase(name);
  }

  async getAttempts(q?: AttemptQuery): Promise<Attempt[]> {
    if (q?.questionId) {
      return this.db.attempts.where('questionId').equals(q.questionId).sortBy('createdAt');
    }
    return this.db.attempts.orderBy('createdAt').toArray();
  }

  async saveAttempt(a: Attempt): Promise<void> {
    await this.db.attempts.add(a);
  }

  async updateAttemptTags(attemptId: string, tags: AttemptTag[]): Promise<void> {
    await this.db.attempts.update(attemptId, { tags });
  }

  async getDraft(questionId: QuestionId): Promise<Draft | null> {
    const draft = await this.db.drafts.get(questionId);
    return draft ?? null;
  }

  async saveDraft(d: Draft): Promise<void> {
    await this.db.drafts.put(d);
  }

  async getReviewStates(): Promise<ReviewState[]> {
    return this.db.reviewStates.toArray();
  }

  async upsertReviewState(r: ReviewState): Promise<void> {
    await this.db.reviewStates.put(r);
  }

  async getLearnCompletions(): Promise<LearnCompletion[]> {
    return this.db.learnCompletions.toArray();
  }

  async markLearnComplete(moduleId: ModuleId): Promise<void> {
    await this.db.learnCompletions.put({ moduleId, completedAt: new Date().toISOString() });
  }

  async getNotes(questionId: QuestionId): Promise<Note[]> {
    return this.db.notes.where('questionId').equals(questionId).toArray();
  }

  async saveNote(n: Note): Promise<void> {
    await this.db.notes.add(n);
  }

  async getBookmarks(): Promise<Bookmark[]> {
    return this.db.bookmarks.toArray();
  }

  async toggleBookmark(questionId: QuestionId): Promise<void> {
    const existing = await this.db.bookmarks.get(questionId);
    if (existing) {
      await this.db.bookmarks.delete(questionId);
    } else {
      await this.db.bookmarks.put({ questionId, createdAt: new Date().toISOString() });
    }
  }

  async logActiveDay(dateISO: string): Promise<void> {
    await this.db.dayLog.put({ date: dateISO });
  }

  async getDayLog(): Promise<string[]> {
    const rows = await this.db.dayLog.toArray();
    return rows.map((row) => row.date);
  }

  async getPlan(): Promise<PlanRecord | null> {
    const row = await this.db.plan.get('singleton');
    if (!row) return null;
    return {
      scope: row.scope,
      minutesPerDay: row.minutesPerDay,
      activeDays: row.activeDays,
      targetDate: row.targetDate,
      createdAt: row.createdAt,
      pausedAt: row.pausedAt,
    };
  }

  async savePlan(p: PlanRecord): Promise<void> {
    await this.db.plan.put({ id: 'singleton', ...p });
  }

  async deletePlan(): Promise<void> {
    await this.db.plan.delete('singleton');
  }

  async exportAll(): Promise<ExportBundleV1> {
    return buildExportBundle(this.db);
  }

  async importAll(b: ExportBundleV1): Promise<void> {
    const validated = validateExportBundle(b);
    await applyImportBundle(this.db, validated);
  }

  async wipeAll(): Promise<void> {
    const tables = [
      this.db.attempts,
      this.db.drafts,
      this.db.reviewStates,
      this.db.notes,
      this.db.bookmarks,
      this.db.learnCompletions,
      this.db.dayLog,
      this.db.plan,
    ];
    await this.db.transaction('rw', tables, async () => {
      await Promise.all(tables.map((table) => table.clear()));
    });
  }
}
