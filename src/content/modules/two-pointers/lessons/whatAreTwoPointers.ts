import type { LessonSection } from '../../../types';

export const whatAreTwoPointers: LessonSection = {
  id: 'two-pointers/lesson/what-are-two-pointers',
  title: 'What are two pointers?',
  diagram: {
    nodes: [
      { value: 1, label: 'left', highlight: true },
      { value: 2 },
      { value: 3 },
      { value: 4 },
      { value: 5, label: 'right', highlight: true },
    ],
    connected: false,
    caption: 'Converging pointers: left and right start at both ends and move toward each other.',
  },
  body: `## What are two pointers?

A lot of array problems look like they need a nested loop: "check every
pair," "find where two things meet." Many of them can actually be solved
in a single pass by walking **two indices through the array at once**,
instead of walking one index through it twice.

The most common shape is **converging pointers**: start one index at the
front, one at the back, and move them toward each other based on what you
see:

\`\`\`python
left, right = 0, len(arr) - 1
while left < right:
    # inspect arr[left] and arr[right], then move one or both inward
    left += 1   # and/or
    right -= 1
\`\`\`

Reversing a list in place is the simplest version of this: swap the ends,
move both pointers inward, repeat until they meet in the middle. No extra
memory needed — you're never re-scanning anything, just visiting each
position once, from a different direction than usual.

Checking every pair of positions is O(n²). Two pointers get the same
answer in O(n) because \`left\` and \`right\` only ever move toward each
other — between them, that's at most \`n\` total steps for the entire
loop, not \`n\` steps per iteration.`,
};
