import type { CodeQuestion } from '../../../types';

export const detectCycle: CodeQuestion = {
  id: 'linked-list/detect-cycle',
  kind: 'method_impl',
  moduleId: 'linked-list',
  skillIds: ['linked-list/detect-cycle'],
  title: 'detect_cycle',
  prompt: `## detect_cycle

Given the head of a singly linked list that may contain a cycle (some
node's \`next\` points back to an earlier node instead of \`None\`), return
\`True\` if there is a cycle, \`False\` otherwise. Use O(1) extra space.

\`\`\`python
def detect_cycle(head):
    ...
\`\`\`
`,
  starterCode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def detect_cycle(head):
    # TODO: return True if the list loops back on itself.
`,
  solution: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def detect_cycle(head):
    slow = head
    fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False
`,
  hints: [
    'You can\'t rely on walking until `node is None` — a cyclic list never reaches None, so that loop would spin forever.',
    'A slow pointer and a fast pointer will eventually land on the *same node* if and only if the list loops.',
    'slow = fast = head; while fast and fast.next: slow = slow.next; fast = fast.next.next; if slow is fast: return True. Return False if the loop ends normally.',
    'slow = fast = head; loop while fast is not None and fast.next is not None, advancing slow by one and fast by two each time, returning True the moment `slow is fast`; return False after the loop.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'detect_cycle',
    argTypes: ['linked_list_with_cycle'],
    resultType: 'value',
    tests: [
      { id: 'no-cycle', group: 'visible', args: [{ values: [1, 2, 3], cyclePos: null }], expected: false, comparator: 'deep' },
      { id: 'cycle-to-head', group: 'visible', args: [{ values: [1, 2, 3], cyclePos: 0 }], expected: true, comparator: 'deep' },
      { id: 'cycle-in-middle', group: 'hidden', args: [{ values: [1, 2, 3, 4, 5], cyclePos: 2 }], expected: true, comparator: 'deep', label: 'cycle pointing into the middle' },
      { id: 'single-node-no-cycle', group: 'hidden', args: [{ values: [1], cyclePos: null }], expected: false, comparator: 'deep', label: 'single node, no cycle' },
      { id: 'empty-list', group: 'edge', args: [{ values: [], cyclePos: null }], expected: false, comparator: 'deep', label: 'empty list' },
      { id: 'single-node-self-cycle', group: 'edge', args: [{ values: [1], cyclePos: 0 }], expected: true, comparator: 'deep', label: 'single node pointing to itself' },
    ],
  },
  reviewable: true,
  estimatedMinutes: 20,
};
