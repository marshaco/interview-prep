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

That \`in seen\` check is O(k) for a list of length k, so the whole function
is O(n²) in the worst case — for every new element, you re-scan everything
before it.

A **hash map** (Python's \`dict\`) and its cousin the **hash set**
(\`set\`) trade a little memory for O(1) *average-case* membership and
lookup. The same function, rewritten:

\`\`\`python
def has_duplicate(nums):
    seen = set()
    for n in nums:
        if n in seen:      # O(1) average
            return True
        seen.add(n)
    return False
\`\`\`

Same shape, same one pass over the input — just a different container for
"what have I seen." This single swap — array/list scan → hash set/map
lookup — is the single most common technique in interview-style array
problems, and it's the thread connecting every exercise in this module:
counting frequencies, checking membership, grouping by a computed key, and
finding complements are all "remember something in a hash map/set, then
look it up later" wearing different clothes.

|                     | List scan | Hash set/map |
|---------------------|-----------|--------------|
| Membership check    | O(n)      | O(1) average |
| Extra space          | O(1)      | O(n) |
| Preserves order      | yes       | no (sets/dicts don't sort) |

The trade-off: hash maps cost O(n) extra space and don't preserve any
ordering. For problems where you need speed and don't care about order,
that's almost always the right trade.`,
};
