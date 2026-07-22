import type { CodeQuestion } from '../../../types';

export const deleteValue: CodeQuestion = {
  id: 'linked-list/delete-value',
  kind: 'method_impl',
  moduleId: 'linked-list',
  skillIds: ['linked-list/delete'],
  title: 'delete_value',
  prompt: `## delete_value

Given the head of a singly linked list and a value, remove the **first**
node holding that value and return the (possibly new) head. If the value
isn't present, return the list unchanged.

\`\`\`python
def delete_value(head, value):
    ...
\`\`\`
`,
  starterCode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def delete_value(head, value):
    # TODO: remove the first node whose .val == value, if any.
`,
  solution: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def delete_value(head, value):
    if head is None:
        return None
    if head.val == value:
        return head.next
    node = head
    while node.next is not None and node.next.val != value:
        node = node.next
    if node.next is not None:
        node.next = node.next.next
    return head
`,
  hints: [
    'Deleting the head node is different from deleting any other node — the head itself changes, not just some node\'s .next.',
    'To remove a node that isn\'t the head, you need a reference to the node *before* it, so you can skip over the target by relinking .next.',
    'if head.val == value: return head.next. Otherwise walk with a `node` pointer until `node.next.val == value`, then set `node.next = node.next.next`.',
    'Handle head-match as a special case returning head.next; otherwise walk while node.next is not None and node.next.val != value, then splice past node.next if found; always return head.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'delete_value',
    argTypes: ['linked_list', 'value'],
    resultType: 'linked_list',
    tests: [
      { id: 'delete-middle', group: 'visible', args: [[1, 2, 3], 2], expected: [1, 3], comparator: 'deep' },
      { id: 'delete-head', group: 'visible', args: [[1, 2, 3], 1], expected: [2, 3], comparator: 'deep' },
      { id: 'delete-tail', group: 'hidden', args: [[1, 2, 3], 3], expected: [1, 2], comparator: 'deep', label: 'delete tail node' },
      { id: 'duplicate-values', group: 'hidden', args: [[1, 2, 2, 3], 2], expected: [1, 2, 3], comparator: 'deep', label: 'duplicate values, only first occurrence removed' },
      { id: 'empty-list', group: 'edge', args: [[], 5], expected: [], comparator: 'deep', label: 'empty list' },
      { id: 'single-node-deleted', group: 'edge', args: [[5], 5], expected: [], comparator: 'deep', label: 'single node list, delete only node' },
      { id: 'value-absent', group: 'edge', args: [[1, 2, 3], 9], expected: [1, 2, 3], comparator: 'deep', label: 'value not present' },
    ],
  },
};
