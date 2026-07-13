import type { CodeQuestion } from '../../../../types';

export const groupAnagrams: CodeQuestion = {
  id: 'arrays-hashing/group-anagrams',
  kind: 'algorithm_problem',
  moduleId: 'arrays-hashing',
  skillIds: ['arrays-hashing/anagram-grouping'],
  title: 'Group Anagrams',
  prompt: `## Group Anagrams

Given a list of strings, group the anagrams together. Return a list of
groups; the order of the groups and the order of words within a group
don't matter.

\`\`\`python
def group_anagrams(words):
    ...
\`\`\`

Every anagram of a word shares the same sorted-letters string (\`"eat"\`,
\`"tea"\`, and \`"ate"\` all sort to \`"aet"\`). Use that sorted string as a
dict key and bucket words into it as you walk the list once.`,
  starterCode: `def group_anagrams(words):
    # TODO: group words that are anagrams of each other.
    pass
`,
  solution: `def group_anagrams(words):
    groups = {}
    for word in words:
        key = ''.join(sorted(word))
        groups.setdefault(key, []).append(word)
    return list(groups.values())
`,
  hints: [
    'Anagrams share the same letters, just reordered — sorting a word\'s letters gives every anagram of it the exact same string.',
    'Use that sorted string as a dict key, and collect matching words into a list under that key.',
    "key = ''.join(sorted(word)); groups.setdefault(key, []).append(word).",
    "def group_anagrams(words): groups = {}; for word in words: key = ''.join(sorted(word)); groups.setdefault(key, []).append(word); return list(groups.values()).",
  ],
  spec: {
    mode: 'function',
    entryPoint: 'group_anagrams',
    argTypes: ['value'],
    resultType: 'value',
    tests: [
      {
        id: 'basic',
        group: 'visible',
        args: [['eat', 'tea', 'tan', 'ate', 'nat', 'bat']],
        expected: [
          ['eat', 'tea', 'ate'],
          ['tan', 'nat'],
          ['bat'],
        ],
        comparator: 'checker',
        checker: `def norm(groups):
    return sorted(sorted(g) for g in groups)
return norm(got) == norm(expected)`,
      },
      {
        id: 'larger-group-plus-singleton',
        group: 'hidden',
        args: [['abc', 'cba', 'bca', 'xyz']],
        expected: [
          ['abc', 'cba', 'bca'],
          ['xyz'],
        ],
        comparator: 'checker',
        checker: `def norm(groups):
    return sorted(sorted(g) for g in groups)
return norm(got) == norm(expected)`,
        label: 'a larger group plus a singleton',
      },
      {
        id: 'single-empty-string',
        group: 'edge',
        args: [['']],
        expected: [['']],
        comparator: 'checker',
        checker: `def norm(groups):
    return sorted(sorted(g) for g in groups)
return norm(got) == norm(expected)`,
        label: 'single empty string',
      },
      {
        id: 'single-one-letter-word',
        group: 'edge',
        args: [['a']],
        expected: [['a']],
        comparator: 'checker',
        checker: `def norm(groups):
    return sorted(sorted(g) for g in groups)
return norm(got) == norm(expected)`,
        label: 'single one-letter word',
      },
    ],
  },
};
