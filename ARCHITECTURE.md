# Architecture Document — V1 (Static Client-Only)

**Status:** Approved direction · **Scope:** Vertical slice — Arrays & Hashing + Linked List, full learning loop · **Roadmap catalog:** all 18 modules defined as data in Phase 1
**Deployment target:** Static hosting (Cloudflare Pages / Vercel static / GitHub Pages)

---

## 1. Product & Scope Summary

A personal interview-preparation tool that teaches fluency in data structures and algorithmic patterns *before* problem-solving. V1 is a client-only application: no server, no accounts, no sync. All persistence is local (IndexedDB) behind a storage adapter so a backend can be added later without touching application code.

The roadmap is organised into **two categories**, each with its own learning template:

- **Data Structures** (`kind: 'data_structure'`) — you build the structure itself, then drill its methods. 4-stage pipeline: Learn → Guided Build → Independent Build → Method Drills.
- **Algorithms** (`kind: 'algorithm'`) — there is nothing to "build"; you learn the technique and apply it to scaffolded problems. Pipeline: Learn → Guided Apply → Algorithm Drills.

A standalone Interview Mode stage/route existed early on but was removed: the Review system (§13) — cold solve, no hints, graded on submit, across every already-solved exercise — absorbed its role entirely, and does it on a schedule instead of on demand.

The full 18-module catalog (§4.1) ships as **data** in Phase 1 — every node, edge, skill list, and stage skeleton is defined and rendered on the roadmap from day one. Only two modules ship with *content* in V1, one of each kind:

- **Linked List** — `kind: 'data_structure'` → exercises the full build pipeline.
- **Arrays & Hashing** — `kind: 'algorithm'` → exercises the apply pipeline.

If both kinds work end-to-end, every remaining roadmap node is a content problem, not an engineering problem. That is the definition of done for V1.

**Explicitly out of scope for V1** (but designed-for): server-side execution, AI code review, LLM style scoring, advanced complexity analysis, leaderboards, accounts/sync, content for the remaining 16 roadmap modules.

---

## 2. Technology Stack

| Concern | Choice | Rationale |
|---|---|---|
| Build/app framework | **Vite + React 18 + TypeScript (strict)** | Pure SPA; no server rendering needed. Faster iteration than Next.js for this shape. |
| Styling | **TailwindCSS** | Design-token driven dark theme; matches the Linear/Raycast aesthetic goal. |
| Code editor | **Monaco** via `@monaco-editor/react` | VS Code feel, Python syntax, keybindings. |
| Curriculum map | **Static CSS grid + SVG overlay** (no dependency) | 18 nodes in a fixed DAG never need pan/zoom/minimap — a tiered grid (rows = prerequisite depth) with an SVG overlay drawing edges between measured card positions covers it with zero graph-library weight. |
| Python execution | **Pyodide in a Web Worker** | Off-main-thread; killable; behind a `PythonRunner` interface for later server swap. |
| Local persistence | **Dexie (IndexedDB)** | Structured tables, indexes, migrations, comfortable size limits (localStorage is not viable for submission history). |
| App state | **Zustand** | Minimal global state (session, settings, review queue). Server-cache libraries (React Query) are unnecessary with no server. |
| Routing | **React Router** | Standard SPA routing. |
| Testing | **Vitest + Testing Library**; Playwright later | The grading engine and scheduler are pure functions — cheap to test well. |

**Decision record — why not Next.js:** nothing here needs SSR, API routes, or file-based data fetching. Vite gives faster HMR and a simpler mental model. If we later add a backend, it will be a separate concern (Supabase or a small API), not a reason to re-platform the client. Reversible decision; the React code is portable.

**Decision record — why not localStorage:** 5–10 MB soft cap, synchronous API, string-only values. Submission history plus drafts plus content cache will exceed it. Dexie also gives us versioned schema migrations, which we will genuinely use.

**Decision record — dropping React Flow (Triecode UI overhaul):** the roadmap is a fixed 18-node DAG, never user-editable, never panned or zoomed in practice — a full graph-visualization library was solving a problem V1 didn't have. Replaced with a static tiered CSS grid plus a small SVG overlay (§10); net dependency count goes down, one fewer thing to theme and keep accessible.

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

### 4.1 Module catalog — two categories, 18 modules

The catalog below is the complete roadmap DAG shipped as data in Phase 1. Prerequisite edges follow the standard interview-prep progression (Arrays & Hashing at the root, Math & Geometry at the leaves).

**Category: Data Structures** (`kind: 'data_structure'`) — build it, then drill its methods.

