import type { CodeQuestion } from '../../../../types';

export const containerWithMostWater: CodeQuestion = {
  id: 'two-pointers/container-with-most-water',
  kind: 'algorithm_problem',
  moduleId: 'two-pointers',
  skillIds: ['two-pointers/converging-pointers'],
  title: 'Container With Most Water',
  prompt: `## Container With Most Water

Given a list of heights, where each index represents a vertical line of
that height, find two lines that, together with the x-axis, form a
container holding the most water. Return the maximum area.

\`\`\`python
def max_area(heights):
    ...
\`\`\`

Area is \`(distance between the two lines) × (shorter of the two
heights)\`. Start with the widest possible container (both ends) and
converge inward — but which pointer should move? Moving the **taller**
line inward can only ever shrink the width without any chance of
increasing the limiting height, so it can never improve the area. Moving
the **shorter** line is the only choice that could possibly find
something better.`,
  starterCode: `def max_area(heights):
    # TODO: return the maximum water a container between two lines can hold.
`,
  solution: `def max_area(heights):
    left, right = 0, len(heights) - 1
    best = 0
    while left < right:
        width = right - left
        height = min(heights[left], heights[right])
        best = max(best, width * height)
        if heights[left] < heights[right]:
            left += 1
        else:
            right -= 1
    return best
`,
  hints: [
    'Checking every pair of lines is O(n²) — converging pointers get this to O(n) by ruling out a whole set of pairs at each step.',
    'The area is always limited by the shorter of the two lines. Moving the taller line inward only reduces width while the limiting height can\'t improve — it never helps. Move the shorter one instead.',
    'left, right = 0, len(heights) - 1; best = 0; at each step compute width * min(heights[left], heights[right]), track the max, then move whichever pointer is at the shorter line.',
    'best = max(best, (right - left) * min(heights[left], heights[right])); if heights[left] < heights[right]: left += 1; else: right -= 1.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'max_area',
    argTypes: ['value'],
    resultType: 'value',
    tests: [
      { id: 'classic-example', group: 'visible', args: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49, comparator: 'deep' },
      { id: 'two-lines', group: 'visible', args: [[1, 1]], expected: 1, comparator: 'deep' },
      {
        id: 'tall-ends',
        group: 'hidden',
        args: [[4, 3, 2, 1, 4]],
        expected: 16,
        comparator: 'deep',
        label: 'tallest lines are at both ends',
      },
      {
        id: 'peak-in-middle',
        group: 'hidden',
        args: [[1, 2, 1]],
        expected: 2,
        comparator: 'deep',
        label: 'a peak in the middle does not help',
      },
      { id: 'zero-heights', group: 'edge', args: [[0, 0]], expected: 0, comparator: 'deep', label: 'zero heights' },
      {
        id: 'strictly-increasing',
        group: 'edge',
        args: [[1, 2, 3, 4, 5]],
        expected: 6,
        comparator: 'deep',
        label: 'strictly increasing heights',
      },
    ],
  },
};
