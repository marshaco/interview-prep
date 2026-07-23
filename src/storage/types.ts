import type { ModuleId, QuestionId, Scorecard } from '../content/types';

/** One-tap post-fail self-tags (Triecode UI spec §10) — optional, added after the attempt already exists. */
export type AttemptTag = 'edge_case' | 'off_by_one' | 'wrong_approach' | 'syntax';

/** Whether an attempt was ordinary practice or a spaced-review session item (Review system spec §2). */
export type AttemptContext = 'practice' | 'review';

export interface Attempt {
  id: string;
  questionId: QuestionId;
  code: string;
  scorecard: Scorecard;
  hintsUsed: number;
  durationMs: number;
  createdAt: string; // ISO
  tags?: AttemptTag[];
  context: AttemptContext;
}

export interface AttemptQuery {
  questionId?: QuestionId;
}

export interface Draft {
  questionId: QuestionId;
  code: string;
  updatedAt: string; // ISO
}

/**
 * Per-exercise spaced-review state (Review system spec §2) — replaces the
 * earlier per-skill SM-2-lite `ReviewRecord`. `rung` indexes the fixed
 * interval ladder (engine/srs/scheduler.ts's `RUNG_INTERVALS_DAYS`); a
 * question enters this table (via `enterReview`) the first time it's
 * passed outside of a review session, at rung 0, due the next day.
 */
export interface ReviewState {
  questionId: QuestionId;
  rung: number; // 0-5, index into RUNG_INTERVALS_DAYS
  dueAt: string; // ISO
  lapses: number;
  lastReviewedAt: string; // ISO
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
    reviewStates: ReviewState[];
    notes: Note[];
    bookmarks: Bookmark[];
    learnCompletions: LearnCompletion[];
    dayLog: string[]; // ISO date strings, one per active day
  };
}
