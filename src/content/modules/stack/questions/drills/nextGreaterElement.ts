import type { CodeQuestion } from '../../../../types';

export const nextGreaterElement: CodeQuestion = {
  id: 'stack/next-greater-element',
  kind: 'algorithm_problem',
  moduleId: 'stack',
  skillIds: ['stack/monotonic-stack'],
  title: 'Next Greater Element I',
  prompt: `## Next Greater Element I

\`nums1\` is a subset of \`nums2\` (no duplicates in either). For each value
in \`nums1\`, find its **next greater element to the right in \`nums2\`** —
the first later value that's bigger. If there isn't one, use \`-1\`.

\`\`\`python
def next_greater_element(nums1, nums2):
    ...
\`\`\`

Walk \`nums2\` once with a monotonic stack: whenever the current value beats
the top of the stack, that's the next-greater answer for whatever's on
top. Record every answer you find in a map, then look each \`nums1\` value
up at the end.`,
  starterCode: `def next_greater_element(nums1, nums2):
    # TODO: for each value in nums1, find its next greater element in nums2 (-1 if none).
`,
  solution: `def next_greater_element(nums1, nums2):
    next_greater = {}
    stack = []
    for n in nums2:
        while stack and stack[-1] < n:
            next_greater[stack.pop()] = n
        stack.append(n)
    return [next_greater.get(n, -1) for n in nums1]
`,
  hints: [
    'This is the same monotonic-stack shape as Daily Temperatures, just tracking values instead of indices and keyed by a lookup map at the end.',
    'Walk nums2 once, keeping a stack of values still waiting for something bigger. Whenever the current value beats the top of the stack, that\'s its next-greater answer.',
    'next_greater = {}; stack = []; for n in nums2: while stack and stack[-1] < n: next_greater[stack.pop()] = n; stack.append(n).',
    'Build the next_greater map in one pass over nums2 with the monotonic-stack loop above, then return [next_greater.get(n, -1) for n in nums1].',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'next_greater_element',
    argTypes: ['value', 'value'],
    resultType: 'value',
    tests: [
      {
        id: 'classic-example',
        group: 'visible',
        args: [
          [4, 1, 2],
          [1, 3, 4, 2],
        ],
        expected: [-1, 3, -1],
        comparator: 'deep',
      },
      {
        id: 'second-example',
        group: 'visible',
        args: [
          [2, 4],
          [1, 2, 3, 4],
        ],
        expected: [3, -1],
        comparator: 'deep',
      },
      {
        id: 'single-trailing-max',
        group: 'hidden',
        args: [
          [1, 3, 5, 2, 4],
          [6, 5, 4, 3, 2, 1, 7],
        ],
        expected: [7, 7, 7, 7, 7],
        comparator: 'deep',
        label: 'a single trailing greater element covers everything',
      },
      {
        id: 'strictly-decreasing-superset',
        group: 'hidden',
        args: [
          [1, 2, 3],
          [3, 2, 1],
        ],
        expected: [-1, -1, -1],
        comparator: 'deep',
        label: 'strictly decreasing superset, nothing has a next greater',
      },
      { id: 'empty-nums1', group: 'edge', args: [[], [1, 2, 3]], expected: [], comparator: 'deep', label: 'empty nums1' },
      {
        id: 'single-element-no-greater',
        group: 'edge',
        args: [[1], [1]],
        expected: [-1],
        comparator: 'deep',
        label: 'single element, no next greater exists',
      },
    ],
  },
};
