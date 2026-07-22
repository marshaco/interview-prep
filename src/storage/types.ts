import type { ModuleId, QuestionId, Scorecard, SkillId } from '../content/types';

export interface Attempt {
  id: string;
  questionId: QuestionId;
  code: string;
  scorecard: Scorecard;
  hintsUsed: number;
  durationMs: number;
  createdAt: string; // ISO
}

export interface AttemptQuery {
  questionId?: QuestionId;
}

export interface Draft {
  questionId: QuestionId;
  code: string;
  updatedAt: string; // ISO
}

export interface ReviewRecord {
  skillId: SkillId;
  ease: number; // 1.3 - 2.8
  intervalDays: number;
  dueAt: string; // ISO
  lapses: number;
}

export interface Note {
  id: string;
  questionId: QuestionId;
  body: string;
  createdAt: string; // ISO
}

export interface Bookmark {
  questionId: QuestionId;
  createdAt: string; // ISO
}

/**
 * A Learn stage marked complete via the "Mark Learn complete" event
 * (Triecode UI spec §9) — the one explicit completion action in the app;
 * every other stage's completion is inferred from passing exercises.
 */
export interface LearnCompletion {
  moduleId: ModuleId;
  completedAt: string; // ISO
}

export interface ExportBundleV1 {
  schemaVersion: 1;
  exportedAt: string; // ISO
  tables: {
    attempts: Attempt[];
    drafts: Draft[];
    reviewRecords: ReviewRecord[];
    notes: Note[];
    bookmarks: Bookmark[];
    learnCompletions: LearnCompletion[];
    dayLog: string[]; // ISO date strings, one per active day
  };
}
