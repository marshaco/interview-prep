import type { CodeQuestion } from '../../../../types';

export const dailyTemperatures: CodeQuestion = {
  id: 'stack/daily-temperatures',
  kind: 'algorithm_problem',
  moduleId: 'stack',
  skillIds: ['stack/monotonic-stack'],
  title: 'Daily Temperatures',
  prompt: `## Daily Temperatures

Given a list of daily temperatures, return a list where each index holds
the number of days you'd have to wait for a warmer temperature. If there
isn't a future day that's warmer, put \`0\` for that day.

\`\`\`python
def daily_temperatures(temps):
    ...
\`\`\`

Keep a stack of *indices* whose warmer day hasn't been found yet, so its
temperatures stay in decreasing order. Whenever today beats the top of the
stack, that day has found its answer — pop it and record the gap.`,
  starterCode: `def daily_temperatures(temps):
    # TODO: for each day, how many days until a warmer temperature (0 if none)?
`,
  solution: `def daily_temperatures(temps):
    answer = [0] * len(temps)
    stack = []
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            prev = stack.pop()
            answer[prev] = i - prev
        stack.append(i)
    return answer
`,
  hints: [
    'The brute-force check-every-later-day approach is O(n²) — a monotonic stack of indices gets this to O(n).',
    'Keep indices on the stack whose warmer day hasn\'t appeared yet, with temperatures in decreasing order from bottom to top.',
    'When today\'s temperature beats the temperature at the index on top of the stack, that index has found its answer (today\'s index minus that index) — keep popping while that\'s true, since more than one earlier day might be waiting.',
    'answer = [0]*len(temps); stack = []; for i, t in enumerate(temps): while stack and temps[stack[-1]] < t: prev = stack.pop(); answer[prev] = i - prev; stack.append(i); return answer.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'daily_temperatures',
    argTypes: ['value'],
    resultType: 'value',
    tests: [
      {
        id: 'classic-example',
        group: 'visible',
        args: [[73, 74, 75, 71, 69, 72, 76, 73]],
        expected: [1, 1, 4, 2, 1, 1, 0, 0],
        comparator: 'deep',
      },
      {
        id: 'steady-increase',
        group: 'visible',
        args: [[30, 40, 50, 60]],
        expected: [1, 1, 1, 0],
        comparator: 'deep',
      },
      {
        id: 'strictly-increasing',
        group: 'hidden',
        args: [[30, 60, 90]],
        expected: [1, 1, 0],
        comparator: 'deep',
        label: 'strictly increasing temperatures',
      },
      {
        id: 'strictly-decreasing',
        group: 'hidden',
        args: [[90, 60, 30]],
        expected: [0, 0, 0],
        comparator: 'deep',
        label: 'strictly decreasing temperatures',
      },
      { id: 'empty-list', group: 'edge', args: [[]], expected: [], comparator: 'deep', label: 'empty list' },
      { id: 'single-day', group: 'edge', args: [[70]], expected: [0], comparator: 'deep', label: 'single day' },
    ],
  },
  reviewable: true,
};
