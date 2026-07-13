import type { RoadmapModule, Skill, Stage } from './types';
import { linkedListModule } from './modules/linked-list/module';
import { arraysHashingModule } from './modules/arrays-hashing/module';

/**
 * The 17 modules that don't have real content yet — stage skeletons only
 * (empty `items`), authored from ARCHITECTURE §4.1's catalog table so the
 * full 18-node roadmap DAG can render and be validated from day one. A
 * module stops being a "ghost" in the UI the moment its stages gain real
 * items — nothing here needs to change when that content ships later.
 */

function dataStructureStages(): Stage[] {
  return [
    { type: 'learn', title: 'Learn', items: [] },
    { type: 'guided_build', title: 'Guided Build', items: [] },
    { type: 'independent_build', title: 'Independent Build', items: [] },
    { type: 'method_drills', title: 'Method Drills', items: [] },
  ];
}

function algorithmStages(): Stage[] {
  return [
    { type: 'learn', title: 'Learn', items: [] },
    { type: 'guided_apply', title: 'Guided Apply', items: [] },
    { type: 'algorithm_drills', title: 'Algorithm Drills', items: [] },
  ];
}

function skills(moduleId: string, kind: Skill['kind'], titles: string[]): Skill[] {
  return titles.map((title) => ({
    id: `${moduleId}/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
    moduleId,
    title,
    kind,
  }));
}

const stack: RoadmapModule = {
  id: 'stack',
  kind: 'data_structure',
  title: 'Stack',
  summary: 'LIFO push/pop/peek, and the monotonic-stack technique built on top of it.',
  prerequisites: ['arrays-hashing'],
  skills: skills('stack', 'method', ['push/pop/peek']).concat(
    skills('stack', 'concept', ['monotonic stack', 'valid parentheses']),
  ),
  stages: dataStructureStages(),
};

const trees: RoadmapModule = {
  id: 'trees',
  kind: 'data_structure',
  title: 'Trees',
  summary: 'Binary trees: traversals, depth, inversion, and BST validation.',
  prerequisites: ['binary-search', 'linked-list'],
  skills: skills('trees', 'method', ['insert', 'DFS/BFS traversals', 'depth', 'invert']).concat(
    skills('trees', 'concept', ['validate BST']),
  ),
  stages: dataStructureStages(),
};

const tries: RoadmapModule = {
  id: 'tries',
  kind: 'data_structure',
  title: 'Tries',
  summary: 'Prefix trees for insert/search/startsWith, and backtracking word search over them.',
  prerequisites: ['trees'],
  skills: skills('tries', 'method', ['insert', 'search', 'startsWith']).concat(
    skills('tries', 'concept', ['word search backtrack']),
  ),
  stages: dataStructureStages(),
};

const heapPq: RoadmapModule = {
  id: 'heap-pq',
  kind: 'data_structure',
  title: 'Heap / Priority Queue',
  summary: 'Sift-up/down, heapify, and the k-th-element / two-heap-median patterns built on top.',
  prerequisites: ['trees'],
  skills: skills('heap-pq', 'method', ['sift-up/down', 'heapify']).concat(
    skills('heap-pq', 'concept', ['k-th element', 'two-heap median']),
  ),
  stages: dataStructureStages(),
};

const graphs: RoadmapModule = {
  id: 'graphs',
  kind: 'data_structure',
  title: 'Graphs',
  summary: 'Adjacency-list/matrix construction, BFS/DFS, connected components, topological sort.',
  prerequisites: ['backtracking'],
  skills: skills('graphs', 'method', ['adjacency build', 'BFS/DFS']).concat(
    skills('graphs', 'concept', ['connected components', 'topo sort']),
  ),
  stages: dataStructureStages(),
};

const twoPointers: RoadmapModule = {
  id: 'two-pointers',
  kind: 'algorithm',
  title: 'Two Pointers',
  summary: 'Converging pointers, partitioning, and pair-sum on sorted input.',
  prerequisites: ['arrays-hashing'],
  skills: skills('two-pointers', 'algorithm_application', [
    'converging pointers',
    'partition',
    'pair-sum on sorted input',
  ]),
  stages: algorithmStages(),
};

const binarySearch: RoadmapModule = {
  id: 'binary-search',
  kind: 'algorithm',
  title: 'Binary Search',
  summary: 'Classic search, first/last-true boundary search, and search-on-answer.',
  prerequisites: ['two-pointers'],
  skills: skills('binary-search', 'algorithm_application', [
    'classic search',
    'boundary (first/last true)',
    'search on answer',
  ]),
  stages: algorithmStages(),
};

const slidingWindow: RoadmapModule = {
  id: 'sliding-window',
  kind: 'algorithm',
  title: 'Sliding Window',
  summary: 'Fixed and variable windows, including windows carrying hashmap state.',
  prerequisites: ['two-pointers'],
  skills: skills('sliding-window', 'algorithm_application', [
    'fixed window',
    'variable window',
    'window with hashmap state',
  ]),
  stages: algorithmStages(),
};

const backtracking: RoadmapModule = {
  id: 'backtracking',
  kind: 'algorithm',
  title: 'Backtracking',
  summary: 'Subsets, permutations, and constraint pruning.',
  prerequisites: ['trees'],
  skills: skills('backtracking', 'algorithm_application', ['subsets', 'permutations', 'constraint pruning']),
  stages: algorithmStages(),
};

const intervals: RoadmapModule = {
  id: 'intervals',
  kind: 'algorithm',
  title: 'Intervals',
  summary: 'Merging, inserting, overlap detection, and the sweep-line technique.',
  prerequisites: ['heap-pq'],
  skills: skills('intervals', 'algorithm_application', ['merge', 'insert', 'overlap detection', 'sweep']),
  stages: algorithmStages(),
};

const greedy: RoadmapModule = {
  id: 'greedy',
  kind: 'algorithm',
  title: 'Greedy',
  summary: 'Exchange-argument and local-choice proofs, applied to jump/stock-style problems.',
  prerequisites: ['heap-pq'],
  skills: skills('greedy', 'algorithm_application', [
    'exchange argument',
    'local-choice proofs',
    'jump/stock patterns',
  ]),
  stages: algorithmStages(),
};

const advancedGraphs: RoadmapModule = {
  id: 'advanced-graphs',
  kind: 'algorithm',
  title: 'Advanced Graphs',
  summary: "Dijkstra, union-find, minimum spanning trees, and topological orderings.",
  prerequisites: ['heap-pq', 'graphs'],
  skills: skills('advanced-graphs', 'algorithm_application', [
    'Dijkstra',
    'union-find',
    'MST',
    'topological orderings',
  ]),
  stages: algorithmStages(),
};

const dp1d: RoadmapModule = {
  id: 'dp-1d',
  kind: 'algorithm',
  title: '1-D DP',
  summary: 'Memoization and tabulation on house-robber / climbing-stairs-style problems.',
  prerequisites: ['backtracking'],
  skills: skills('dp-1d', 'algorithm_application', ['memoization', 'tabulation', 'house-robber/climb patterns']),
  stages: algorithmStages(),
};

const dp2d: RoadmapModule = {
  id: 'dp-2d',
  kind: 'algorithm',
  title: '2-D DP',
  summary: 'Grid paths, longest common subsequence, edit distance, and knapsack.',
  prerequisites: ['dp-1d', 'graphs'],
  skills: skills('dp-2d', 'algorithm_application', ['grid paths', 'LCS', 'edit distance', 'knapsack']),
  stages: algorithmStages(),
};

const bitManipulation: RoadmapModule = {
  id: 'bit-manipulation',
  kind: 'algorithm',
  title: 'Bit Manipulation',
  summary: 'Masks, XOR tricks, counting bits, and shifts.',
  prerequisites: ['dp-1d'],
  skills: skills('bit-manipulation', 'algorithm_application', ['masks', 'XOR tricks', 'counting bits', 'shifts']),
  stages: algorithmStages(),
};

const mathGeometry: RoadmapModule = {
  id: 'math-geometry',
  kind: 'algorithm',
  title: 'Math & Geometry',
  summary: 'Matrix rotation, spiral traversal, modular exponentiation, and GCD.',
  prerequisites: ['dp-2d', 'bit-manipulation', 'graphs'],
  skills: skills('math-geometry', 'algorithm_application', [
    'matrix rotation',
    'spiral',
    'pow/modular arithmetic',
    'GCD',
  ]),
  stages: algorithmStages(),
};

export const roadmapModules: RoadmapModule[] = [
  // Data Structures
  stack,
  linkedListModule,
  trees,
  tries,
  heapPq,
  graphs,
  // Algorithms
  arraysHashingModule,
  twoPointers,
  binarySearch,
  slidingWindow,
  backtracking,
  intervals,
  greedy,
  advancedGraphs,
  dp1d,
  dp2d,
  bitManipulation,
  mathGeometry,
];
