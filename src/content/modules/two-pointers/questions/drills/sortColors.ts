import type { CodeQuestion } from '../../../../types';

export const sortColors: CodeQuestion = {
  id: 'two-pointers/sort-colors',
  kind: 'algorithm_problem',
  moduleId: 'two-pointers',
  skillIds: ['two-pointers/partition'],
  title: 'Sort Colors',
  prompt: `## Sort Colors

Given a list containing only \`0\`s, \`1\`s, and \`2\`s, sort it in place so
all \`0\`s come first, then all \`1\`s, then all \`2\`s — in one pass,
without calling a sort function.

\`\`\`python
def sort_colors(nums):
    ...
\`\`\`

This is partitioning into **three** regions instead of two (the Dutch
national flag problem). Track three pointers: \`low\` (boundary of the 0s
region), \`mid\` (current element being examined), and \`high\` (boundary of
the 2s region). Swap \`0\`s down to \`low\`, swap \`2\`s up to \`high\`, and
leave \`1\`s where \`mid\` finds them.`,
  starterCode: `def sort_colors(nums):
    # TODO: sort nums in place (0s, then 1s, then 2s) in a single pass.
`,
  solution: `def sort_colors(nums):
    low, mid, high = 0, 0, len(nums) - 1
    while mid <= high:
        if nums[mid] == 0:
            nums[low], nums[mid] = nums[mid], nums[low]
            low += 1
            mid += 1
        elif nums[mid] == 1:
            mid += 1
        else:
            nums[mid], nums[high] = nums[high], nums[mid]
            high -= 1
    return nums
`,
  hints: [
    'Two pointers (read/write) partition into two regions — this needs three regions, so it needs a third pointer.',
    'low and high mark the edges of the 0s and 2s regions already placed correctly; mid is the only pointer actually scanning forward.',
    'When nums[mid] is 0, swap it down to low and advance both low and mid. When it\'s 2, swap it up to high and pull high back in — but don\'t advance mid yet, since the swapped-in value from high hasn\'t been examined.',
    'while mid <= high: if nums[mid]==0: swap with low, low+=1, mid+=1. elif nums[mid]==1: mid+=1. else: swap with high, high-=1 (mid stays put to check the newly-swapped-in value).',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'sort_colors',
    argTypes: ['value'],
    resultType: 'value',
    tests: [
      {
        id: 'classic-example',
        group: 'visible',
        args: [[2, 0, 2, 1, 1, 0]],
        expected: [0, 0, 1, 1, 2, 2],
        comparator: 'deep',
      },
      { id: 'three-elements', group: 'visible', args: [[2, 0, 1]], expected: [0, 1, 2], comparator: 'deep' },
      {
        id: 'all-same-color',
        group: 'hidden',
        args: [[0, 0, 0]],
        expected: [0, 0, 0],
        comparator: 'deep',
        label: 'all the same color',
      },
      {
        id: 'longer-mixed-list',
        group: 'hidden',
        args: [[1, 0, 2, 0, 1, 2, 0]],
        expected: [0, 0, 0, 1, 1, 2, 2],
        comparator: 'deep',
        label: 'longer mixed list',
      },
      { id: 'empty-list', group: 'edge', args: [[]], expected: [], comparator: 'deep', label: 'empty list' },
      {
        id: 'single-element',
        group: 'edge',
        args: [[2]],
        expected: [2],
        comparator: 'deep',
        label: 'single element',
      },
    ],
  },
  reviewable: true,
  estimatedMinutes: 20,
};
