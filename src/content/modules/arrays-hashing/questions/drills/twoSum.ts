import type { CodeQuestion } from '../../../../types';

export const twoSum: CodeQuestion = {
  id: 'arrays-hashing/two-sum',
  kind: 'algorithm_problem',
  moduleId: 'arrays-hashing',
  skillIds: ['arrays-hashing/two-sum-pattern'],
  title: 'Two Sum',
  prompt: `## Two Sum

Given a list of numbers \`nums\` and a \`target\`, return the indices
\`[i, j]\` of the two numbers that add up to \`target\`. Assume exactly one
valid pair exists, and a number can't be paired with itself.

\`\`\`python
def two_sum(nums, target):
    ...
\`\`\`
`,
  starterCode: `def two_sum(nums, target):
    # TODO: return [i, j] — the indices of two numbers summing to target.
`,
  solution: `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        complement = target - n
        if complement in seen:
            return [seen[complement], i]
        seen[n] = i
`,
  hints: [
    'Checking every pair is O(n²) — a hash map turns this into a single O(n) pass.',
    'At each index, ask whether you\'ve already seen the value that would complete the pair.',
    'seen = {}; for i, n in enumerate(nums): complement = target - n; if complement in seen: return [seen[complement], i]; seen[n] = i.',
    'Store value -> index as you walk. Look up target - n in the map before inserting the current value, so a number never pairs with itself.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'two_sum',
    argTypes: ['value', 'value'],
    resultType: 'value',
    tests: [
      { id: 'basic', group: 'visible', args: [[2, 7, 11, 15], 9], expected: [0, 1], comparator: 'deep' },
      { id: 'middle-pair', group: 'visible', args: [[3, 2, 4], 6], expected: [1, 2], comparator: 'deep' },
      {
        id: 'all-negative',
        group: 'hidden',
        args: [[-1, -2, -3, -4, -5], -8],
        expected: [2, 4],
        comparator: 'deep',
        label: 'all negative numbers',
      },
      {
        id: 'zeros',
        group: 'hidden',
        args: [[0, 0, 3, 4], 0],
        expected: [0, 1],
        comparator: 'deep',
        label: 'zeros summing to target',
      },
      {
        id: 'minimal-list',
        group: 'edge',
        args: [[1, 2], 3],
        expected: [0, 1],
        comparator: 'deep',
        label: 'minimal two-element list',
      },
      {
        id: 'duplicate-non-adjacent',
        group: 'edge',
        args: [[10, 20, 10], 20],
        expected: [0, 2],
        comparator: 'deep',
        label: 'duplicate values, non-adjacent match',
      },
    ],
  },
  reviewable: true,
  estimatedMinutes: 20,
};
