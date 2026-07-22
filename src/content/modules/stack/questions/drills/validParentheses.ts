import type { CodeQuestion } from '../../../../types';

export const validParentheses: CodeQuestion = {
  id: 'stack/valid-parentheses',
  kind: 'algorithm_problem',
  moduleId: 'stack',
  skillIds: ['stack/valid-parentheses'],
  title: 'Valid Parentheses',
  prompt: `## Valid Parentheses

Given a string containing only \`(){}[]\`, return \`True\` if every opening
bracket is closed by the same type of bracket, in the correct order.

\`\`\`python
def is_valid(s):
    ...
\`\`\`

Push every opening bracket. On a closing bracket, it must match whatever
is on top of the stack — if the stack is empty, or the top doesn't match,
the string is invalid. A stack is the natural fit here because the
*most recently opened* bracket must be the *next one closed*.`,
  starterCode: `def is_valid(s):
    # TODO: return True if every bracket in s is properly matched and nested.
    pass
`,
  solution: `def is_valid(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return not stack
`,
  hints: [
    'Push opening brackets as you see them. A closing bracket must match whatever you pushed most recently.',
    'If you hit a closing bracket and the stack is empty, or the popped value isn\'t the matching opener, the string is invalid immediately.',
    'A map like {")" : "(", "]": "[", "}": "{"} lets you look up what opener a closer expects, in one line per character.',
    'for ch in s: if ch in pairs: if not stack or stack.pop() != pairs[ch]: return False; else: stack.append(ch). Return not stack at the end (nothing left unclosed).',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'is_valid',
    argTypes: ['value'],
    resultType: 'value',
    tests: [
      { id: 'simple-pair', group: 'visible', args: ['()'], expected: true, comparator: 'deep' },
      { id: 'mixed-types', group: 'visible', args: ['()[]{}'], expected: true, comparator: 'deep' },
      {
        id: 'mismatched-types',
        group: 'hidden',
        args: ['(]'],
        expected: false,
        comparator: 'deep',
        label: 'mismatched bracket types',
      },
      {
        id: 'interleaved',
        group: 'hidden',
        args: ['([)]'],
        expected: false,
        comparator: 'deep',
        label: 'interleaved brackets that never properly nest',
      },
      { id: 'empty-string', group: 'edge', args: [''], expected: true, comparator: 'deep', label: 'empty string' },
      {
        id: 'unclosed',
        group: 'edge',
        args: ['((('],
        expected: false,
        comparator: 'deep',
        label: 'opening brackets never closed',
      },
    ],
  },
};
