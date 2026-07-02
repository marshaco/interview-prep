# Architecture Document — V1 (Static Client-Only)

**Status:** Approved direction · **Scope:** Vertical slice — Arrays & Hashing + Linked List, full learning loop
**Deployment target:** Static hosting (Cloudflare Pages / Vercel static / GitHub Pages)

---

## 1. Product & Scope Summary

A personal interview-preparation tool that teaches fluency in data structures and algorithmic patterns *before* problem-solving. V1 is a client-only application: no server, no accounts, no sync. All persistence is local (IndexedDB) behind a storage adapter so a backend can be added later without touching application code.

The vertical slice deliberately covers **one module of each kind**:

- **Linked List** — `kind: 'data_structure'` → exercises the full 5-stage pipeline (Learn → Guided Build → Independent Build → Method Drills → Interview Mode).
- **Arrays & Hashing** — `kind: 'pattern'` → exercises the pattern variant (Learn → Guided Apply → Pattern Drills → Interview Mode). There is no `HashMapPattern` class to build; the "build" stages are replaced by applying the pattern to scaffolded problems.

If both kinds work end-to-end, every remaining roadmap node is a content problem, not an engineering problem. That is the definition of done for V1.

**Explicitly out of scope for V1** (but designed-for): server-side execution, AI code review, LLM style scoring, advanced complexity analysis, leaderboards, accounts/sync, the remaining 15 roadmap modules.

---

## 2. Technology Stack

| Concern | Choice | Rationale |
|---|---|---|
| Build/app framework | **Vite + React 18 + TypeScript (strict)** | Pure SPA; no server rendering needed. Faster iteration than Next.js for this shape. |
| Styling | **TailwindCSS** | Design-token driven dark theme; matches the Linear/Raycast aesthetic goal. |
| Code editor | **Monaco** via `@monaco-editor/react` | VS Code feel, Python syntax, keybindings. |
| Roadmap graph | **React Flow** (`@xyflow/react`) | Interactive DAG with custom nodes showing progress rings. |
| Python execution | **Pyodide in a Web Worker** | Off-main-thread; killable; behind a `PythonRunner` interface for later server swap. |
| Local persistence | **Dexie (IndexedDB)** | Structured tables, indexes, migrations, comfortable size limits (localStorage is not viable for submission history). |
| App state | **Zustand** | Minimal global state (session, settings, review queue). Server-cache libraries (React Query) are unnecessary with no server. |
| Routing | **React Router** | Standard SPA routing. |
| Testing | **Vitest + Testing Library**; Playwright later | The grading engine and scheduler are pure functions — cheap to test well. |

**Decision record — why not Next.js:** nothing here needs SSR, API routes, or file-based data fetching. Vite gives faster HMR and a simpler mental model. If we later add a backend, it will be a separate concern (Supabase or a small API), not a reason to re-platform the client. Reversible decision; the React code is portable.

**Decision record — why not localStorage:** 5–10 MB soft cap, synchronous API, string-only values. Submission history plus drafts plus content cache will exceed it. Dexie also gives us versioned schema migrations, which we will genuinely use.

---

## 3. High-Level Architecture

Four layers with strict dependency direction. Lower layers never import from higher ones.

```
┌────────────────────────────────────────────────────┐
│  ui/         React: routes, components, stores      │
├────────────────────────────────────────────────────┤
│  engine/     Pure TS: grading, scheduler, mastery,  │
│              runner interface, harness builder      │
├────────────────────────────────────────────────────┤
│  storage/    StorageAdapter interface + Dexie impl  │
├────────────────────────────────────────────────────┤
│  content/    Typed data: modules, lessons,          │
│              questions, tests, hints                │
└────────────────────────────────────────────────────┘
         (workers/ sits beside these: pyodide.worker.ts)
```

Rules that keep this honest:

1. **`engine/` contains no React and no Dexie.** Everything in it is a pure function or an interface. This is what makes grading, scheduling, and mastery unit-testable and later portable to a server.
2. **`ui/` never touches IndexedDB directly.** All reads/writes go through `StorageAdapter`.
3. **`content/` is data, not code.** Authored as TypeScript files so the compiler validates every question against the schema, but it exports plain serializable objects. No content file may import from `ui/` or `engine/`.
4. **The worker boundary is a protocol.** The main thread talks to Pyodide via typed messages only. The same message protocol becomes the HTTP contract when execution moves server-side.

---

## 4. Content Model

### 4.1 The kind discriminator

