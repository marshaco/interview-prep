import type { CodeQuestion } from '../../../../types';

export const step4PalindromeCheck: CodeQuestion = {
  id: 'two-pointers/guided-apply/4-palindrome-check',
  kind: 'algorithm_problem',
  moduleId: 'two-pointers',
  skillIds: ['two-pointers/palindrome-check'],
  title: 'palindrome check',
  prompt: `## Guided Apply 4 of 4: palindrome check

Given a string containing only lowercase letters, return \`True\` if it
reads the same forwards and backwards.

\`\`\`python
def is_palindrome_simple(s):
    ...
\`\`\`

Converge from both ends, comparing characters as you go — the moment two
don't match, it isn't a palindrome.`,
  starterCode: `def is_palindrome_simple(s):
    # TODO: return True if s reads the same forwards and backwards.
`,
  solution: `def is_palindrome_simple(s):
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True
`,
  hints: [
    'You never need to build the reversed string — just compare characters from both ends as the pointers converge.',
    'Return False the instant a mismatched pair is found; there\'s no need to keep comparing.',
    'left, right = 0, len(s) - 1; while left < right: if s[left] != s[right]: return False; left += 1; right -= 1.',
    'If the loop finishes without ever returning False, every pair matched — return True.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'is_palindrome_simple',
    argTypes: ['value'],
    resultType: 'value',
    tests: [
      { id: 'racecar', group: 'visible', args: ['racecar'], expected: true, comparator: 'deep' },
      { id: 'hello', group: 'visible', args: ['hello'], expected: false, comparator: 'deep' },
      {
        id: 'odd-length',
        group: 'hidden',
        args: ['level'],
        expected: true,
        comparator: 'deep',
        label: 'odd-length palindrome',
      },
      {
        id: 'even-length',
        group: 'hidden',
        args: ['abccba'],
        expected: true,
        comparator: 'deep',
        label: 'even-length palindrome',
      },
      { id: 'empty-string', group: 'edge', args: [''], expected: true, comparator: 'deep', label: 'empty string' },
      {
        id: 'single-char',
        group: 'edge',
        args: ['a'],
        expected: true,
        comparator: 'deep',
        label: 'single character',
      },
    ],
  },
  reviewable: false,
};
