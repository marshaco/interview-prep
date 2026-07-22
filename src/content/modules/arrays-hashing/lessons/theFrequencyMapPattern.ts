import type { LessonSection } from '../../../types';

export const theFrequencyMapPattern: LessonSection = {
  id: 'arrays-hashing/lesson/the-frequency-map-pattern',
  title: 'The frequency map pattern',
  body: `## The frequency map pattern

Once you're keeping a hash map instead of a hash set, you can count things,
not just remember that they exist:

\`\`\`python
def count_frequencies(items):
    counts = {}
    for item in items:
        counts[item] = counts.get(item, 0) + 1
    return counts
\`\`\`

\`dict.get(key, default)\` does all the work here: it reads the current
count, or 0 if you haven't seen \`item\` yet, and you immediately overwrite
it with count + 1. No separate branch for "is this the first time"
needed.

This one-pass counting step is the foundation for a whole family of
problems:

- **Grouping by a computed key.** Instead of counting occurrences of the
  item itself, you count or collect occurrences of some function of the
  item. Sort a word's letters and group by that sorted string, and you've
  just grouped anagrams together.
- **Prefix aggregation.** Instead of a count keyed by value, you keep one
  running aggregate — a sum, a product — as you walk the array, so any
  later index can be answered using everything before it without
  rescanning.
- **Complement lookup.** Instead of asking "have I seen \`x\`?", you ask
  "have I seen whatever \`x\` needs to pair with?" That's the two-sum
  pattern, up next.

Every one of these still only walks the input once. The hash map is just
what changes between them.`,
};