```ts
// content/types.ts
export type ModuleKind = 'data_structure' | 'pattern';

export interface RoadmapModule {
  id: ModuleId;                    // 'linked-list', 'arrays-hashing', ...
  kind: ModuleKind;
  title: string;
  summary: string;
  prerequisites: ModuleId[];       // edges of the roadmap DAG
  stages: Stage[];                 // ordered; template depends on kind
  skills: Skill[];                 // the units mastery is tracked against
}
```

### 4.2 Stage templates per kind

```ts
export type StageType =
  | 'learn'              // both kinds
  | 'guided_build'       // data_structure only
  | 'independent_build'  // data_structure only
  | 'method_drills'      // data_structure only
  | 'guided_apply'       // pattern only — scaffolded walkthrough of the pattern
  | 'pattern_drills'     // pattern only — apply pattern to fresh problems
  | 'interview_mode';    // both kinds

export interface Stage {
  type: StageType;
  title: string;
  items: StageItem[];    // lesson sections or question refs
}
```

A validation function (`content/validate.ts`, run in CI) enforces that stage sequences match the kind — a `pattern` module containing `guided_build` fails the build. Invalid content cannot ship.

### 4.3 Skills — the atom of progress

Mastery is tracked per **skill**, not per question. A skill is something like `linked-list/reverse` or `arrays-hashing/frequency-count`. Many questions can exercise one skill; one question may exercise several.

```ts
export interface Skill {
  id: SkillId;                     // 'linked-list/append'
  moduleId: ModuleId;
  title: string;                   // 'append()'
  kind: 'method' | 'full_structure' | 'pattern_application' | 'concept';
}
```

This indirection is what makes the dashboard ("weakest topics"), spaced repetition ("review append(), it's decaying"), and the star display all coherent — they all read the same per-skill records.

### 4.4 Questions

```ts
export type QuestionKind =
  | 'method_impl' | 'full_impl' | 'pattern_problem'
  | 'conceptual' | 'complexity' | 'debugging';

export interface CodeQuestion {
  id: QuestionId;
  kind: 'method_impl' | 'full_impl' | 'pattern_problem' | 'debugging';
  moduleId: ModuleId;
  skillIds: SkillId[];
  prompt: string;                  // markdown
  starterCode: string;
  solution: string;                // canonical solution (also run in CI against tests)
  hints: [string, string, string, string];  // nudge → concept → pseudocode → near-solution
  spec: HarnessSpec;               // how to grade it (§6)
  visualization?: VisualizationBinding;     // optional (§9)
}

export interface QuizQuestion {
  id: QuestionId;
  kind: 'conceptual' | 'complexity';
  moduleId: ModuleId;
  skillIds: SkillId[];
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export type Question = CodeQuestion | QuizQuestion;
```

**Guided Build** is a sequence of `CodeQuestion`s where each step's starter code is the previous step's solution plus a new TODO — the "Create the Node class → add head → implement append()" flow falls out of ordinary questions chained by the stage definition, requiring no special engine support.

**CI guarantee:** a content test runs every `CodeQuestion.solution` through its own harness in Pyodide (headless, via Vitest + jsdom worker shim or a Node-side Pyodide) and fails if the canonical solution doesn't score 100%. Broken questions cannot ship.

---

## 5. Folder Structure

```
src/
├── content/
│   ├── types.ts                  # all content interfaces
│   ├── registry.ts               # exports Map<ModuleId, RoadmapModule>
│   ├── roadmap.ts                # DAG: all 17 node ids + edges (only 2 populated in V1)
│   ├── validate.ts               # structural validation, run in CI
│   └── modules/
│       ├── linked-list/
│       │   ├── module.ts         # stages, skills
│       │   ├── lessons/          # learn-stage markdown/MDX-like sections
│       │   └── questions/        # one file per question
│       └── arrays-hashing/
│           └── ... same shape
├── engine/
│   ├── runner/
│   │   ├── types.ts              # PythonRunner interface + message protocol
│   │   └── pyodideRunner.ts      # worker-backed implementation
│   ├── grading/
│   │   ├── harness.ts            # builds the Python test harness from HarnessSpec
│   │   ├── grade.ts              # RunResult -> Scorecard
│   │   └── comparators.ts        # deepEqual, unorderedEqual, floatClose, structureShape
│   ├── srs/
│   │   └── scheduler.ts          # SM-2-lite: review(record, outcome) -> record
│   └── mastery/
│       └── mastery.ts            # attempts -> per-skill stars
├── storage/
│   ├── adapter.ts                # StorageAdapter interface
│   ├── dexie/
│   │   ├── db.ts                 # Dexie schema + migrations
│   │   └── dexieAdapter.ts
│   └── exchange.ts               # export/import progress as versioned JSON
├── workers/
│   └── pyodide.worker.ts
├── ui/
│   ├── routes/                   # Roadmap, Module, Stage, Question, Dashboard, Review, Settings
│   ├── components/
│   │   ├── editor/               # Monaco wrapper, run/submit/reset/draft toolbar
│   │   ├── roadmap/              # React Flow nodes with progress rings
│   │   ├── question/             # prompt pane, hints ladder, scorecard
│   │   ├── viz/                  # visualization renderers (§9)
│   │   └── common/
│   ├── stores/                   # zustand: session, settings, reviewQueue
│   └── theme/                    # tokens: colors, type scale, spacing, motion
├── App.tsx
└── main.tsx
```