| id | Title | Prerequisites | Representative skills (examples) |
|---|---|---|---|
| `stack` | Stack | `arrays-hashing` | push/pop/peek, monotonic stack, valid parentheses |
| `linked-list` | Linked List | `two-pointers` | append, reverse, cycle detect, merge, fast/slow |
| `trees` | Trees | `binary-search`, `linked-list` | insert, DFS/BFS traversals, depth, invert, validate BST |
| `tries` | Tries | `trees` | insert, search, startsWith, word search backtrack |
| `heap-pq` | Heap / Priority Queue | `trees` | sift-up/down, heapify, k-th element, two-heap median |
| `graphs` | Graphs | `backtracking` | adjacency build, BFS/DFS, connected components, topo sort |

**Category: Algorithms** (`kind: 'algorithm'`) — learn the technique, apply it to problems.

| id | Title | Prerequisites | Representative skills (examples) |
|---|---|---|---|
| `arrays-hashing` | Arrays & Hashing | — (root) | frequency count, seen-set, prefix sums, grouping by key |
| `two-pointers` | Two Pointers | `arrays-hashing` | converging pointers, partition, pair-sum on sorted input |
| `binary-search` | Binary Search | `two-pointers` | classic search, boundary (first/last true), search on answer |
| `sliding-window` | Sliding Window | `two-pointers` | fixed window, variable window, window with hashmap state |
| `backtracking` | Backtracking | `trees` | subsets, permutations, constraint pruning |
| `intervals` | Intervals | `heap-pq` | merge, insert, overlap detection, sweep |
| `greedy` | Greedy | `heap-pq` | exchange argument, local-choice proofs, jump/stock patterns |
| `advanced-graphs` | Advanced Graphs | `heap-pq`, `graphs` | Dijkstra, union-find, MST, topological orderings |
| `dp-1d` | 1-D DP | `backtracking` | memoization, tabulation, house-robber/climb patterns |
| `dp-2d` | 2-D DP | `dp-1d`, `graphs` | grid paths, LCS, edit distance, knapsack |
| `bit-manipulation` | Bit Manipulation | `dp-1d` | masks, XOR tricks, counting bits, shifts |
| `math-geometry` | Math & Geometry | `dp-2d`, `bit-manipulation`, `graphs` | matrix rotation, spiral, pow/modular arithmetic, GCD |

DAG edges (child listed under parent), matching the reference roadmap:

```
arrays-hashing → two-pointers, stack
two-pointers   → binary-search, sliding-window, linked-list
binary-search  → trees
linked-list    → trees
trees          → tries, backtracking, heap-pq
heap-pq        → intervals, greedy, advanced-graphs
backtracking   → graphs, dp-1d
graphs         → advanced-graphs, dp-2d, math-geometry
dp-1d          → dp-2d, bit-manipulation
dp-2d          → math-geometry
bit-manipulation → math-geometry
```

**Note on Graphs:** it sits in Data Structures because there is a genuine build pipeline (adjacency list/matrix classes, BFS/DFS as methods) even though most of its interview value is algorithmic. Its algorithm-heavy sequel, Advanced Graphs, sits in the Algorithms category. This split mirrors how the two kinds' stage templates differ.

### 4.2 The kind discriminator

```ts
// content/types.ts
export type ModuleKind = 'data_structure' | 'algorithm';
export type ModuleCategory = 'Data Structures' | 'Algorithms';  // display grouping; derived 1:1 from kind

export interface RoadmapModule {
  id: ModuleId;                    // 'linked-list', 'arrays-hashing', ... (18 total, §4.1)
  kind: ModuleKind;
  title: string;
  summary: string;
  prerequisites: ModuleId[];       // edges of the roadmap DAG
  stages: Stage[];                 // ordered; template depends on kind
  skills: Skill[];                 // the units mastery is tracked against
}
```

**Decision record — rename `'pattern'` → `'algorithm'`:** the earlier draft called the second kind `pattern`. It is renamed to `algorithm` so the code taxonomy matches the two user-facing categories (Data Structures / Algorithms) exactly. Pure rename; the stage template and pipeline are unchanged. Stage and skill identifiers are renamed to match (`pattern_drills` → `algorithm_drills`, `pattern_application` → `algorithm_application`, `pattern_problem` → `algorithm_problem`).

### 4.3 Stage templates per kind

```ts
export type StageType =
  | 'learn'              // both kinds
  | 'guided_build'       // data_structure only
  | 'independent_build'  // data_structure only
  | 'method_drills'      // data_structure only
  | 'guided_apply'       // algorithm only — scaffolded walkthrough of the technique
  | 'algorithm_drills';  // algorithm only — apply technique to fresh problems
// No 'interview_mode' — the review system (§13) absorbed that role and
// isn't a stage in any module's content; it operates across every already-
// solved reviewable exercise on its own schedule instead.

export interface Stage {
  type: StageType;
  title: string;
  items: StageItem[];    // lesson sections or question refs
}
```

