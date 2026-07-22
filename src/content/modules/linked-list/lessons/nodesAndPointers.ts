import type { LessonSection } from '../../../types';

export const nodesAndPointers: LessonSection = {
  id: 'linked-list/lesson/nodes-and-pointers',
  title: 'Nodes and pointers',
  diagram: {
    nodes: [
      { value: 1, label: 'head' },
      { value: 2 },
      { value: 3 },
    ],
    connected: true,
    caption: 'val holds the payload; next points to the following node, or None at the end of the chain.',
  },
  body: `## Nodes and pointers

Every node is a tiny object holding exactly two things:

\`\`\`python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
\`\`\`

- \`val\` — the payload. Could be an int, a string, anything.
- \`next\` — a reference to the *next* node in the chain, or \`None\` if this
  is the last one.

The list itself is nothing more than a reference to its first node, usually
called \`head\`. There is no separate "list object" holding an array of
nodes — the list *is* the chain, and \`head\` is your only entry point into
it. Lose the reference to \`head\` and every node after it becomes
unreachable garbage, even though the nodes themselves still technically
exist in memory.

An empty list is simply \`head = None\` — no nodes at all. This is the case
that breaks a naive implementation first, and it's why almost every method
you'll write starts with an explicit check for it.`,
};