The eventual server migration maps cleanly: `engine/` becomes shared or server code, `storage/` gains a `supabaseAdapter.ts`, `workers/` is replaced by an API client implementing the same `PythonRunner` interface.

---

## 6. Python Execution & Grading Engine

### 6.1 Runner interface (the future server seam)

```ts
// engine/runner/types.ts
export interface PythonRunner {
  warmup(): Promise<void>;
  run(request: RunRequest): Promise<RunResult>;
  cancel(runId: string): Promise<void>;
}

export interface RunRequest {
  runId: string;
  userCode: string;
  harness: string;          // generated Python (§6.3)
  timeoutMs: number;        // wall-clock, enforced from the main thread
}

export interface RunResult {
  runId: string;
  status: 'ok' | 'timeout' | 'runtime_error' | 'syntax_error' | 'cancelled';
  stdout: string;
  stderr: string;
  report?: TestReport;      // parsed from a sentinel-delimited JSON line
  durationMs: number;
}
```

V1 ships `PyodideRunner`. The later `ServerRunner` implements the same interface over HTTP — zero changes above this line.

### 6.2 Worker lifecycle

- Pyodide loads inside a dedicated Web Worker; the main thread stays responsive.
- **Timeout/cancel = `worker.terminate()` + respawn.** This avoids the SharedArrayBuffer interrupt mechanism, which requires COOP/COEP headers that GitHub Pages can't set and that complicate CDN loading. Termination is crude but bulletproof against `while True:`.
- To hide the ~2–4 s respawn cost, the runner keeps **one warm spare worker** and rotates: terminate the hot one, promote the spare, boot a new spare in the background.
- `warmup()` is called on app start and when a user opens any editor route, so the first "Run" click is fast.
- Pyodide and the Python stdlib are cached by the service worker/CDN after first load; content questions never require extra Python packages in V1.

### 6.3 Harness generation

Grading never compares code text. The harness builder turns a `HarnessSpec` into a Python program that imports nothing from the network, defines the test cases, executes the user's code, and prints one JSON report line between sentinels.

```ts
export interface HarnessSpec {
  mode: 'function' | 'class';
  entryPoint: string;                    // 'reverse_list' | 'LinkedList'
  tests: TestCase[];
}

export interface TestCase {
  id: string;
  group: 'visible' | 'hidden' | 'edge';
  // function mode:
  args?: Json[];
  expected?: Json;
  comparator: 'deep' | 'unordered' | 'float_close' | 'checker';
  checker?: string;                      // Python fn body for custom validation
  // class mode:
  script?: OpStep[];                     // [{op:'append',args:[1]},{op:'to_list',expect:[1]}]
}
```

Class mode drives full-structure questions: the harness instantiates the user's class and executes an operation script, checking observable behavior after each step. This grades *behavior*, so any correct implementation passes regardless of internal representation.

Robustness details that matter:

- User code runs in its own namespace via `exec(code, ns)`; the harness verifies `entryPoint` exists before testing and reports a friendly error if not.
- The report line is delimited by a random sentinel generated per run, so user `print()` output can't spoof results *accidentally*. (Deliberate spoofing is possible — see threat note below.)
- Each test case is wrapped in try/except; one crashing test doesn't hide the results of the others.
- Recursion limit is raised modestly and deterministic seeds are set so flaky tests can't exist.

**Threat note (accepted):** all grading is client-side and therefore forgeable by the user. In a single-user tool the only person you can cheat is yourself. This is the standing reason leaderboards are blocked until `ServerRunner` exists.

### 6.4 Scorecard

```ts
export interface Scorecard {
  questionId: QuestionId;
  correctness: Fraction;        // visible + hidden groups
  edgeCases: Fraction;          // edge group
  overall: number;              // 0–100, weighted 70/30
  failures: TestFailure[];      // per-test: input (visible groups only), expected, got
  // Reserved, null in V1 — populated when AI review / complexity analysis land:
  style: null;
  readability: null;
  complexity: null;
}
```

