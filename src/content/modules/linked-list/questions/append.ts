import type { CodeQuestion } from '../../../types';

export const append: CodeQuestion = {
  id: 'linked-list/append',
  kind: 'method_impl',
  moduleId: 'linked-list',
  skillIds: ['linked-list/append'],
  title: 'append',
  prompt: `## append

Given the head of a singly linked list and a value, add a new node holding
that value to the **end** of the list. Return the (possibly new) head.

\`\`\`python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def append(head, value):
    ...
\`\`\`

If \`head\` is \`None\`, the new node becomes the whole list.`,
  starterCode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def append(head, value):
    # TODO: attach a new node holding value to the end of the list.
`,
  solution: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def append(head, value):
    new_node = ListNode(value)
    if head is None:
        return new_node
    node = head
    while node.next is not None:
        node = node.next
    node.next = new_node
    return head
`,
  hints: [
    'What should happen if the list is empty when you call append?',
    'You need a reference to the *last* node before you can attach a new one — walking one node at a time is the only way to find it in a singly linked list.',
    'If head is None, the new node is the whole list. Otherwise walk `node = node.next` until `node.next is None`, then set `node.next` to the new node.',
    'new_node = ListNode(value); if head is None: return new_node; then walk to the last node and set its .next to new_node; return head.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'append',
    argTypes: ['linked_list', 'value'],
    resultType: 'linked_list',
    tests: [
      { id: 'basic', group: 'visible', args: [[1, 2, 3], 4], expected: [1, 2, 3, 4], comparator: 'deep' },
      { id: 'to-empty', group: 'visible', args: [[], 5], expected: [5], comparator: 'deep' },
      { id: 'single-node', group: 'hidden', args: [[1], 2], expected: [1, 2], comparator: 'deep', label: 'single node list' },
      { id: 'longer-list', group: 'hidden', args: [[1, 2, 3, 4, 5], 6], expected: [1, 2, 3, 4, 5, 6], comparator: 'deep', label: 'longer list' },
      { id: 'empty-list', group: 'edge', args: [[], 0], expected: [0], comparator: 'deep', label: 'empty list' },
      { id: 'duplicate-value', group: 'edge', args: [[7], 7], expected: [7, 7], comparator: 'deep', label: 'appended value duplicates existing node' },
    ],
  },
};
