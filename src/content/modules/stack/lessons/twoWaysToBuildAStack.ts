import type { LessonSection } from '../../../types';

export const twoWaysToBuildAStack: LessonSection = {
  id: 'stack/lesson/two-ways-to-build-a-stack',
  title: 'Two ways to build a stack',
  body: `## Two ways to build a stack

A stack is a *behavior contract* (push/pop/peek, LIFO order), not a
specific memory layout. Two representations satisfy it equally well:

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

Pushing and popping at the *end* of a Python list is O(1) amortized —
exactly the reason the top of the stack is the end of the list, not the
front (popping index 0 would be O(n), shifting everything over).

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

This is exactly \`prepend\`/\`delete-the-head\` from the Linked List module —
a stack is a linked list where you've locked yourself into only ever
touching the head. Both representations give identical *observable*
behavior; the grading in this module checks behavior, not which one you
picked. Real interview settings almost always accept either — reach for
the list-backed version unless you're specifically asked to avoid a
built-in dynamic array.`,
};
