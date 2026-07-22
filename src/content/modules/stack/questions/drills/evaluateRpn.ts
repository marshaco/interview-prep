import type { CodeQuestion } from '../../../../types';

export const evaluateRpn: CodeQuestion = {
  id: 'stack/evaluate-rpn',
  kind: 'algorithm_problem',
  moduleId: 'stack',
  skillIds: ['stack/expression-evaluation'],
  title: 'Evaluate Reverse Polish Notation',
  prompt: `## Evaluate Reverse Polish Notation

Given a list of tokens representing an arithmetic expression in **Reverse
Polish (postfix) Notation** — operators \`+ - * /\` follow their operands
instead of sitting between them — evaluate it and return the result.

\`\`\`python
def eval_rpn(tokens):
    ...
\`\`\`

Push numbers. When you hit an operator, pop the **two most recent**
operands, apply the operator, and push the result back. By the end,
exactly one value remains on the stack — the answer. Division truncates
toward zero (so \`-7 / 2\` is \`-3\`, not \`-4\`).`,
  starterCode: `def eval_rpn(tokens):
    # TODO: evaluate the postfix expression and return the result.
`,
  solution: `def eval_rpn(tokens):
    stack = []
    operators = {'+', '-', '*', '/'}
    for token in tokens:
        if token in operators:
            b = stack.pop()
            a = stack.pop()
            if token == '+':
                stack.append(a + b)
            elif token == '-':
                stack.append(a - b)
            elif token == '*':
                stack.append(a * b)
            else:
                stack.append(int(a / b))
        else:
            stack.append(int(token))
    return stack[-1]
`,
  hints: [
    'Numbers get pushed. Operators pop two values and push one back — the stack shrinks by one net item per operator.',
    'Order matters for - and /: the operand pushed *first* (further down the stack) is the left-hand side. Pop b (right) before a (left): a - b, not b - a.',
    'operators = {"+","-","*","/"}; for token in tokens: if token in operators: b = stack.pop(); a = stack.pop(); push a <op> b; else: stack.append(int(token)).',
    'Python\'s int(a / b) truncates toward zero, matching the expected division rule. The final answer is the single value left in the stack.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'eval_rpn',
    argTypes: ['value'],
    resultType: 'value',
    tests: [
      { id: 'add-then-multiply', group: 'visible', args: [['2', '1', '+', '3', '*']], expected: 9, comparator: 'deep' },
      { id: 'divide-then-add', group: 'visible', args: [['4', '13', '5', '/', '+']], expected: 6, comparator: 'deep' },
      {
        id: 'long-mixed-expression',
        group: 'hidden',
        args: [['10', '6', '9', '3', '+', '-11', '*', '/', '*', '17', '+', '5', '+']],
        expected: 22,
        comparator: 'deep',
        label: 'long expression mixing every operator',
      },
      {
        id: 'subtraction-order',
        group: 'hidden',
        args: [['4', '3', '-']],
        expected: 1,
        comparator: 'deep',
        label: 'subtraction operand order matters',
      },
      {
        id: 'single-token',
        group: 'edge',
        args: [['5']],
        expected: 5,
        comparator: 'deep',
        label: 'single token, no operators',
      },
      {
        id: 'negative-division-truncation',
        group: 'edge',
        args: [['-7', '2', '/']],
        expected: -3,
        comparator: 'deep',
        label: 'negative division truncates toward zero',
      },
    ],
  },
};
