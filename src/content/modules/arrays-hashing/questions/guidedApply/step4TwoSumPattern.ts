import type { CodeQuestion } from '../../../../types';

export const step4TwoSumPattern: CodeQuestion = {
  id: 'arrays-hashing/guided-apply/4-two-sum-pattern',
  kind: 'algorithm_problem',
  moduleId: 'arrays-hashing',
  skillIds: ['arrays-hashing/two-sum-pattern'],
  title: 'two-sum pattern',
  prompt: `## Guided Apply 4 of 5: two-sum pattern

Given a list of numbers and a target, return the indices \`[i, j]\` of two
numbers that add up to \`target\`. Assume exactly one valid pair exists.

\`\`\`python
def two_sum(nums, target):
    ...
\`\`\`

Instead of checking every pair, ask at each index: "have I already seen
the *complement* — \`target - nums[i]\` — that would pair with this one?"
A dict mapping value → index answers that in O(1).`,
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
    'The brute-force pair check is O(n²) — a single pass with a hash map gets this to O(n).',
    'At each index, compute what value would complete the pair (target - current value), and check whether you\'ve already stored it.',
    'seen = {}; for i, n in enumerate(nums): complement = target - n; if complement in seen: return [seen[complement], i]; seen[n] = i.',
    'Store value -> index as you go. Check `target - n` against the map *before* adding the current value, so a number never pairs with itself.',
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
        id: 'duplicate-values',
        group: 'hidden',
        args: [[3, 3], 6],
        expected: [0, 1],
        comparator: 'deep',
        label: 'duplicate values summing to target',
      },
      {
        id: 'answer-at-end',
        group: 'hidden',
        args: [[1, 2, 3, 4, 5], 9],
        expected: [3, 4],
        comparator: 'deep',
        label: 'answer at the end of a longer list',
      },
      {
        id: 'zeros',
        group: 'edge',
        args: [[0, 4, 3, 0], 0],
        expected: [0, 3],
        comparator: 'deep',
        label: 'zero values summing to target',
      },
      {
        id: 'negatives',
        group: 'edge',
        args: [[-3, 4, 3, 90], 0],
        expected: [0, 2],
        comparator: 'deep',
        label: 'negative numbers summing to zero',
      },
    ],
  },
};
