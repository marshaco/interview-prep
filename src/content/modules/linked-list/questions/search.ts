import type { CodeQuestion } from '../../../types';

export const search: CodeQuestion = {
  id: 'linked-list/search',
  kind: 'method_impl',
  moduleId: 'linked-list',
  skillIds: ['linked-list/search'],
  title: 'search',
  prompt: `## search

Given the head of a singly linked list and a value, return \`True\` if any
node holds that value, \`False\` otherwise.

\`\`\`python
def search(head, value):
    ...
\`\`\`
`,
  starterCode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def search(head, value):
    # TODO: return True if value is found anywhere in the list.
`,
  solution: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def search(head, value):
    node = head
    while node is not None:
        if node.val == value:
            return True
        node = node.next
    return False
`,
  hints: [
    'You only need to walk the list once, checking each node as you go.',
    'Stop as soon as you find a match — there\'s no need to keep walking after that.',
    'node = head; while node is not None: if node.val == value: return True; node = node.next.',
    'Walk with a `node` pointer, return True the moment node.val == value, and return False once node becomes None.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'search',
    argTypes: ['linked_list', 'value'],
    resultType: 'value',
    tests: [
      { id: 'found', group: 'visible', args: [[1, 2, 3], 2], expected: true, comparator: 'deep' },
      { id: 'not-found', group: 'visible', args: [[1, 2, 3], 9], expected: false, comparator: 'deep' },
      { id: 'tail-match', group: 'hidden', args: [[1, 2, 3, 4, 5], 5], expected: true, comparator: 'deep', label: 'value at tail' },
      { id: 'single-node-match', group: 'hidden', args: [[1], 1], expected: true, comparator: 'deep', label: 'single node list, value present' },
      { id: 'empty-list', group: 'edge', args: [[], 1], expected: false, comparator: 'deep', label: 'empty list' },
      { id: 'duplicate-values', group: 'edge', args: [[1, 1, 1], 1], expected: true, comparator: 'deep', label: 'duplicate values' },
    ],
  },
  reviewable: true,
};
