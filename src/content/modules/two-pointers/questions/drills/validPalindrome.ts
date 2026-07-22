import type { CodeQuestion } from '../../../../types';

export const validPalindrome: CodeQuestion = {
  id: 'two-pointers/valid-palindrome',
  kind: 'algorithm_problem',
  moduleId: 'two-pointers',
  skillIds: ['two-pointers/palindrome-check'],
  title: 'Valid Palindrome',
  prompt: `## Valid Palindrome

Given a string that may contain letters, digits, spaces, and punctuation,
return \`True\` if it's a palindrome when you **ignore case and every
non-alphanumeric character**.

\`\`\`python
def is_palindrome(s):
    ...
\`\`\`

Same converging-pointers shape as before, but now each pointer has to skip
past non-alphanumeric characters before comparing — so the two inner
skip-loops do the filtering, no separate cleanup pass over the string
needed.`,
  starterCode: `def is_palindrome(s):
    # TODO: return True if s is a palindrome, ignoring case and non-alphanumeric characters.
`,
  solution: `def is_palindrome(s):
    left, right = 0, len(s) - 1
    while left < right:
        while left < right and not s[left].isalnum():
            left += 1
        while left < right and not s[right].isalnum():
            right -= 1
        if s[left].lower() != s[right].lower():
            return False
        left += 1
        right -= 1
    return True
`,
  hints: [
    'You don\'t need to build a cleaned-up copy of the string first — skip non-alphanumeric characters as you walk, right inside the same loop.',
    'Each side needs its own inner while loop: advance left past non-alphanumeric characters, and pull right back past them, before comparing.',
    'while left < right: skip left forward while s[left] isn\'t alphanumeric; skip right backward while s[right] isn\'t alphanumeric; then compare s[left].lower() to s[right].lower().',
    'str.isalnum() tells you whether a character counts; str.lower() makes the comparison case-insensitive. Both inner skip-loops must also check left < right, so they can\'t run past each other.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'is_palindrome',
    argTypes: ['value'],
    resultType: 'value',
    tests: [
      {
        id: 'classic-true',
        group: 'visible',
        args: ['A man, a plan, a canal: Panama'],
        expected: true,
        comparator: 'deep',
      },
      { id: 'classic-false', group: 'visible', args: ['race a car'], expected: false, comparator: 'deep' },
      {
        id: 'punctuation-and-case',
        group: 'hidden',
        args: ['Was it a car or a cat I saw?'],
        expected: true,
        comparator: 'deep',
        label: 'punctuation and mixed case',
      },
      {
        id: 'underscore-skipped',
        group: 'hidden',
        args: ['ab_a'],
        expected: true,
        comparator: 'deep',
        label: 'underscore is not alphanumeric and is skipped',
      },
      { id: 'empty-string', group: 'edge', args: [''], expected: true, comparator: 'deep', label: 'empty string' },
      {
        id: 'no-alphanumeric-characters',
        group: 'edge',
        args: ['.,'],
        expected: true,
        comparator: 'deep',
        label: 'no alphanumeric characters at all',
      },
    ],
  },
};
