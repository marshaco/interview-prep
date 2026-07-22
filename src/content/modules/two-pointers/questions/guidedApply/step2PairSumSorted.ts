import type { CodeQuestion } from '../../../../types';

export const step2PairSumSorted: CodeQuestion = {
  id: 'two-pointers/guided-apply/2-pair-sum-sorted',
  kind: 'algorithm_problem',
  moduleId: 'two-pointers',
  skillIds: ['two-pointers/pair-sum-sorted'],
  title: 'pair-sum on sorted input',
  prompt: `## Guided Apply 2 of 4: pair-sum on sorted input

Given a list of numbers **sorted in increasing order** and a target,
return the 1-indexed positions \`[i, j]\` of two numbers that add up to
\`target\`. Assume exactly one valid pair exists.

\`\`\`python
def two_sum_sorted(numbers, target):
    ...
\`\`\`

Converge from both ends: if the current pair sums too low, the only way
up is a bigger left value, so move \`left\` forward. If it sums too high,
move \`right\` back.`,
  starterCode: `def two_sum_sorted(numbers, target):
    # TODO: return the 1-indexed [i, j] of two numbers summing to target.
`,
  solution: `def two_sum_sorted(numbers, target):
    left, right = 0, len(numbers) - 1
    while left < right:
        total = numbers[left] + numbers[right]
        if total == target:
            return [left + 1, right + 1]
        elif total < target:
            left += 1
        else:
            right -= 1
`,
  hints: [
    'The input being sorted is what makes this work — moving left forward only ever increases the sum, moving right back only ever decreases it.',
    'If the current sum is too small, you need a bigger contribution — the only pointer that can supply one is left (right is already the biggest remaining candidate).',
    'left, right = 0, len(numbers) - 1; while left < right: check numbers[left] + numbers[right] against target and move the appropriate pointer.',
    'Remember to return 1-indexed positions: [left + 1, right + 1], not the raw 0-indexed left/right.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'two_sum_sorted',
    argTypes: ['value', 'value'],
    resultType: 'value',
    tests: [
      { id: 'basic', group: 'visible', args: [[2, 7, 11, 15], 9], expected: [1, 2], comparator: 'deep' },
      { id: 'first-and-last', group: 'visible', args: [[2, 3, 4], 6], expected: [1, 3], comparator: 'deep' },
      {
        id: 'walks-both-pointers',
        group: 'hidden',
        args: [[1, 2, 3, 4, 4, 9, 56, 90], 8],
        expected: [4, 5],
        comparator: 'deep',
        label: 'requires walking both pointers inward',
      },
      {
        id: 'answer-after-left-moves',
        group: 'hidden',
        args: [[5, 25, 75], 100],
        expected: [2, 3],
        comparator: 'deep',
        label: 'answer found after moving the left pointer',
      },
      {
        id: 'minimal-list',
        group: 'edge',
        args: [[1, 2], 3],
        expected: [1, 2],
        comparator: 'deep',
        label: 'minimal two-element list',
      },
      {
        id: 'negative-numbers',
        group: 'edge',
        args: [[-3, -1, 1, 2], 0],
        expected: [2, 3],
        comparator: 'deep',
        label: 'negative numbers summing to zero',
      },
    ],
  },
};
