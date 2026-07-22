import type { LessonSection } from '../../../types';

export const twoWaysToBuildAStack: LessonSection = {
  id: 'stack/lesson/two-ways-to-build-a-stack',
  title: 'Two ways to build a stack',
  diagram: {
    nodes: [
      { value: 3, label: 'top', highlight: true },
      { value: 2 },
      { value: 1 },
    ],
    connected: true,
    caption: 'Linked-list-backed: the most recently pushed value (3) sits at top, pointing back toward the rest.',
  },
  body: `## Two ways to build a stack

A stack is defined by its behavior — push, pop, peek, LIFO order — not by
how it's stored in memory. Two very different representations satisfy
that behavior equally well.

**Array/list-backed** — keep a plain list, and treat its *end* as the top:

\`\`\`python
class Stack:
    def __init__(self):
        self.items = []

    def push(self, value):
        self.items.append(value)      # O(1) amortized

    def pop(self):
        return self.items.pop()       # O(1)

    def peek(self):
        return self.items[-1]         # O(1)
\`\`\`

Pushing and popping at the end of a Python list is O(1) amortized. That's
why the top of the stack is the end of the list, not the front — popping
index 0 is O(n), since everything else has to shift over.

**Linked-list-backed** — keep a \`top\` pointer, and push/pop at the head:

\`\`\`python
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

class Stack:
    def __init__(self):
        self.top = None

    def push(self, value):
        node = Node(value)
        node.next = self.top
        self.top = node

    def pop(self):
        value = self.top.val
        self.top = self.top.next
        return value
\`\`\`

This should look familiar: it's \`prepend\` and \`delete-the-head\` from the
Linked List module. A stack is just a linked list where you've decided to
only ever touch the head. Both versions behave identically from the
outside, which is what actually gets graded here, not which one you
picked. In a real interview, either is normally fine — default to the
list-backed version unless you're asked specifically to avoid a built-in
dynamic array.`,
};