A validation function (`content/validate.ts`, run in CI) enforces that stage sequences match the kind — an `algorithm` module containing `guided_build` fails the build. It also validates the DAG itself: all 18 ids present, edges reference known ids, no cycles. Invalid content cannot ship.

### 4.4 Skills — the atom of progress

Mastery is tracked per **skill**, not per question. A skill is something like `linked-list/reverse` or `arrays-hashing/frequency-count`. Many questions can exercise one skill; one question may exercise several.

```ts
export interface Skill {
  id: SkillId;                     // 'linked-list/append'
  moduleId: ModuleId;
  title: string;                   // 'append()'
  kind: 'method' | 'full_structure' | 'algorithm_application' | 'concept';
}
```

This indirection is what makes the dashboard ("weakest topics"), spaced repetition ("review append(), it's decaying"), and the star display all coherent — they all read the same per-skill records.

### 4.5 Questions

```ts
export type QuestionKind =
  | 'method_impl' | 'full_impl' | 'algorithm_problem'
  | 'conceptual' | 'complexity' | 'debugging';

export interface CodeQuestion {
  id: QuestionId;
  kind: 'method_impl' | 'full_impl' | 'algorithm_problem' | 'debugging';
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
│   ├── roadmap.ts                # DAG: all 18 node ids + edges + categories (2 with content in V1)
│   ├── validate.ts               # structural + DAG validation, run in CI
│   └── modules/
│       ├── linked-list/          # category: Data Structures
│       │   ├── module.ts         # stages, skills
│       │   ├── lessons/          # learn-stage markdown/MDX-like sections
│       │   └── questions/        # one file per question
│       ├── arrays-hashing/       # category: Algorithms
│       │   └── ... same shape
│       └── (16 more folders land post-V1: stack/, trees/, tries/, heap-pq/,
│            graphs/, two-pointers/, binary-search/, sliding-window/,
│            backtracking/, intervals/, greedy/, advanced-graphs/,
│            dp-1d/, dp-2d/, bit-manipulation/, math-geometry/)
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
│   ├── mastery/
│   │   └── mastery.ts            # attempts -> exercise/module/skill scores (§7.2)
│   ├── roadmap/
│   │   └── dag.ts                # computeModuleDepths, orderModulesByDag (§10.3, §10.5)
│   └── nextAction/
│       └── selectNextAction.ts   # ProgressSnapshot -> NextAction (§10.5)
├── storage/
│   ├── adapter.ts                # StorageAdapter interface
│   ├── dexie/
│   │   ├── db.ts                 # Dexie schema + migrations
│   │   └── dexieAdapter.ts
│   └── exchange.ts               # export/import progress as versioned JSON
├── workers/
│   └── pyodide.worker.ts
├── ui/
│   ├── routes/                   # Home, Module, Learn, Question player, Guided sequence,
│   │                              # Interview, Review (Settings not yet built)
│   ├── components/
│   │   ├── shell/                 # AppShell, FocusShell (§10.1)
│   │   ├── editor/                 # Monaco wrapper, run/submit/reset/draft toolbar
│   │   ├── module/                 # ModuleStepper (§10.4)
│   │   ├── question/               # prompt pane, hints ladder, scorecard, player layout
│   │   ├── viz/                    # visualization renderers (§9) + InteractiveFigure
│   │   └── common/                 # ProgressRing, EmptyState, CommandPalette, ...
│   ├── hooks/                     # useQuestionPlayer, useDocumentTitle
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

### 7.2 Mastery (per exercise, per module, per skill — pure function over attempt history)

**Superseded (Triecode UI overhaul):** the original design stored an incrementally-updated per-skill EWMA (`SkillMastery`, 0–5 stars) in its own Dexie table. That table and the `getMastery`/`upsertMastery` adapter methods are gone. Mastery is now computed fresh from `Attempt` history every time it's needed — nothing is stored, so there is no incremental-update bug class and no migration cost when the formula changes (Phase 5's time-decay can slot into `computeExerciseScore` without any consumer changing).

```ts
// engine/mastery/mastery.ts
export function computeExerciseScore(attempts: Attempt[]): number
export function computeModuleMastery(module: RoadmapModule, attempts: Attempt[], isLearnComplete: boolean): number
export function computeSkillScore(skillId: SkillId, questions: CodeQuestion[], attempts: Attempt[]): number
```

- **Exercise score** — walk a question's attempts in order until the first Submit that scores 100 (overall). If none ever did, score is `0`. Otherwise: start at `1.0`, multiply by `0.85` per hint revealed before that pass, multiply by `0.9` per failed Submit before that pass, floor the result at `0.4` (a clean-eventual pass is never worth nothing). A clean first-submit, no-hints pass scores exactly `1.0`.
- **Module mastery** — the mean of every exercise's score across the module, all weighted equally regardless of stage. If the module has a non-empty Learn stage, "has this Learn stage been marked complete" contributes one more exercise-equivalent (`1` or `0`) to that same mean — this is why `computeModuleMastery` also takes `isLearnComplete`, sourced from the `learnCompletions` table (§8), not from attempts.
- **Skill score** — the mean exercise score across every question tagged with that skill. This is what feeds `buildTodaysReview`'s priority sort (§7.3) now, replacing the old stored `SkillMastery.score`.

`ProgressRing` (§10) renders `computeModuleMastery`'s 0–1 output directly as a percentage — never raw solved/total — so a module with 8 easy passes and 2 hint-heavy near-misses reads differently from one with 10 clean passes, even at the same solved count.

### 7.3 Spaced repetition

**Superseded (Review system):** the per-skill SM-2-lite scheduler originally described in this subsection — `ReviewRecord { skillId, ease, intervalDays, dueAt, lapses }`, `buildTodaysReview` picking one random question per due skill — is gone. The reviewable unit is the exercise, not the skill, and scheduling is a fixed interval ladder rather than an ease factor. See §13 for the current design; the review-urgency field `selectNextAction` (§10.5) reads is now `ReviewState.dueAt`, not a skill-level record.

### 7.4 Streaks

A `dayLog` table records one row per active day. Streak = consecutive-day count computed at read time in the user's local timezone. No cron, no server.

---

## 8. Storage Layer

```ts
// storage/adapter.ts
export interface StorageAdapter {
  getAttempts(q?: AttemptQuery): Promise<Attempt[]>;
  saveAttempt(a: Attempt): Promise<void>;
  /** Overwrites an existing attempt's self-tags (§10) — the attempt itself is otherwise immutable. */
  updateAttemptTags(attemptId: string, tags: AttemptTag[]): Promise<void>;
  getDraft(questionId: QuestionId): Promise<Draft | null>;
  saveDraft(d: Draft): Promise<void>;
  getReviewStates(): Promise<ReviewState[]>;
  upsertReviewState(r: ReviewState): Promise<void>;
  getLearnCompletions(): Promise<LearnCompletion[]>;
  /** Idempotent — marking an already-complete module complete again is a no-op update. */
  markLearnComplete(moduleId: ModuleId): Promise<void>;
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

**Superseded (Triecode UI overhaul):** `getMastery`/`upsertMastery` and the `mastery` table are gone — mastery is a pure computation over `attempts` now (§7.2), nothing to store. Added instead: `updateAttemptTags` (post-fail self-tags, §10) and `getLearnCompletions`/`markLearnComplete` (one row per module whose Learn stage was explicitly marked complete — feeds mastery's Learn exercise-equivalent and `selectNextAction`, §10).

Dexie tables mirror these entities 1:1, keyed and indexed for the queries above (`attempts` indexed by `questionId` and `createdAt`; `reviewStates` keyed by `questionId`, §13; `learnCompletions` keyed by `moduleId`). Content is **not** stored in the DB — it ships with the bundle; the DB stores only user-generated state referencing content by stable string ids. That makes content updates a redeploy, never a data migration.

`ExportBundleV1` is a versioned JSON envelope (`{ schemaVersion: 1, exportedAt, tables: {...} }`). Import validates the version and refuses unknown ones. This is the manual laptop↔desktop sync story and, later, the seed data for first server sync.

---

## 9. Visualisations (V1: Linked List only)

A code-driven visualization has to see inside the user's structure. V1 uses **trace instrumentation**: for questions with a `VisualizationBinding`, the harness snapshots observable state after each scripted operation (e.g., walks the list via `head`/`next` up to a node cap) and appends frames to the report:

```ts
export interface VizFrame { step: number; label: string; state: Json }  // e.g. [3,1,4,1,5]
```

The UI plays frames through a `LinkedListView` SVG renderer (nodes, arrows, highlight diffs between frames). This is *post-hoc replay*, not live stepping — dramatically simpler, no Python debugger integration, and covers the pedagogical need ("watch your append actually attach the node"). The frame protocol is generic; tree/heap/graph renderers later just add new state shapes and renderers, no engine changes — which is exactly what the Trees, Heap / Priority Queue, and Graphs modules will need.

The Learn stage additionally uses hand-authored figures that don't depend on user code at all — either a static `SequenceDiagramSpec` (boxes, optional arrows, optional pointer labels) or, where a lesson benefits from being manipulated rather than just read, an `InteractiveFigureBinding` (Triecode UI spec §9):

```ts
// content/types.ts
export interface InteractiveFigureBinding { kind: 'stack_push_pop' }  // more kinds add more values, not new fields
```

`kind` selects the renderer in `ui/components/viz/InteractiveFigure.tsx` — the same selector pattern `VisualizationBinding` uses for trace-frame renderers. The stack module's "What is a stack?" lesson uses the one figure shipped so far: a real local-state Push/Pop demo (capped at 6 elements) so the LIFO discipline is felt, not just read. Both figure kinds are content-declared (a `LessonSection` field), never user-code-driven, and never touch storage.

---

## 10. UI System (Triecode UI overhaul)

**Superseded (Triecode UI overhaul):** this replaces the original §10 wholesale — separate Roadmap and Dashboard pages, React Flow, and the five-dot stage-completion glyphs are gone. The sections below are the current source of truth for the UI layer; app name is **Triecode** everywhere user-visible.

**Core philosophy — guidance, not gates.** Nothing in the UI is locked. The one exception: a module with no authored content yet renders recessed with the literal text "In development" and isn't navigable — everything else is a live link regardless of progress elsewhere. The words "locked", "unlocks", and "coming soon" do not appear anywhere. No XP, badges, levels, avatars, sound, or confetti; the only motion is the `ProgressRing` arc and ≤200 ms transitions, both respecting `prefers-reduced-motion`.

### 10.1 Two shells

Every route uses exactly one of:

- **`AppShell`** — persistent nav (wordmark + Home + Review), ~1100px centered column. Used by "browse/plan" screens: Home, Module.
- **`FocusShell`** — a single "← back to {origin}" link, full-viewport content, nav recedes. Used by "do the work" screens: Learn, the question editor (including Guided Build/Apply steps and review sessions, §13). The back action is usually a route (`backHref`); a review session instead passes `onBack` so "← End session" ends into the in-page summary state rather than navigating away and losing it.

`/roadmap` and `/dashboard` redirect to `/` — both pages merged into Home (§10.3).

### 10.2 Tokens and `ProgressRing`

`ui/theme/` defines `--bg-page` / `--bg-surface` / `--bg-surface-raised` (raised used sparingly — hero CTA, active editor pane), border tokens that only appear on hover/focus, `--success`, and three text levels (primary/secondary/muted). **Accent encodes exactly one meaning app-wide: "your frontier/recommended action"** — at most one accent-emphasized element per screen (hero CTA, the frontier module's ring/border, the current lesson step, a stage's Up-next card). Category color (Data Structures vs. Algorithms) is a separate, always-present distinction and never competes with accent for the same meaning.

`ProgressRing` (`ui/components/common/ProgressRing.tsx`) is the one shared progress identity element — Home's module cards and the Module page header use the exact same component at `sm`/`lg` sizes, so advancing a module visibly transforms both. It always renders a real percentage (0% is a full track plus the text "0%", never a bare empty circle); the arc is accent only when the module is the global frontier (else neutral), success-colored (optionally a check glyph) at 100%. Its input is always `computeModuleMastery` (§7.2) — never raw solved/total.

### 10.3 Home (`/`)

Replaces Roadmap + Dashboard:

- **Hero** — a dominant raised card reading whatever `selectNextAction` (§10.5) recommends: "N reviews due — Start review →" or "Continue: {module} — {exercise} →". Below it, a compact stats strip (streak, solved this week, total mastered).
- **Streak heatmap** — renders nothing (not an empty grid) until ≥7 days of logged activity exist.
- **Tiered curriculum map** — CSS grid rows keyed by `computeModuleDepths` (`engine/roadmap/dag.ts`, prerequisite depth), each row a wrapping flex of module cards. An SVG overlay (`useCardPositions` — a `useLayoutEffect` measuring real card `getBoundingClientRect()`s, re-run once loading data resolves and cards actually mount) draws prerequisite edges as quiet curves; caption reads "Suggested path — everything is open." Edges hide below the `md` breakpoint. No pan, zoom, or minimap (§2's decision record).
- **Module cards** — title, category color, `sm ProgressRing`, "{n} of {m}" exercise count. States: the one global frontier module (accent ring + border), every other authored module (full-strength, always clickable), in-development ghosts (recessed, "In development", not a link). No category filter chips — the static layout plus category coloring is legible without them.

### 10.4 Module page (`/modules/:id`) and Learn (`/modules/:id/learn`)

Module page: `AppShell`, header with `lg ProgressRing` (frontier-aware, same as Home), category, summary, a quiet "Leads to: {dependent module titles}" line when other modules list this one as a prerequisite. Body is a vertical stepper — one entry per declared stage (stage ladders come from content order, validated by `validateStageOrder`, never an `if (kind === ...)` branch in the component, §4.3):

- **Completed** — collapsed one-liner, check glyph + summary.
- **Current (frontier)** — expanded, contains the screen's one accent element: an Up-next card with a Start button, remaining exercises listed below.
- **Upcoming** — quiet `<details>`, but every item is a live link at all times — never disabled, never reduced-opacity.

Learn: `FocusShell`, ~720px reading column, one lesson at a time behind a numbered-dot stepper (current = accent, completed = check) that replaces the old TOC + "LESSON N OF M" label — every dot is clickable regardless of order. Each lesson ends with a full-width `Continue →`; the final lesson instead reads `Mark Learn complete — start {stage} →`, which calls `storageAdapter.markLearnComplete` (idempotent) and routes straight to that stage's first step. Lesson figures: `StaticSequenceDiagram` or `InteractiveFigure` (§9).

### 10.5 `selectNextAction` — the recommendation seam

```ts
// engine/nextAction/selectNextAction.ts
export type NextAction =
  | { kind: 'review'; dueCount: number }
  | { kind: 'learn'; moduleId: ModuleId; moduleTitle: string; href: string }
  | { kind: 'exercise'; moduleId: ModuleId; moduleTitle: string; questionId: QuestionId; questionTitle: string; href: string }
  | { kind: 'none' };

export function selectNextAction(snapshot: ProgressSnapshot): NextAction
```

Pure, unit-tested, takes a full `ProgressSnapshot` (no storage access itself). V1 policy: due reviews win; otherwise an in-progress module wins over an untouched one, DAG order (`orderModulesByDag`, same depth computation Home's layout uses) breaking ties within each group and acting as the sole ordering when nothing has been started. **Consumed by exactly three places** — Home's hero, Home's frontier ring highlighting, and the Module page's Up-next card — and it only ever recommends; no consumer may use its output to disable anything. The review-urgency check reads the exercise-level `ReviewState.dueAt` (§13); a future SM-2-style scheduler swaps in behind that same field, and deeper exercise-ordering heuristics can replace the DAG-order fallback, without any consumer changing, by design.

### 10.6 Question player (editor)

Split pane: prompt/hints left (bounded width, not one fixed magic number), Monaco right, a fixed-height Results strip (muted "Results" label, so the layout doesn't reflow between empty and populated) at the bottom. Run (visible tests) / Submit (full grade, Cmd/Ctrl+Shift+Enter as well as the button) / Reset (Cmd/Ctrl+Enter still runs); both shortcuts shown subtly on their buttons. After a passing Submit, "Compare with reference solution" reveals `CodeQuestion.solution`. After a failing Submit, four optional one-tap self-tags (Edge case / Off-by-one / Wrong approach / Syntax) persist against that attempt via `updateAttemptTags` (§8) — the attempt record is otherwise immutable. Pyodide's `warmup()` is scheduled on `requestIdleCallback` from the app root rather than run synchronously at mount, so it doesn't sit on the critical rendering path but still fires regardless of entry route (§6.2's "warmup on app start" invariant).

**Review sessions** reuse this same player with three chrome differences — hints panel doesn't render, the chip strip scopes to the session queue instead of a module's exercise list, and the back link reads "← End session" — detailed in §13. There is no separate Interview Mode: review sessions (cold, no hints, graded on submit) absorbed that role entirely.

**Settings** (Phase 8, not yet built) — theme, editor prefs, export/import, wipe data.

Keyboard shortcuts: Cmd/Ctrl+Enter run, Cmd/Ctrl+Shift+Enter submit, Cmd/Ctrl+S draft, ⌘K command palette (already wired — `ui/components/common/CommandPalette.tsx`).

---

## 11. Phased Implementation Plan

Each phase ends green (typecheck, tests, deploy) and usable. Estimates assume part-time solo work.

| # | Phase | Delivers | Est. |
|---|---|---|---|
| 0 | Scaffold | Vite+TS strict+Tailwind+Router, CI (typecheck/lint/test/build), tokens, deploy pipeline | ½ wk |
| 1 | Content spine | `content/types.ts` with the two-category taxonomy, registry, validation (stage templates + DAG integrity), **full 18-module roadmap data** — ids, titles, categories, edges, skill lists, stage skeletons for every node in §4.1 — Roadmap page (static, category-styled nodes) | 1 wk |
| 2 | Execution | Pyodide worker + protocol, `PyodideRunner`, warm-spare lifecycle, editor route with Run + stdout | 1 wk |
| 3 | Grading | Harness builder (function+class modes), comparators, Scorecard UI; ~8 Linked List method questions live; CI runs canonical solutions | 1–1½ wk |
| 4 | Persistence | Dexie + adapter, attempts, drafts, mastery engine, stars on roadmap/module pages, export/import | 1 wk |
| 5 | Learning flow | Guided Build stepper, hints ladder, Learn-stage lesson renderer; Linked List content complete through Independent Build | 1–1½ wk |
| 6 | SRS + Dashboard | Scheduler, Today's Review, streaks, trimmed dashboard | 1 wk |
| 7 | Algorithm kind | Arrays & Hashing module end-to-end (guided_apply, algorithm_drills) — proves the discriminator | 1 wk |
| 8 | Viz + Interview | Linked List replay visualization; Interview Mode | 1 wk |
| 9 | Polish | Shortcuts, transitions, a11y pass, empty states, error states | ongoing |

Phase 1 grows slightly (½–1 wk → 1 wk) to absorb authoring the full catalog data: 18 module stubs with skills and stage skeletons rather than 2. This is deliberate — defining every node's skills up front forces the taxonomy to be right before any grading code depends on it, and the roadmap page is honest about the full curriculum from day one.

**Milestone worth noticing:** the app becomes *useful to you* at the end of Phase 3 (~3 weeks in) — you can drill Linked List methods with real grading. Everything after that compounds value; nothing before Phase 3 should be gold-plated.

---

## 12. Future Extension Points (designed, not built)

- **Server-side execution** — implement `ServerRunner: PythonRunner`; the worker message protocol becomes the HTTP body. Unlocks trustworthy grading → leaderboards.
- **Accounts & sync** — `SupabaseAdapter: StorageAdapter`; `ExportBundleV1` seeds the first upload. Appendix A is the target schema.
- **AI code review / style scoring** — populate the reserved `style`/`readability` fields on `Scorecard` via an API call after local grading; UI already renders a scorecard, new rows appear.
- **Complexity analysis** — empirical: harness runs entry point at n, 10n, 100n and fits a curve; fills the reserved `complexity` field. Noisy in Pyodide; better post-ServerRunner.
- **More modules** — the remaining 16 nodes are already defined as data (§4.1); shipping one means writing its content folder under `content/modules/` and flipping it from ghost to live. Suggested authoring order follows the DAG: Stack → Two Pointers → Binary Search → Sliding Window → Trees → … No engine work unless a new visualization shape is needed (trees, heaps, and graphs will each want one).
- **Leaderboards / social** — blocked on server execution by design; nothing in V1 pretends otherwise.

---

## 13. Review System

Supersedes §7.3's per-skill SM-2-lite scheduler. The reviewable unit is the **exercise** (not the skill), scheduled on a **fixed interval ladder** (not an ease factor), taken in timed, interleaved **sessions** (not one question at a time) — this section is the live design; §7.3 is a pointer here.

### 13.1 The review pool

Only exercises passed at least once enter the pool — Learn stages never do (re-reading is weak review). Reviewability is a required content field:

```ts
// content/types.ts — CodeQuestion
reviewable: boolean;             // guided-build/guided-apply steps: false; independent-build, method-drill, algorithm-drill: true
reviewFastThresholdMs?: number;  // overrides DEFAULT_FAST_THRESHOLD_MS (10 min) for this exercise's "fast pass" check
```

A convention, not a computed default — every question sets it explicitly (guided steps `false`, everything else `true`), and `content/validate.ts` asserts the field is present and boolean. No `if (stage === ...)` branch anywhere reads stage type to infer it. A review is the full solve: starter code, run, submit, graded by the same harness as first-time practice — no diffing, no shortened variant.

### 13.2 Scheduler — fixed interval ladder

```ts
// engine/srs/scheduler.ts
export const RUNG_INTERVALS_DAYS = [1, 3, 7, 14, 30, 60] as const; // rung 0-5
export function enterReview(questionId: QuestionId, now: string): ReviewState
export function scheduleReview(state: ReviewState, outcome: ReviewOutcome, now: string): ReviewState

// storage/types.ts
export interface ReviewState {
  questionId: QuestionId;
  rung: number;       // 0-5, index into RUNG_INTERVALS_DAYS
  dueAt: string;       // ISO
  lapses: number;
  lastReviewedAt: string; // ISO
}
```

- A first-ever pass of a `reviewable` exercise (outside a review session) calls `enterReview`: rung 0, due tomorrow.
- A review outcome is graded on objective telemetry only — no self-rating anywhere in the UI:
  - Clean pass (first submit passes) **and** fast (under `reviewFastThresholdMs` ?? 10 min): advance 2 rungs.
  - Clean pass, not fast: advance 1 rung.
  - Scraped pass (multiple submits before passing): stay on the same rung, rescheduled from `now`.
  - Failed (abandoned or skipped without passing): lapse to rung 0, `lapses += 1`.
  - Capped at rung 5 (60 days) — a clean fast pass at the cap stays at 60 days.
- Pure, clock-free (`now` passed in), unit-tested for every rung transition, lapse, cap, and due-date computation. This is the same kind of seam §7.2/§10.5 already use: a future SM-2-style algorithm can replace the ladder inside `scheduleReview` without any consumer (the session player, `selectNextAction`) changing.
- **Persistence:** `reviewStates` Dexie table (`v4`, keyed by `questionId`), replacing the dropped `reviewRecords` table. `attempts` gained a `context: 'practice' | 'review'` field (default `'practice'`) so review-session attempts are distinguishable in the same table rather than a parallel one.

### 13.3 Sessions

`engine/srs/queue.ts`'s `buildReviewQueue(reviewStates, questions, todayIso, cap)` builds a session: every due exercise, sorted most-overdue-first (ties broken by lower rung — fragile memories before stable ones), interleaved across modules via one adjacent-swap pass (`do not over-engineer beyond one pass` — a same-module pair with nothing later to swap with just stays adjacent), capped at `DEFAULT_SESSION_CAP` (10; `QUICK_SESSION_CAP` = 5 is the same ordering, just the first 5).

In-session, `ui/components/review/ReviewSessionPlayer.tsx` reuses the standard question player (§10.6) with three chrome differences: hints panel doesn't render (`hideHints`); the chip strip scopes to the session queue in queue order, not a module's exercise list; and the top bar/back-link read `Review · {i} of {N} — {exercise} ({module})` / `← End session`, the latter an in-page `onBack` callback (not a route) so ending early routes into the summary state with un-attempted items simply left due, rather than navigating away and losing the in-progress outcome list. A provenance block above the prompt — module name, `{nth} review · last reviewed {n} days ago`, `Pass → next review in {interval} days` — makes the interval ladder legible on every card; it needs only data already in `ReviewState` plus a count of prior `context: 'review'` attempts.

Per-item outcomes: a pass reschedules (§13.2) and auto-advances (after a brief pause so the passing scorecard is visible) to the next item. A failed submit doesn't advance — the existing post-fail self-tag UI lets the user keep trying; "Skip" is a deliberate two-step action (first reveals `CodeQuestion.solution`, second click confirms) so a lapse is never a silent side effect of clicking away. An ad-hoc drill item that wasn't actually due (the weakest-module drill, §13.4) never lapses on failure — only a real due review's schedule is touched — but still reschedules normally on a pass, since "a review is a review."

### 13.4 The Review page — three states

`ui/routes/ReviewPage.tsx`, `AppShell`:

- **Due** — hero (`{N} due — Start session →`, ~N×6 min estimate, `Quick 5` when N > 5) plus a read-only queue-preview table (exercise, module, last reviewed, current interval) for trust; the action is the session, not cherry-picking rows.
- **Caught up** — never blank. `{n} due tomorrow · {n} due this week` when the pool is non-empty, with a `Drill weakest module →` escape hatch (up to 5 reviewable, already-solved questions from the lowest-mastery module, regardless of due status). When the pool is empty entirely (nothing solved yet), the forecast is replaced by one explanatory sentence and a `Continue practicing →` link via `selectNextAction`.
- **Summary** — passed/lapsed lists, mastery deltas per touched module (`ProgressRing` animating old → new value — the only place rings animate outside normal state change), a next-due forecast, and one primary action (`Done →` to Home, or `Continue practicing →` if nothing else is due and there's an active frontier).

A Module-page row for a due exercise gets a small accent dot + "due for review" secondary text and links straight to `/review?start={questionId}`, which auto-starts a single-item session for it (§10.4) — the only other module-page change.

### 13.5 Integration

- `selectNextAction` (§10.5): due reviews win, reading `ReviewState.dueAt` directly.
- **Mastery** (§7.2): a lapse — a failed `context: 'review'` attempt after the exercise already passed once — multiplies `computeExerciseScore`'s result by 0.8 (same 0.4 floor), read straight from attempt history rather than a separate counter, so review outcomes and mastery stay driven by the same source of truth.
- No self-rating buttons, ease factors, or scheduling controls anywhere — the system schedules, the user solves. No notifications/emails/reminders. No streak mechanics beyond the existing stats strip.

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
review_states    (user_id fk, question_id text, rung int, due_at timestamptz,
                  lapses int, last_reviewed_at timestamptz, pk (user_id, question_id))
notes            (id uuid pk, user_id fk, question_id text, body text, created_at)
bookmarks        (user_id fk, question_id text, created_at, pk (user_id, question_id))
day_log          (user_id fk, day date, pk (user_id, day))
```

Sync strategy when it lands: last-write-wins per row keyed on `updated_at`, with append-only tables (attempts, notes) merged by id — simple, adequate, and honest about not being CRDTs.