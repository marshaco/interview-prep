import type { CodeQuestion } from '../../../../types';

export const step1FrequencyCount: CodeQuestion = {
  id: 'arrays-hashing/guided-apply/1-frequency-count',
  kind: 'algorithm_problem',
  moduleId: 'arrays-hashing',
  skillIds: ['arrays-hashing/frequency-count'],
  title: 'frequency counting',
  prompt: `## Guided Apply 1 of 5: frequency counting

Given a list of strings, return a dict mapping each string to the number
of times it appears.

\`\`\`python
def count_frequencies(items):
    ...
\`\`\`

\`dict.get(key, default)\` reads the current count (or 0 if this is the
first occurrence) so you can count in a single pass with no extra branch.`,
  starterCode: `def count_frequencies(items):
    # TODO: return a dict mapping each item to how many times it appears.
    pass
`,
  solution: `def count_frequencies(items):
    counts = {}
    for item in items:
        counts[item] = counts.get(item, 0) + 1
    return counts
`,
  hints: [
    'You only need one pass over the list and one dict.',
    'For each item, look up its current count (defaulting to 0 if not seen yet), then store count + 1 back.',
    '`counts.get(item, 0)` reads the current count or 0 if this is the first time — no need for an `if item in counts` branch.',
    'counts = {}; for item in items: counts[item] = counts.get(item, 0) + 1; return counts.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'count_frequencies',
    argTypes: ['value'],
    resultType: 'value',
    tests: [
      { id: 'basic', group: 'visible', args: [['a', 'b', 'a']], expected: { a: 2, b: 1 }, comparator: 'deep' },
      { id: 'single', group: 'visible', args: [['x']], expected: { x: 1 }, comparator: 'deep' },
      {
        id: 'multiple-repeats',
        group: 'hidden',
        args: [['a', 'b', 'c', 'a', 'b', 'a']],
        expected: { a: 3, b: 2, c: 1 },
        comparator: 'deep',
        label: 'multiple repeated items',
      },
      {
        id: 'all-unique',
        group: 'hidden',
        args: [['z', 'y', 'x']],
        expected: { z: 1, y: 1, x: 1 },
        comparator: 'deep',
        label: 'all unique items',
      },
      { id: 'empty-list', group: 'edge', args: [[]], expected: {}, comparator: 'deep', label: 'empty list' },
      {
        id: 'single-repeated',
        group: 'edge',
        args: [['dup', 'dup']],
        expected: { dup: 2 },
        comparator: 'deep',
        label: 'a single value repeated',
      },
    ],
  },
};
