# CLAUDE.md

**Triecode** — a personal interview-prep tool: learn to implement data structures
and algorithmic patterns from memory, with in-browser Python grading. Static
client-only SPA — no server, no accounts. Full design in `ARCHITECTURE.md`
(read it before any work), including its §10 "UI System" section — the current
source of truth for shells, tokens, `ProgressRing`, the `selectNextAction` seam,
and the mastery formula, all introduced by the Triecode UI overhaul (see the
first note after the Phases list below) — and its §13 "Review System" section,
the current source of truth for the review pool, the fixed-interval scheduler,
review sessions, and the Review page's three states (see the second note).

The curriculum is an 18-module roadmap DAG split into two categories
(ARCHITECTURE.md §4.1): **Data Structures** (`kind: 'data_structure'` — build
the structure, drill its methods) and **Algorithms** (`kind: 'algorithm'` —
learn the technique, apply it to problems). V1 ships content for one module of
each kind (Linked List, Arrays & Hashing); all 18 nodes ship as data.

## Workflow rules (non-negotiable)

- Work on **exactly one phase at a time** (see Phases below). Never start work
  from a later phase, even if it seems convenient.
- A phase is done only when its Definition of Done is met AND
  `npm run check` passes (typecheck + lint + test + build). Stop there and
  summarise what was built. Do not continue to the next phase unprompted.
- If ARCHITECTURE.md and a request conflict, say so before writing code.
- Never weaken TypeScript strictness, delete failing tests, or skip CI checks
  to get green. Fix the cause.

## Architecture invariants

- Four layers with strict dependency direction: `ui/` → `engine/` → `storage/` → `content/`.
- `engine/` contains **no React and no Dexie imports** — pure functions and
  interfaces only. Grading, scheduling, and mastery must be unit-testable in isolation.
- `ui/` never touches IndexedDB directly; all persistence goes through
  `storage/adapter.ts` (`StorageAdapter`).
- `content/` is typed data only. Content files never import from `ui/` or `engine/`.
- All Python execution goes through the `PythonRunner` interface
  (`engine/runner/types.ts`). UI code never talks to the worker directly.
- Grading executes Python behaviour via generated harnesses. Never grade by
  comparing code text.
- User state references content by stable string ids (`ModuleId`, `SkillId`,
  `QuestionId`). Content is never stored in the database.
- `ModuleKind` is `'data_structure' | 'algorithm'` and determines the stage
  template (§4.3). Kind/stage mismatches (e.g. an `algorithm` module with
  `guided_build`) must fail content validation — never special-case them in code.

## Stack

Vite · React 18 · TypeScript (strict) · TailwindCSS · React Router ·
Monaco (`@monaco-editor/react`) · Pyodide (Web Worker) · Dexie · Vitest +
Testing Library. (React Flow was removed by the Triecode UI overhaul — see
ARCHITECTURE.md §2's decision record and §10.3; Zustand was never actually
adopted — there's no global client state that isn't already either component
state or `StorageAdapter`-backed.)

## Commands

- `npm run dev` — dev server
- `npm run check` — typecheck + lint + test + build (must pass to end a phase)
- `npm run test` — vitest

## Code standards

- Strict TS everywhere; no `any`, no non-null assertions without a comment.
- Small composable components; composition over inheritance.
- Every pure module in `engine/` ships with unit tests in the same phase.
- Dark-mode-first; all colours/spacing/motion from tokens in `ui/theme/`.
- Accessible by default: keyboard reachable, focus states, semantic HTML.

## Phases

### Phase 0 — Usable drill tool (goal: I can practise TODAY)
Scaffold (Vite, strict TS, Tailwind, Router, `npm run check`, deployable static
build). Minimal content types (`CodeQuestion`, `HarnessSpec`, function mode
only). `PyodideRunner` with a single worker, warmup on app start, timeout via
`worker.terminate()` + respawn (no warm spare yet). Function-mode harness
builder with `deep` and `unordered` comparators, sentinel-delimited JSON
report. Question player route: prompt pane, Monaco (dark, ⌘Enter = Run),
Run (visible tests) / Submit (all tests) / Reset, scorecard with per-test
results. Content: 8 Linked List method-drill questions (append, prepend,
delete, search, reverse, find middle, detect cycle, merge two sorted), each
with starter code, solution, 4 hints (simple collapsible ladder), visible +
hidden + edge tests. A plain list page linking to the questions.
**DoD:** deployed static site where I can open any of the 8 questions, write
Python, run it against real tests, and see a correctness/edge-case scorecard.
No persistence — refresh loses work. That is accepted in this phase.

### Phase 1 — Hardening + class mode
Warm-spare worker rotation (per ARCHITECTURE.md §6.2). Class-mode harness with
operation scripts (§6.3). Content validation (`content/validate.ts`) wired
into `npm run check`. CI test that runs every canonical solution through its
own harness via Pyodide **in Node** and requires 100%. `checker` and
`float_close` comparators. 2–3 full-implementation Linked List questions.
**DoD:** `while True:` in user code recovers in <500 ms perceived; a broken
canonical solution fails `npm run check`.

