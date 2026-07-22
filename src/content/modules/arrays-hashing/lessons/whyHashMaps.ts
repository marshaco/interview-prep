import type { LessonSection } from '../../../types';

export const whyHashMaps: LessonSection = {
  id: 'arrays-hashing/lesson/why-hash-maps',
  title: 'Why hash maps?',
  body: `## Why hash maps?

The naive way to answer "have I seen this value before?" is to scan
whatever you've collected so far, one element at a time:

\`\`\`python
def has_duplicate_slow(nums):
    seen = []
    for n in nums:
        if n in seen:      # O(k) scan of everything seen so far
            return True
        seen.append(n)
    return False
\`\`\`

That \`in seen\` check costs O(k) for a list of length k, which makes the
whole function O(n²) in the worst case: for every new element, you're
re-scanning everything that came before it.

A **hash map** — Python's \`dict\` — and its cousin the **hash set**
(\`set\`) trade a bit of memory for O(1) average-case membership and
lookup. Same function, rewritten:

\`\`\`python
def has_duplicate(nums):
    seen = set()
    for n in nums:
        if n in seen:      # O(1) average
            return True
        seen.add(n)
    return False
\`\`\`

Same shape, same single pass over the input, just a different container
for "what have I seen so far." Swapping a list scan for a hash set or map
lookup is probably the single most common move in array interview
problems. Every exercise in this module comes back to it in some form:
counting frequencies, checking membership, grouping by a computed key,
finding complements — underneath, they're all just "remember something,
then look it up later."

|                     | List scan | Hash set/map |
|---------------------|-----------|--------------|
| Membership check    | O(n)      | O(1) average |
| Extra space          | O(1)      | O(n) |
| Preserves order      | yes       | no (sets/dicts don't sort) |

The cost: O(n) extra space, and no ordering guarantee. When you need
speed and don't care about order, that's a trade worth making almost
every time.`,
};
