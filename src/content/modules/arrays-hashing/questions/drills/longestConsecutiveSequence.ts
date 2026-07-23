import type { CodeQuestion } from '../../../../types';

export const longestConsecutiveSequence: CodeQuestion = {
  id: 'arrays-hashing/longest-consecutive-sequence',
  kind: 'algorithm_problem',
  moduleId: 'arrays-hashing',
  skillIds: ['arrays-hashing/hash-set-membership'],
  title: 'Longest Consecutive Sequence',
  prompt: `## Longest Consecutive Sequence

Given an unsorted list of integers, return the length of the longest run
of consecutive integers (in any order in the input; \`[100, 4, 200, 1, 3,
2]\` contains the run \`1, 2, 3, 4\`, length 4).

\`\`\`python
def longest_consecutive(nums):
    ...
\`\`\`

Sorting first works but costs O(n log n). Put every value in a set instead:
a value only *starts* a run if \`value - 1\` is not in the set, so you only
ever count forward from run starts — every number is visited at most
twice, giving O(n).`,
  starterCode: `def longest_consecutive(nums):
    # TODO: return the length of the longest run of consecutive integers.
`,
  solution: `def longest_consecutive(nums):
    num_set = set(nums)
    longest = 0
    for n in num_set:
        if n - 1 not in num_set:
            length = 1
            while n + length in num_set:
                length += 1
            longest = max(longest, length)
    return longest
`,
  hints: [
    'Sorting works but is O(n log n) — a set gives O(1) membership checks and gets this to O(n).',
    'Only start counting a run from a number that has no predecessor in the set — otherwise you\'ll recount the same run once per element in it.',
    'num_set = set(nums); for n in num_set: if n - 1 not in num_set: (this is a run start) count forward while n + length in num_set.',
    'Build a set. For each n where n - 1 is not in the set, walk forward (n+1, n+2, ...) counting how far the run extends, and track the max length seen.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'longest_consecutive',
    argTypes: ['value'],
    resultType: 'value',
    tests: [
      { id: 'basic', group: 'visible', args: [[100, 4, 200, 1, 3, 2]], expected: 4, comparator: 'deep' },
      { id: 'with-duplicate', group: 'visible', args: [[1, 2, 0, 1]], expected: 3, comparator: 'deep' },
      {
        id: 'longer-mixed',
        group: 'hidden',
        args: [[9, 1, 4, 7, 3, -1, 0, 5, 8, -1, 6]],
        expected: 7,
        comparator: 'deep',
        label: 'longer sequence with a duplicate',
      },
      {
        id: 'all-duplicates',
        group: 'hidden',
        args: [[5, 5, 5]],
        expected: 1,
        comparator: 'deep',
        label: 'all duplicate values',
      },
      { id: 'empty-list', group: 'edge', args: [[]], expected: 0, comparator: 'deep', label: 'empty list' },
      { id: 'single-element', group: 'edge', args: [[10]], expected: 1, comparator: 'deep', label: 'single element' },
    ],
  },
  reviewable: true,
};
