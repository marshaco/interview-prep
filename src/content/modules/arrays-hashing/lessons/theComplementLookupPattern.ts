import type { LessonSection } from '../../../types';

export const theComplementLookupPattern: LessonSection = {
  id: 'arrays-hashing/lesson/the-complement-lookup-pattern',
  title: 'The complement-lookup pattern',
  body: `## The complement-lookup pattern

The classic "two sum" problem: given a list of numbers and a target, find
the indices of two numbers that add up to the target.

The naive approach checks every pair — O(n²):

\`\`\`python
def two_sum_slow(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
\`\`\`

The hash-map version flips the question around. Instead of "does some
*later* number pair with this one," ask "have I already seen the number
that would pair with this one?" — the **complement**, \`target - nums[i]\`:

\`\`\`python
def two_sum(nums, target):
    seen = {}  # value -> index
    for i, n in enumerate(nums):
        complement = target - n
        if complement in seen:
            return [seen[complement], i]
        seen[n] = i
\`\`\`

One pass, O(n). The hash map remembers *every value you've already walked
past, and where*, so by the time you reach the second number of a valid
pair, its partner is already sitting in the map ready to be looked up in
O(1).

This "have I seen the thing that completes this" shape reappears constantly
once you know to look for it — anywhere a problem asks about *pairs*,
*complements*, or "does X exist such that X and current combine to
something," a hash map turning an O(n²) pair-check into an O(n) single pass
is usually the move.`,
};
