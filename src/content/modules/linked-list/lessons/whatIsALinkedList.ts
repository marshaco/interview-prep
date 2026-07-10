import type { LessonSection } from '../../../types';

export const whatIsALinkedList: LessonSection = {
  id: 'linked-list/lesson/what-is-a-linked-list',
  title: 'What is a linked list?',
  body: `## What is a linked list?

An array stores its elements in one contiguous block of memory — that's
what makes \`arr[i]\` O(1): the address of element \`i\` is just
\`base + i * size\`. It's also why inserting in the middle of an array is
O(n): everything after the insertion point has to physically shift over.

A **linked list** takes the opposite trade-off. Instead of one contiguous
block, it's a chain of individually-allocated **nodes**, each holding a
value and a pointer to the next node. Nodes can live anywhere in memory —
nothing has to shift when you insert or remove one, because you're only
ever rewiring a couple of pointers.

|                     | Array | Linked List |
|---------------------|-------|-------------|
| Access by index      | O(1)  | O(n) — must walk from the head |
| Insert/delete at head | O(n) | O(1) |
| Insert/delete at tail (no tail pointer) | O(1) | O(n) |
| Memory layout        | contiguous | scattered, linked by pointers |

Neither is "better" — they're suited to different access patterns. You'll
feel this trade-off directly in the exercises that follow: \`append\` is
free at the front and expensive at the back, and there's no way to jump
straight to "the 5th element" without walking there one node at a time.`,
};
