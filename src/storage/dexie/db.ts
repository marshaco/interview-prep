import Dexie, { type Table } from 'dexie';
import { modules as contentModules } from '../../content/registry';
import type { ModuleId, RoadmapModule } from '../../content/types';
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

// The v5 shape, before pace/date became a strict discriminated union (v6) —
// only used by the v6 upgrade function to type the pre-migration row.
interface PlanRowV5 {
  id: 'singleton';
  scope: string;
  minutesPerDay: number;
  targetDate: string | null;
  activeDays: [boolean, boolean, boolean, boolean, boolean, boolean, boolean];
  createdAt: string;
  pausedAt: string | null;
}

// The v6 shape, before scope became an explicit module-id list (v7) — only
// used by the v7 upgrade function to type the pre-migration row.
interface PlanRowV6 {
  id: 'singleton';
  scope: string; // 'all' or a single ModuleId
  pace: PlanRecord['pace'];
  activeDays: [boolean, boolean, boolean, boolean, boolean, boolean, boolean];
  createdAt: string;
  pausedAt: string | null;
}

function isGhostModule(module: RoadmapModule): boolean {
  return module.stages.every((stage) => stage.items.length === 0);
}

/** Duplicated (not imported) from engine/plan/scope.ts: storage/ sits below engine/ in the layer order and can't import from it. Only used by the v7 migration, computing the ancestor closure a single legacy `scope: ModuleId` used to imply, so an existing plan's effective coverage doesn't silently shrink across the migration. */
function legacyAncestorClosure(moduleId: ModuleId, modules: RoadmapModule[]): ModuleId[] {
  const byId = new Map(modules.map((m) => [m.id, m]));
  const result = new Set<ModuleId>();
  function visit(id: ModuleId): void {
    if (result.has(id)) return;
    const module = byId.get(id);
    if (!module || isGhostModule(module)) return;
    result.add(id);
    for (const prereqId of module.prerequisites) visit(prereqId);
  }
  visit(moduleId);
  return [...result];
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
    // v6: pace and finish date become a strict discriminated union (Study
    // plan revision spec §3) — exactly one of them is ever stored, the
    // other always derived at read time. Existing rows (flat
    // minutesPerDay + optional targetDate) migrate: a set targetDate
    // becomes date-mode, otherwise pace-mode from the existing minutesPerDay.
    this.version(6)
      .stores({ plan: 'id' })
      .upgrade(async (tx) => {
        await tx
          .table('plan')
          .toCollection()
          .modify((row) => {
            const legacy = row as PlanRowV5;
            const pace: PlanRecord['pace'] = legacy.targetDate
              ? { mode: 'date', targetDate: legacy.targetDate }
              : { mode: 'pace', minutesPerDay: legacy.minutesPerDay };
            (row as unknown as PlanRow).pace = pace;
            delete (row as Record<string, unknown>).minutesPerDay;
            delete (row as Record<string, unknown>).targetDate;
          });
      });
    // v7: scope becomes an explicit module-id list (Study plan revision
    // spec §1) — no more 'all' sentinel or single-module-plus-implied-
    // ancestors form. 'all' migrates to every currently authored module id;
    // a specific module id migrates to that module plus its full ancestor
    // closure, preserving the plan's actual effective coverage rather than
    // silently shrinking it to just the one id.
    this.version(7)
      .stores({ plan: 'id' })
      .upgrade(async (tx) => {
        await tx
          .table('plan')
          .toCollection()
          .modify((row) => {
            const legacy = row as PlanRowV6;
            const scope: ModuleId[] =
              legacy.scope === 'all'
                ? contentModules.filter((m) => !isGhostModule(m)).map((m) => m.id)
                : legacyAncestorClosure(legacy.scope, contentModules);
            (row as unknown as PlanRow).scope = scope;
          });
      });
  }
}
