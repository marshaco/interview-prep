import type { LessonSection } from '../../../types';

export const partitioningInPlace: LessonSection = {
  id: 'two-pointers/lesson/partitioning-in-place',
  title: 'Partitioning in place',
  body: `## Partitioning in place

Not every two-pointer problem converges from both ends. A second common
shape uses a **read pointer** and a **write pointer**, both starting at
the front and moving in the *same* direction at different rates — the
standard tool for rearranging an array in place without extra memory.

"Move all zeroes to the end, keep everything else in order" is the
clearest example:

\`\`\`python
def move_zeroes(nums):
    write = 0
    for read in range(len(nums)):
        if nums[read] != 0:
            nums[write], nums[read] = nums[read], nums[write]
            write += 1
\`\`\`

\`read\` visits every element once. \`write\` only advances when it just
placed a real (non-zero) value — so it always points at the next slot a
kept value belongs in. Everything \`write\` has already passed is
correctly partitioned; everything between \`write\` and \`read\` is zeroes
swapped out of the way, and everything after \`read\` hasn't been looked at
yet.

This "slow pointer marks the boundary, fast pointer explores ahead" shape
is the same idea as the fast/slow pointer technique from the Linked List
module, just applied to in-place array compaction instead of cycle
detection — the pointers advance at different *rates* rather than
converging from opposite ends. It's the standard approach any time a
problem says "modify the array in place" for removing duplicates,
filtering, or grouping values by a condition.`,
};