### Phase 2 — Persistence
Dexie schema + `DexieAdapter` implementing `StorageAdapter` (§8). Immutable
attempts on Submit; auto-saved drafts (⌘S + debounce); notes; bookmarks.
Mastery engine (§7.2) with unit tests; stars shown on the question list.
Export/import versioned JSON bundle. **DoD:** refresh/reopen preserves drafts,
attempt history, and stars; export→wipe→import restores everything.

### Phase 3 — Learning flow
Full module/stage content model with the `ModuleKind` discriminator
(`'data_structure' | 'algorithm'`) and kind-specific stage templates (§4.3) —
build kind-aware from the start, including the algorithm-kind stage types
(`guided_apply`, `algorithm_drills`) even though no algorithm content ships
yet. Learn-stage lesson renderer (markdown sections). Guided Build stepper
(chained questions, each step's starter = previous solution + TODO). Hints
ladder with recorded usage feeding mastery caps. Complete the Linked List
module: Learn, Guided Build, Independent Build, Method Drills.
**DoD:** Linked List playable start-to-finish through four stages.

### Phase 4 — Roadmap + module pages
Author the **full 18-module catalog as data** per ARCHITECTURE.md §4.1: ids,
titles, categories, prerequisite edges, skill lists, and stage skeletons for
every node in both categories (6 Data Structures, 12 Algorithms). Extend
content validation to check DAG integrity (all 18 ids present, no dangling
edges, no cycles) and kind/stage-template conformance across the catalog.
React Flow roadmap of all 18 nodes (16 as "coming soon" ghosts); custom nodes
with progress ring + stars, visually distinguished by category (distinct
accent treatment for Data Structures vs Algorithms); soft locking only.
Module page with per-stage completion. **DoD:** roadmap is the home page,
shows both categories distinctly, and reflects real mastery data;
`npm run check` fails on any DAG or kind/stage violation.

### Phase 5 — SRS + dashboard
SM-2-lite scheduler (§7.3) as a pure, property-tested function. Today's Review
queue + review route. Day log + streaks (§7.4). Trimmed dashboard: mastery by
module grouped by category, current/longest streak, Today's Review, weakest
skills, recent attempts. **DoD:** failing a question tomorrow brings its skill
back sooner; dashboard numbers reconcile with attempt history.

### Phase 6 — Algorithm kind: Arrays & Hashing
Full Arrays & Hashing module using `kind: 'algorithm'`: Learn, Guided Apply,
Algorithm Drills, Interview-ready questions (frequency counting, hash set
membership, anagram grouping, two-sum pattern, prefix products). No engine
changes should be needed — if they are, flag it as a design bug first.
**DoD:** both module kinds complete end-to-end.

### Phase 7 — Visualisation + Interview Mode
Trace-frame protocol (§9) + `LinkedListView` SVG replay renderer for
class-mode questions. Interview Mode: chrome stripped, no hints, timer,
grade after submit only. **DoD:** watch a submitted append() build the list
frame-by-frame; interview mode records timed attempts.

### Phase 8 — Polish
Command palette (⌘K), transitions (150–200 ms ease-out), empty/error states,
a11y pass, performance pass (bundle split Monaco/Pyodide).
**DoD:** Lighthouse a11y ≥ 95; no route ships all heavy deps eagerly.

---

**Note — Triecode UI overhaul:** a later, separately-specified UI overhaul
(commit sequence in the project history; see ARCHITECTURE.md §10 for the
resulting design) superseded parts of the phase descriptions above rather
than following them literally:

- Phase 4/5's separate Roadmap and Dashboard pages were merged into one
  **Home** page; React Flow (Phase 4, Phase 8) was removed entirely in favor
  of a static tiered grid + SVG overlay.
- Phase 8's command palette (⌘K) and empty-state components landed early,
  bundled into the overhaul rather than waiting for a dedicated Phase 8 pass.
  Phase 8's a11y pass, remaining error states, and the Monaco/Pyodide
  bundle-split performance pass are **not** covered by the overhaul and are
  still open.
- The per-skill EWMA mastery model described in Phase 2/§7.2 (original) was
  replaced by a pure attempt-history formula — see ARCHITECTURE.md §7.2's
  current text, not the phase description above, for the live design.

Treat the phase list above as the historical record of what was originally
scoped; treat ARCHITECTURE.md as the live description of what the app
actually does today.

**Note — Review system redesign:** a later, separately-specified Review
system (see ARCHITECTURE.md §13 for the resulting design) superseded parts
of Phase 5 and Phase 7 rather than following them literally:

- Phase 5's per-skill SM-2-lite scheduler (`ReviewRecord`, ease factor,
  `buildTodaysReview` picking one random question per due skill) is gone,
  replaced by a per-**exercise** fixed-interval ladder (`ReviewState`, rungs
  0–5 over 1/3/7/14/30/60 days) — see ARCHITECTURE.md §13.2, not §7.3's
  original text, for the live scheduler design.
- Phase 7's standalone Interview Mode (its own route, a toolbar button, no
  content ever actually used the `interview_mode` stage type) is deleted
  entirely. Review sessions — cold solve, no hints, graded on submit,
  across every already-solved reviewable exercise — absorb its role, on a
  schedule rather than on demand.
- Phase 5's "Today's Review queue + review route" and "trimmed dashboard"
  DoD items are superseded by the Review page's three states (due /
  caught up / summary) in ARCHITECTURE.md §13.4; the dashboard itself was
  already folded into Home by the Triecode UI overhaul above.