Hidden-group failures show *that* a hidden case failed and a category label ("empty input", "single element", "duplicates") without revealing the literal input — enough signal to fix the bug without turning hidden tests into visible ones.

---

## 7. Progress: Mastery, Attempts, Spaced Repetition

### 7.1 Attempt pipeline

Every Submit produces one immutable `Attempt` (code snapshot, scorecard, duration, hints used). Attempts fan out into two derived records per touched skill: mastery and the review schedule. Runs (as opposed to Submits) execute visible tests only and are not recorded.

### 7.2 Mastery (per skill, 0–5 stars)

```
score' = 0.7 · attemptScore + 0.3 · score        (EWMA, recent-weighted)
stars  = floor(score' / 20), capped by evidence:
         < 2 attempts → max 3★ ; hints 3–4 used → attempt capped at 60
```

Stored as a raw 0–100 float; stars are a display function. The dashboard's "weakest topics" is simply skills sorted ascending by score with ≥1 attempt.

### 7.3 Spaced repetition (SM-2-lite, per skill)

```ts
export interface ReviewRecord {
  skillId: SkillId;
  ease: number;          // 1.3 – 2.8
  intervalDays: number;
  dueAt: string;         // ISO
  lapses: number;
}
```

- Grade an attempt into quality 0–5 from the scorecard (and hint usage).
- quality < 3 → lapse: interval resets to 1 day, ease −0.2 (floor 1.3).
- quality ≥ 3 → interval ×= ease; ease adjusts ±0.05–0.1 by quality.
- **Today's Review** = due records sorted by (mastery asc, overdue-days desc), capped at a configurable daily size. Reviewing a skill serves a randomly selected question tagged with that skill that the user hasn't seen most recently — cheap anti-memorization.

The scheduler is a pure function `(record, quality, now) → record`, property-tested in Vitest (intervals grow monotonically on success, reset on lapse, ease stays within bounds).

### 7.4 Streaks

A `dayLog` table records one row per active day. Streak = consecutive-day count computed at read time in the user's local timezone. No cron, no server.

---

## 8. Storage Layer

```ts
// storage/adapter.ts
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
}
```

Dexie tables mirror these entities 1:1, keyed and indexed for the queries above (`attempts` indexed by `questionId` and `createdAt`; `mastery` and `reviews` keyed by `skillId`). Content is **not** stored in the DB — it ships with the bundle; the DB stores only user-generated state referencing content by stable string ids. That makes content updates a redeploy, never a data migration.

`ExportBundleV1` is a versioned JSON envelope (`{ schemaVersion: 1, exportedAt, tables: {...} }`). Import validates the version and refuses unknown ones. This is the manual laptop↔desktop sync story and, later, the seed data for first server sync.

---

## 9. Visualisations (V1: Linked List only)

A code-driven visualization has to see inside the user's structure. V1 uses **trace instrumentation**: for questions with a `VisualizationBinding`, the harness snapshots observable state after each scripted operation (e.g., walks the list via `head`/`next` up to a node cap) and appends frames to the report:

```ts
export interface VizFrame { step: number; label: string; state: Json }  // e.g. [3,1,4,1,5]
```

The UI plays frames through a `LinkedListView` SVG renderer (nodes, arrows, highlight diffs between frames). This is *post-hoc replay*, not live stepping — dramatically simpler, no Python debugger integration, and covers the pedagogical need ("watch your append actually attach the node"). The frame protocol is generic; tree/heap renderers later just add new state shapes and renderers, no engine changes.

The Learn stage additionally uses hand-authored animations (small React components) that don't depend on user code at all.

---

## 10. UI Surface (V1)

- **Roadmap** — React Flow DAG of all 17 nodes; 15 render as "coming soon" ghosts. Custom node = title + progress ring + mastery stars. Soft locking only: prerequisites are *recommended*, nothing is hard-locked (this is a personal tool; hard gates are friction without a reason).
- **Module page** — stage list with per-stage completion.
- **Question player** — split pane: prompt/hints left, Monaco right, results/viz bottom. Run (visible tests) / Submit (full grade) / Reset / auto-saving Draft / Notes drawer. Hints ladder unlocks 1→4 with confirmation; hint usage recorded.
- **Interview mode** — same player, chrome stripped: no hints, timer visible, grade shown only after submit.
- **Dashboard (trimmed)** — mastery overview by module, current/longest streak, Today's Review, weakest skills, recent attempts. The full 16-metric dashboard from the original brief is post-V1; these six are the ones with real data behind them on day one.
- **Review** — the daily queue, one question at a time.
- **Settings** — theme, editor prefs, export/import, wipe data.

