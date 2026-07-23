import type { CodeQuestion } from '../../../../types';

export const step5PrefixProducts: CodeQuestion = {
  id: 'arrays-hashing/guided-apply/5-prefix-products',
  kind: 'algorithm_problem',
  moduleId: 'arrays-hashing',
  skillIds: ['arrays-hashing/prefix-products'],
  title: 'prefix products',
  prompt: `## Guided Apply 5 of 5: prefix products

Given a list of numbers, return a new list where each index \`i\` holds the
running product of \`nums[0..i]\` inclusive.

\`\`\`python
def running_product(nums):
    ...
\`\`\`

This is a running-aggregate pass rather than a hash lookup, but it's the
same "remember something as you walk, so a later index doesn't need to
rescan everything before it" shape — and it's the seed of the classic
"product of array except self" problem in the drills that follow.`,
  starterCode: `def running_product(nums):
    # TODO: return the running product of nums, one entry per prefix.
`,
  solution: `def running_product(nums):
    result = []
    running = 1
    for n in nums:
        running *= n
        result.append(running)
    return result
`,
  hints: [
    'Keep a single running total, updated once per element, rather than recomputing the product from scratch at each index.',
    'Start the running product at 1 (the multiplicative identity) so the first element multiplies in cleanly.',
    'running = 1; result = []; for n in nums: running *= n; result.append(running); return result.',
    'def running_product(nums): result = []; running = 1; for n in nums: running *= n; result.append(running); return result.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'running_product',
    argTypes: ['value'],
    resultType: 'value',
    tests: [
      { id: 'basic', group: 'visible', args: [[1, 2, 3, 4]], expected: [1, 2, 6, 24], comparator: 'deep' },
      { id: 'single', group: 'visible', args: [[5]], expected: [5], comparator: 'deep' },
      {
        id: 'repeated-values',
        group: 'hidden',
        args: [[2, 2, 2]],
        expected: [2, 4, 8],
        comparator: 'deep',
        label: 'repeated values',
      },
      {
        id: 'zero-in-middle',
        group: 'hidden',
        args: [[1, 0, 3]],
        expected: [1, 0, 0],
        comparator: 'deep',
        label: 'zero in the middle',
      },
      { id: 'empty-list', group: 'edge', args: [[]], expected: [], comparator: 'deep', label: 'empty list' },
      {
        id: 'negative-numbers',
        group: 'edge',
        args: [[-2, 3]],
        expected: [-2, -6],
        comparator: 'deep',
        label: 'negative numbers',
      },
    ],
  },
  reviewable: false,
};
