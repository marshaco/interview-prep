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

A **monotonic stack** keeps its elements in strictly increasing (or
decreasing) order at all times, by popping whatever would break that order
*before* pushing the new element. It's the standard O(n) tool for
"find the next element that's bigger/smaller than this one," for every
index, in a single pass.

Take "find, for each day, how many days until a warmer temperature" —
the naive approach checks every later day for every day, O(n²). The
monotonic-stack version keeps a stack of *indices* whose temperatures are
still waiting for a warmer day, in decreasing order of temperature:

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

Walk it: whenever today's temperature is warmer than the one on top of the
stack, that colder day has *found its answer* — pop it, record the gap,
and keep checking (there might be several colder days waiting). Only once
nothing left on the stack is beaten by today do you push today's index.

Every index is pushed once and popped at most once, so the total work
across the whole loop is O(n) even though there's a \`while\` loop nested
inside the \`for\` loop — the trap is eyeballing the nested loop and
assuming O(n²). This exact shape — pop while the invariant would break,
then push — is what "monotonic stack" means, and it solves "next greater
element," "next warmer day," and "largest rectangle in a histogram" with
only the comparison direction changing.`,
};
