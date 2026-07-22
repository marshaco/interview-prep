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

The list itself is nothing more than a reference to its first node,
usually called \`head\`. There's no separate "list object" holding an array
of nodes somewhere — the list *is* the chain, and \`head\` is the only way
in. Lose that reference and every node after it becomes unreachable
garbage, even though the nodes are technically still sitting in memory.

An empty list is just \`head = None\` — no nodes at all. It's the case that
breaks a naive implementation first, which is why nearly every method you
write should start by checking for it.`,
};
