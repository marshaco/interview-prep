import type { CodeQuestion } from '../../../types';

export const findMiddle: CodeQuestion = {
  id: 'linked-list/find-middle',
  kind: 'method_impl',
  moduleId: 'linked-list',
  skillIds: ['linked-list/find-middle'],
  title: 'find_middle',
  prompt: `## find_middle

Given the head of a non-empty singly linked list, return the **value** of
the middle node, using one pass with two pointers (slow/fast). If the list
has an even number of nodes, return the value of the **second** of the two
middle nodes (e.g. for \`[1,2,3,4]\`, return \`3\`).

\`\`\`python
def find_middle(head):
    ...
\`\`\`
`,
  starterCode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def find_middle(head):
    # TODO: return the value of the middle node (upper middle if even length).
`,
  solution: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def find_middle(head):
    slow = head
    fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
    return slow.val
`,
  hints: [
    'Walking the list twice (once to count, once to stop halfway) works but needs two passes — can you find the middle in a single pass?',
    'A pointer that moves twice as fast as another reaches the end exactly when the slow one reaches the middle.',
    'slow = fast = head; while fast and fast.next: slow = slow.next; fast = fast.next.next. When the loop ends, slow is at the middle.',
    'slow = fast = head; loop while fast is not None and fast.next is not None, advancing slow by one node and fast by two; return slow.val once the loop ends.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'find_middle',
    argTypes: ['linked_list'],
    resultType: 'value',
    tests: [
      { id: 'odd-length', group: 'visible', args: [[1, 2, 3]], expected: 2, comparator: 'deep' },
      { id: 'even-length', group: 'visible', args: [[1, 2, 3, 4]], expected: 3, comparator: 'deep' },
      { id: 'odd-length-longer', group: 'hidden', args: [[1, 2, 3, 4, 5]], expected: 3, comparator: 'deep', label: 'odd length, longer list' },
      { id: 'even-length-longer', group: 'hidden', args: [[1, 2, 3, 4, 5, 6]], expected: 4, comparator: 'deep', label: 'even length, longer list' },
      { id: 'single-node', group: 'edge', args: [[1]], expected: 1, comparator: 'deep', label: 'single node' },
      { id: 'two-nodes', group: 'edge', args: [[1, 2]], expected: 2, comparator: 'deep', label: 'two nodes' },
    ],
  },
};
