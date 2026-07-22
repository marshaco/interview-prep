import type { CodeQuestion } from '../../../types';

export const reverse: CodeQuestion = {
  id: 'linked-list/reverse',
  kind: 'method_impl',
  moduleId: 'linked-list',
  skillIds: ['linked-list/reverse'],
  title: 'reverse_list',
  prompt: `## reverse_list

Given the head of a singly linked list, reverse it **in place** and return
the new head. Do not build new nodes — relink the existing ones.

\`\`\`python
def reverse_list(head):
    ...
\`\`\`
`,
  starterCode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def reverse_list(head):
    # TODO: reverse the list in place and return the new head.
`,
  solution: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def reverse_list(head):
    prev = None
    node = head
    while node is not None:
        next_node = node.next
        node.next = prev
        prev = node
        node = next_node
    return prev
`,
  hints: [
    'You need to flip every node\'s .next pointer to point backward — but the moment you do, you lose the way forward unless you save it first.',
    'Track three things as you walk: the previous node, the current node, and the next node (saved before you overwrite current.next).',
    'prev = None; node = head; while node: save next_node = node.next, set node.next = prev, then advance prev = node and node = next_node.',
    'prev, node = None, head; loop: next_node = node.next; node.next = prev; prev = node; node = next_node; after the loop return prev (the new head).',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'reverse_list',
    argTypes: ['linked_list'],
    resultType: 'linked_list',
    tests: [
      { id: 'basic', group: 'visible', args: [[1, 2, 3]], expected: [3, 2, 1], comparator: 'deep' },
      { id: 'single-node', group: 'visible', args: [[1]], expected: [1], comparator: 'deep' },
      { id: 'longer-list', group: 'hidden', args: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1], comparator: 'deep', label: 'longer list' },
      { id: 'two-nodes', group: 'hidden', args: [[1, 2]], expected: [2, 1], comparator: 'deep', label: 'two nodes' },
      { id: 'empty-list', group: 'edge', args: [[]], expected: [], comparator: 'deep', label: 'empty list' },
      { id: 'duplicate-values', group: 'edge', args: [[7, 7]], expected: [7, 7], comparator: 'deep', label: 'duplicate values' },
    ],
  },
};
