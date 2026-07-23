import type { CodeQuestion } from '../../../../types';

export const step1ConvergingPointers: CodeQuestion = {
  id: 'two-pointers/guided-apply/1-converging-pointers',
  kind: 'algorithm_problem',
  moduleId: 'two-pointers',
  skillIds: ['two-pointers/converging-pointers'],
  title: 'converging pointers',
  prompt: `## Guided Apply 1 of 4: converging pointers

Given a list of characters, return it reversed — **without** using
\`reversed()\`, slicing, or building a second list from a builtin reverse.

\`\`\`python
def reverse_string(chars):
    ...
\`\`\`

Start a pointer at each end. Swap, then move both pointers one step
toward the middle, until they meet.`,
  starterCode: `def reverse_string(chars):
    # TODO: return chars reversed, using two converging pointers.
`,
  solution: `def reverse_string(chars):
    result = list(chars)
    left, right = 0, len(result) - 1
    while left < right:
        result[left], result[right] = result[right], result[left]
        left += 1
        right -= 1
    return result
`,
  hints: [
    'One pointer at index 0, one at the last index. Swap what they point at, then move both inward.',
    'Stop as soon as the pointers meet or cross — a middle element (odd length) never needs to swap with itself.',
    'left, right = 0, len(result) - 1; while left < right: swap result[left] and result[right]; left += 1; right -= 1.',
    'result[left], result[right] = result[right], result[left] is a single-line swap in Python — no temporary variable needed.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'reverse_string',
    argTypes: ['value'],
    resultType: 'value',
    tests: [
      { id: 'hello', group: 'visible', args: [['h', 'e', 'l', 'l', 'o']], expected: ['o', 'l', 'l', 'e', 'h'], comparator: 'deep' },
      {
        id: 'hannah',
        group: 'visible',
        args: [['H', 'a', 'n', 'n', 'a', 'h']],
        expected: ['h', 'a', 'n', 'n', 'a', 'H'],
        comparator: 'deep',
      },
      {
        id: 'two-chars',
        group: 'hidden',
        args: [['a', 'b']],
        expected: ['b', 'a'],
        comparator: 'deep',
        label: 'two characters',
      },
      {
        id: 'longer-even',
        group: 'hidden',
        args: [['a', 'b', 'c', 'd', 'e', 'f']],
        expected: ['f', 'e', 'd', 'c', 'b', 'a'],
        comparator: 'deep',
        label: 'longer even-length list',
      },
      { id: 'empty-list', group: 'edge', args: [[]], expected: [], comparator: 'deep', label: 'empty list' },
      {
        id: 'single-char',
        group: 'edge',
        args: [['x']],
        expected: ['x'],
        comparator: 'deep',
        label: 'single character',
      },
    ],
  },
  reviewable: false,
  estimatedMinutes: 5,
};
