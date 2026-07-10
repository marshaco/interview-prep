import type { CodeQuestion } from '../../../types';

export const mergeTwoSorted: CodeQuestion = {
  id: 'linked-list/merge-two-sorted',
  kind: 'method_impl',
  moduleId: 'linked-list',
  skillIds: ['linked-list/merge-two-sorted'],
  title: 'merge_two_sorted',
  prompt: `## merge_two_sorted

Given the heads of two sorted (ascending) singly linked lists, merge them
into one sorted list by relinking existing nodes, and return its head.

\`\`\`python
def merge_two_sorted(head1, head2):
    ...
\`\`\`
`,
  starterCode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def merge_two_sorted(head1, head2):
    # TODO: merge the two sorted lists into one sorted list.
    pass
`,
  solution: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def merge_two_sorted(head1, head2):
    dummy = ListNode()
    tail = dummy
    a, b = head1, head2
    while a is not None and b is not None:
        if a.val <= b.val:
            tail.next = a
            a = a.next
        else:
            tail.next = b
            b = b.next
        tail = tail.next
    tail.next = a if a is not None else b
    return dummy.next
`,
  hints: [
    'You are choosing, one node at a time, which of the two list heads is smaller and should come next.',
    'A dummy/sentinel node before the result list gives you a stable place to hang the first real node on, so you don\'t need a special case for "the list is empty so far".',
    'dummy = ListNode(); tail = dummy; while a and b: attach the smaller of a/b to tail.next, advance that pointer, advance tail. When one list runs out, attach the rest of the other.',
    'dummy = ListNode(); tail = dummy; loop while both a and b exist, comparing a.val <= b.val to decide which to attach to tail.next then advance both that pointer and tail; after the loop, tail.next = whichever of a/b is not None; return dummy.next.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'merge_two_sorted',
    argTypes: ['linked_list', 'linked_list'],
    resultType: 'linked_list',
    tests: [
      { id: 'basic', group: 'visible', args: [[1, 3, 5], [2, 4, 6]], expected: [1, 2, 3, 4, 5, 6], comparator: 'deep' },
      { id: 'first-empty', group: 'visible', args: [[], [1, 2]], expected: [1, 2], comparator: 'deep' },
      { id: 'second-empty', group: 'hidden', args: [[1, 2, 3], []], expected: [1, 2, 3], comparator: 'deep', label: 'second list empty' },
      { id: 'duplicate-values-across', group: 'hidden', args: [[1, 1, 2], [1, 3]], expected: [1, 1, 1, 2, 3], comparator: 'deep', label: 'duplicate values across lists' },
      { id: 'both-empty', group: 'edge', args: [[], []], expected: [], comparator: 'deep', label: 'both lists empty' },
      { id: 'both-single-equal', group: 'edge', args: [[5], [5]], expected: [5, 5], comparator: 'deep', label: 'both single node with equal values' },
    ],
  },
};