Design system: dark-first token set in `ui/theme/` (background layers, one accent, semantic success/fail, 4-step type scale, 150–200 ms ease-out motion). Keyboard shortcuts from day one: ⌘Enter run, ⌘S draft, ⌘K palette (palette itself can land in polish phase).

---

## 11. Phased Implementation Plan

Each phase ends green (typecheck, tests, deploy) and usable. Estimates assume part-time solo work.

| # | Phase | Delivers | Est. |
|---|---|---|---|
| 0 | Scaffold | Vite+TS strict+Tailwind+Router, CI (typecheck/lint/test/build), tokens, deploy pipeline | ½ wk |
| 1 | Content spine | `content/types.ts`, registry, validation, roadmap DAG data, Roadmap page (static) | ½–1 wk |
| 2 | Execution | Pyodide worker + protocol, `PyodideRunner`, warm-spare lifecycle, editor route with Run + stdout | 1 wk |
| 3 | Grading | Harness builder (function+class modes), comparators, Scorecard UI; ~8 Linked List method questions live; CI runs canonical solutions | 1–1½ wk |
| 4 | Persistence | Dexie + adapter, attempts, drafts, mastery engine, stars on roadmap/module pages, export/import | 1 wk |
| 5 | Learning flow | Guided Build stepper, hints ladder, Learn-stage lesson renderer; Linked List content complete through Independent Build | 1–1½ wk |
| 6 | SRS + Dashboard | Scheduler, Today's Review, streaks, trimmed dashboard | 1 wk |
| 7 | Pattern kind | Arrays & Hashing module end-to-end (guided_apply, pattern_drills) — proves the discriminator | 1 wk |
| 8 | Viz + Interview | Linked List replay visualization; Interview Mode | 1 wk |
| 9 | Polish | Shortcuts, transitions, a11y pass, empty states, error states | ongoing |

**Milestone worth noticing:** the app becomes *useful to you* at the end of Phase 3 (~3 weeks in) — you can drill Linked List methods with real grading. Everything after that compounds value; nothing before Phase 3 should be gold-plated.

---

## 12. Future Extension Points (designed, not built)

- **Server-side execution** — implement `ServerRunner: PythonRunner`; the worker message protocol becomes the HTTP body. Unlocks trustworthy grading → leaderboards.
- **Accounts & sync** — `SupabaseAdapter: StorageAdapter`; `ExportBundleV1` seeds the first upload. Appendix A is the target schema.
- **AI code review / style scoring** — populate the reserved `style`/`readability` fields on `Scorecard` via an API call after local grading; UI already renders a scorecard, new rows appear.
- **Complexity analysis** — empirical: harness runs entry point at n, 10n, 100n and fits a curve; fills the reserved `complexity` field. Noisy in Pyodide; better post-ServerRunner.
- **More modules** — add a folder under `content/modules/`, register it, done. No engine work unless a new visualization shape is needed.
- **Leaderboards / social** — blocked on server execution by design; nothing in V1 pretends otherwise.

---

## Appendix A — Future Sync Schema (Postgres / Drizzle, not built in V1)

Target mapping when accounts arrive. Local tables translate 1:1 with a `user_id` column added; content stays in-repo (referenced by string id), so only user state syncs.

```ts
// packages/db/schema.ts (future)
users            (id uuid pk, created_at, settings jsonb)
attempts         (id uuid pk, user_id fk, question_id text, code text,
                  scorecard jsonb, hints_used int, duration_ms int, created_at,
                  index (user_id, question_id, created_at))
drafts           (user_id fk, question_id text, code text, updated_at,
                  pk (user_id, question_id))
skill_mastery    (user_id fk, skill_id text, score real, attempts int,
                  updated_at, pk (user_id, skill_id))
review_records   (user_id fk, skill_id text, ease real, interval_days real,
                  due_at timestamptz, lapses int, pk (user_id, skill_id))
notes            (id uuid pk, user_id fk, question_id text, body text, created_at)
bookmarks        (user_id fk, question_id text, created_at, pk (user_id, question_id))
day_log          (user_id fk, day date, pk (user_id, day))
```

Sync strategy when it lands: last-write-wins per row keyed on `updated_at`, with append-only tables (attempts, notes) merged by id — simple, adequate, and honest about not being CRDTs.

