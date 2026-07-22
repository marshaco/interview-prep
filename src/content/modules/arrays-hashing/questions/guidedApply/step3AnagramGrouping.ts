import type { CodeQuestion } from '../../../../types';

export const step3AnagramGrouping: CodeQuestion = {
  id: 'arrays-hashing/guided-apply/3-anagram-grouping',
  kind: 'algorithm_problem',
  moduleId: 'arrays-hashing',
  skillIds: ['arrays-hashing/anagram-grouping'],
  title: 'anagram grouping',
  prompt: `## Guided Apply 3 of 5: anagram grouping

Before grouping many words into anagram buckets, you need a way to tell if
*two* words are anagrams of each other — same letters, same counts, any
order.

\`\`\`python
def is_anagram(word1, word2):
    ...
\`\`\`

Build a frequency map (§ previous lesson) for \`word1\`, then walk
\`word2\` *decrementing* the same map. If the words are anagrams, every
count lands back at zero.`,
  starterCode: `def is_anagram(word1, word2):
    # TODO: return True if word1 and word2 are anagrams of each other.
    pass
`,
  solution: `def is_anagram(word1, word2):
    if len(word1) != len(word2):
        return False
    counts = {}
    for ch in word1:
        counts[ch] = counts.get(ch, 0) + 1
    for ch in word2:
        counts[ch] = counts.get(ch, 0) - 1
    return all(count == 0 for count in counts.values())
`,
  hints: [
    'Different lengths can never be anagrams — check that first and save yourself the walk.',
    'One frequency map, built from word1, then decremented while walking word2 — no second map needed.',
    'counts = {}; for ch in word1: counts[ch] = counts.get(ch, 0) + 1; for ch in word2: counts[ch] = counts.get(ch, 0) - 1; then check every value is 0.',
    'Guard on len(word1) != len(word2) first. Then build counts from word1, decrement from word2, and return all(v == 0 for v in counts.values()).',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'is_anagram',
    argTypes: ['value', 'value'],
    resultType: 'value',
    tests: [
      { id: 'basic-true', group: 'visible', args: ['listen', 'silent'], expected: true, comparator: 'deep' },
      { id: 'basic-false', group: 'visible', args: ['rat', 'car'], expected: false, comparator: 'deep' },
      {
        id: 'longer-words',
        group: 'hidden',
        args: ['anagram', 'nagaram'],
        expected: true,
        comparator: 'deep',
        label: 'longer words',
      },
      {
        id: 'two-letter-words',
        group: 'hidden',
        args: ['ab', 'ba'],
        expected: true,
        comparator: 'deep',
        label: 'two-letter words',
      },
      {
        id: 'both-empty',
        group: 'edge',
        args: ['', ''],
        expected: true,
        comparator: 'deep',
        label: 'two empty strings',
      },
      {
        id: 'different-lengths',
        group: 'edge',
        args: ['a', 'aa'],
        expected: false,
        comparator: 'deep',
        label: 'different lengths',
      },
    ],
  },
};
