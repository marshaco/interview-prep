import type { LessonSection } from '../../../types';

export const theMonotonicStackPattern: LessonSection = {
  id: 'stack/lesson/the-monotonic-stack-pattern',
  title: 'The monotonic stack pattern',
  diagram: {
    nodes: [
      { value: 9 },
      { value: 5 },
      { value: 3, label: 'top', highlight: true },
    ],
    connected: false,
    caption: 'A decreasing monotonic stack mid-scan — each value is smaller than the one below it.',
  },
  body: `## The monotonic stack pattern

A **monotonic stack** stays sorted at all times — strictly increasing or
strictly decreasing — by popping anything that would break that order
before it pushes the new element. It's the standard way to answer "what's
the next bigger (or smaller) element" for every index in a single O(n)
pass.

Take the classic version of this problem: for each day, how many days do
you wait until a warmer one shows up? Checking every later day for every
day is O(n²). The monotonic-stack version instead keeps a stack of
indices still waiting for a warmer day, always in decreasing order of
temperature:

\`\`\`python
def daily_temperatures(temps):
    answer = [0] * len(temps)
    stack = []  # indices, temps[stack] is decreasing
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            prev = stack.pop()
            answer[prev] = i - prev
        stack.append(i)
    return answer
\`\`\`

Here's what happens as you walk it: when today is warmer than the top of
the stack, that colder day just found its answer. Pop it, record the gap,
and check again — there could be several colder days stacked up waiting.
Once nothing left on the stack loses to today, push today's index and
move on.

Every index gets pushed exactly once and popped at most once, so the
total work across the whole loop is O(n) — even with a \`while\` loop
sitting inside the \`for\` loop. That nested loop is the trap: it looks
like O(n²) if you don't notice that each element can only ever be popped
once. Pop while the invariant would break, then push. That's the entire
pattern, and it's what solves next greater element, next warmer day, and
largest rectangle in a histogram, changing only which direction you
compare in.`,
};
