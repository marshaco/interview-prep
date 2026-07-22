import type { LessonSection } from '../../../types';

export const twoPointersOnSortedInput: LessonSection = {
  id: 'two-pointers/lesson/two-pointers-on-sorted-input',
  title: 'Two pointers on sorted input',
  body: `## Two pointers on sorted input

The Arrays & Hashing module solved two sum with a hash map: O(n) time,
O(n) extra space, and it works on **unsorted** input. When the input is
already **sorted**, converging pointers solve the same problem in O(n)
time and O(1) extra space:

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

Here's what sortedness buys you: if \`numbers[left] + numbers[right]\`
comes up too small, moving \`right\` further left can only make the sum
smaller or equal, since everything left of \`right\` is already
≤ \`numbers[right]\`. The only thing that can possibly help is moving
\`left\` forward to a bigger value. The same logic applies in reverse when
the sum is too big. That's the whole reason you can throw away one end of
the search space at every step instead of checking every pair.

This trade-off is worth remembering: reach for a hash map when the input
isn't sorted, or when sorting it would cost more than it saves. Reach for
two pointers when it's already sorted — same time complexity, and you
skip the extra memory.`,
};
