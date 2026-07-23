import type { CodeQuestion } from '../../../../types';

export const step3Partition: CodeQuestion = {
  id: 'two-pointers/guided-apply/3-partition',
  kind: 'algorithm_problem',
  moduleId: 'two-pointers',
  skillIds: ['two-pointers/partition'],
  title: 'partition',
  prompt: `## Guided Apply 3 of 4: partition

Given a list of numbers, return a new list with every \`0\` moved to the
end, while keeping the relative order of the non-zero values unchanged.

\`\`\`python
def move_zeroes(nums):
    ...
\`\`\`

Use a read pointer that scans every element and a write pointer that
tracks where the next non-zero value belongs — swap into place whenever
the read pointer finds one.`,
  starterCode: `def move_zeroes(nums):
    # TODO: return nums with every 0 moved to the end, order otherwise preserved.
`,
  solution: `def move_zeroes(nums):
    result = list(nums)
    write = 0
    for read in range(len(result)):
        if result[read] != 0:
            result[write], result[read] = result[read], result[write]
            write += 1
    return result
`,
  hints: [
    'write only ever advances when a non-zero value is placed — it always points at the next slot a kept value belongs in.',
    'read scans every position once, in order; it never needs to move backward or skip around.',
    'write = 0; for read in range(len(result)): if result[read] != 0: swap result[write] and result[read]; write += 1.',
    'The swap (not just an assignment) matters — it moves the zero that was sitting at write out to where read currently is, instead of duplicating a value.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'move_zeroes',
    argTypes: ['value'],
    resultType: 'value',
    tests: [
      { id: 'basic', group: 'visible', args: [[0, 1, 0, 3, 12]], expected: [1, 3, 12, 0, 0], comparator: 'deep' },
      { id: 'zeros-first', group: 'visible', args: [[0, 0, 1]], expected: [1, 0, 0], comparator: 'deep' },
      {
        id: 'no-zeros',
        group: 'hidden',
        args: [[1, 2, 3]],
        expected: [1, 2, 3],
        comparator: 'deep',
        label: 'no zeros present',
      },
      {
        id: 'all-zeros',
        group: 'hidden',
        args: [[0, 0, 0]],
        expected: [0, 0, 0],
        comparator: 'deep',
        label: 'all zeros',
      },
      { id: 'empty-list', group: 'edge', args: [[]], expected: [], comparator: 'deep', label: 'empty list' },
      { id: 'single-zero', group: 'edge', args: [[0]], expected: [0], comparator: 'deep', label: 'single zero' },
    ],
  },
  reviewable: false,
};
