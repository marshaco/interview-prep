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

\`dict.get(key, default)\` is the whole trick: it reads the current count
(or 0, if this is the first time you've seen \`item\`) and you immediately
overwrite it with count + 1. No branch for "is this the first occurrence"
needed.

This one-pass counting step is the foundation for a whole family of
problems:

- **Grouping by a computed key** — instead of counting occurrences of the
  item itself, you count (or collect) occurrences of some *function* of the
  item. Sort a word's letters and group by that sorted string, and you've
  grouped anagrams together.
- **Prefix aggregation** — instead of a running count keyed by value,
  you keep a single running aggregate (sum, product) as you walk the
  array, so a later index can be answered in terms of everything before
  it without rescanning.
- **Complement lookup** — instead of asking "have I seen \`x\`?", you ask
  "have I seen the *complement* of \`x\` for the thing I'm trying to find?"
  This is the two-sum pattern, and it's next.

Every one of these still only walks the input once. The hash map is just
what changes between them.`,
};
