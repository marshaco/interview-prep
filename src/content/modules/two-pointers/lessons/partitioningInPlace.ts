import type { LessonSection } from '../../../types';

export const partitioningInPlace: LessonSection = {
  id: 'two-pointers/lesson/partitioning-in-place',
  title: 'Partitioning in place',
  body: `## Partitioning in place

Not every two-pointer problem converges from both ends. Another common
shape uses a **read pointer** and a **write pointer**, both starting at
the front and moving in the same direction, just at different rates. It's
the standard tool for rearranging an array in place without extra memory.

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

\`read\` visits every element once. \`write\` only moves forward when it
just placed a real, non-zero value, so it always points at the next open
slot for a kept value. Everything before \`write\` is already correctly
partitioned. Everything between \`write\` and \`read\` is zeroes that got
swapped out of the way. Everything after \`read\` hasn't been looked at
yet.

This same idea — a slow pointer marking the boundary while a fast pointer
explores ahead — is the fast/slow pointer technique from the Linked List
module, just applied to array compaction instead of cycle detection. The
difference is the pointers move at different rates instead of converging
from opposite ends. Whenever a problem says "modify the array in place,"
whether that's removing duplicates, filtering, or grouping by some
condition, this is usually the shape.`,
};
