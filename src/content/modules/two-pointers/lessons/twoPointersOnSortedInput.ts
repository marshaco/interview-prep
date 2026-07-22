import type { LessonSection } from '../../../types';

export const twoPointersOnSortedInput: LessonSection = {
  id: 'two-pointers/lesson/two-pointers-on-sorted-input',
  title: 'Two pointers on sorted input',
  body: `## Two pointers on sorted input

The Arrays & Hashing module solved "two sum" with a hash map — O(n) time,
O(n) extra space, and it works on **unsorted** input. When the input is
already **sorted**, converging pointers solve the same shape of problem in
O(n) time and O(1) extra space:

\`\`\`python
def two_sum_sorted(numbers, target):
    left, right = 0, len(numbers) - 1
    while left < right:
        total = numbers[left] + numbers[right]
        if total == target:
            return [left, right]
        elif total < target:
            left += 1     # sum too small — the only way up is a bigger left value
        else:
            right -= 1    # sum too big — the only way down is a smaller right value
    return None
\`\`\`

The key insight sortedness gives you: if \`numbers[left] + numbers[right]\`
is too small, increasing \`right\` can only make it *smaller or equal*
(everything to \`right\`'s left is ≤ \`numbers[right]\`) — so the *only*
lever that can possibly help is moving \`left\` forward to a bigger value.
Symmetric logic applies when the sum is too big. That's what lets you
throw away one end of the search space at every step instead of trying
every pair.

This trade-off — hash map vs. two pointers — is worth internalizing:
reach for a hash map when the input isn't sorted (or sorting it would cost
more than it saves), and reach for two pointers when it already is, since
you get the same time complexity with no extra memory.`,
};
