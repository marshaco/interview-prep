import type { CodeQuestion } from '../../../../types';

export const step2HashSetMembership: CodeQuestion = {
  id: 'arrays-hashing/guided-apply/2-hash-set-membership',
  kind: 'algorithm_problem',
  moduleId: 'arrays-hashing',
  skillIds: ['arrays-hashing/hash-set-membership'],
  title: 'hash set membership',
  prompt: `## Guided Apply 2 of 5: hash set membership

Given a list of numbers, return \`True\` if any value appears more than
once, \`False\` otherwise.

\`\`\`python
def has_duplicate(nums):
    ...
\`\`\`

Track what you've seen in a \`set\` rather than re-scanning a list — that's
the difference between an O(n²) and an O(n) solution here.`,
  starterCode: `def has_duplicate(nums):
    # TODO: return True if any value appears more than once.
    pass
`,
  solution: `def has_duplicate(nums):
    seen = set()
    for n in nums:
        if n in seen:
            return True
        seen.add(n)
    return False
`,
  hints: [
    'A list\'s `in` check is O(n); a set\'s `in` check is O(1) average — that difference is the whole point of this exercise.',
    'Walk the list once, checking membership in a set before adding to it.',
    'seen = set(); for n in nums: if n in seen: return True; seen.add(n).',
    'def has_duplicate(nums): seen = set(); for n in nums: if n in seen: return True; seen.add(n); return False.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'has_duplicate',
    argTypes: ['value'],
    resultType: 'value',
    tests: [
      { id: 'has-dup', group: 'visible', args: [[1, 2, 3, 1]], expected: true, comparator: 'deep' },
      { id: 'no-dup', group: 'visible', args: [[1, 2, 3]], expected: false, comparator: 'deep' },
      {
        id: 'all-same',
        group: 'hidden',
        args: [[5, 5, 5, 5]],
        expected: true,
        comparator: 'deep',
        label: 'every value is the same',
      },
      {
        id: 'dup-far-apart',
        group: 'hidden',
        args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 1]],
        expected: true,
        comparator: 'deep',
        label: 'duplicate values far apart in the list',
      },
      { id: 'empty-list', group: 'edge', args: [[]], expected: false, comparator: 'deep', label: 'empty list' },
      { id: 'single-element', group: 'edge', args: [[42]], expected: false, comparator: 'deep', label: 'single element' },
    ],
  },
};
