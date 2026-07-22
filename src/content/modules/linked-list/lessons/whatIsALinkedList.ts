import type { LessonSection } from '../../../types';

export const whatIsALinkedList: LessonSection = {
  id: 'linked-list/lesson/what-is-a-linked-list',
  title: 'What is a linked list?',
  diagram: {
    nodes: [
      { value: 1, label: 'head', highlight: true },
      { value: 2 },
      { value: 3 },
    ],
    connected: true,
    caption: 'A singly linked list: each node points to the next; head is the only entry point into the chain.',
  },
  body: `## What is a linked list?

An array stores its elements in one contiguous block of memory. That's
what makes \`arr[i]\` O(1) — the address of element \`i\` is just
\`base + i * size\`. It's also why inserting in the middle of an array
costs O(n): everything after the insertion point has to physically shift
over to make room.

A **linked list** takes the opposite trade-off: instead of one contiguous
block, it's a chain of individually allocated **nodes**, each holding a
value and a pointer to the next one. The nodes can live anywhere in
memory. Inserting or removing one doesn't shift anything else — you're
just rewiring a couple of pointers.

|                     | Array | Linked List |
|---------------------|-------|-------------|
| Access by index      | O(1)  | O(n) — must walk from the head |
| Insert/delete at head | O(n) | O(1) |
| Insert/delete at tail (no tail pointer) | O(1) | O(n) |
| Memory layout        | contiguous | scattered, linked by pointers |

Neither one is better in general, they're just suited to different access
patterns. You'll feel this directly in the exercises ahead: appending at
the front is free, appending at the back is expensive, and there's no
shortcut to "the 5th element" — you walk there one node at a time.`,
};
