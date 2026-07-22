import type { CodeQuestion } from '../../../../types';

export const firstUniqueCharacter: CodeQuestion = {
  id: 'arrays-hashing/first-unique-character',
  kind: 'algorithm_problem',
  moduleId: 'arrays-hashing',
  skillIds: ['arrays-hashing/frequency-count'],
  title: 'First Unique Character',
  prompt: `## First Unique Character

Given a string \`s\`, return the index of the first character that does not
repeat anywhere else in \`s\`. If every character repeats, return \`-1\`.

\`\`\`python
def first_unique_char(s):
    ...
\`\`\`

Build a frequency map in one pass, then scan again looking for the first
count of 1 — two O(n) passes beats re-scanning the whole string for every
character.`,
  starterCode: `def first_unique_char(s):
    # TODO: return the index of the first non-repeating character, or -1.
`,
  solution: `def first_unique_char(s):
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    for i, ch in enumerate(s):
        if counts[ch] == 1:
            return i
    return -1
`,
  hints: [
    'Two passes: first count every character, then look for the first one whose count is exactly 1.',
    'The frequency map from the Guided Apply stage is exactly what you need here — build it once, then scan the string a second time by index.',
    'counts = {}; for ch in s: counts[ch] = counts.get(ch, 0) + 1. Then: for i, ch in enumerate(s): if counts[ch] == 1: return i.',
    'Build the frequency dict first. Then loop with enumerate(s) and return the first index whose character has count 1. Return -1 if the loop finishes without one.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'first_unique_char',
    argTypes: ['value'],
    resultType: 'value',
    tests: [
      { id: 'leetcode', group: 'visible', args: ['leetcode'], expected: 0, comparator: 'deep' },
      { id: 'love-leetcode', group: 'visible', args: ['loveleetcode'], expected: 2, comparator: 'deep' },
      {
        id: 'no-unique',
        group: 'hidden',
        args: ['aabb'],
        expected: -1,
        comparator: 'deep',
        label: 'no unique character',
      },
      {
        id: 'single-char',
        group: 'hidden',
        args: ['z'],
        expected: 0,
        comparator: 'deep',
        label: 'single character string',
      },
      { id: 'empty-string', group: 'edge', args: [''], expected: -1, comparator: 'deep', label: 'empty string' },
      {
        id: 'unique-at-end',
        group: 'edge',
        args: ['aabbc'],
        expected: 4,
        comparator: 'deep',
        label: 'unique character at the end',
      },
    ],
  },
};
