import type { LessonSection } from '../../../types';

export const theWalkingPattern: LessonSection = {
  id: 'linked-list/lesson/the-walking-pattern',
  title: 'The walking pattern',
  diagram: {
    nodes: [{ value: 1 }, { value: 2, label: 'prev' }, { value: 3, label: 'node', highlight: true }, { value: 4 }],
    connected: true,
    caption: "reverse's two pointers mid-walk: prev trails node by one step so .next can be rewired backward.",
  },
  body: `## The walking pattern

Almost every linked list method — the ones in the next three stages
included — is a variation on the same three lines:

\`\`\`python
node = head
while node is not None:
    # do something with node.val, or check node.next
    node = node.next
\`\`\`

Start a pointer at \`head\`, do something at each node, and advance via
\`node = node.next\` until you fall off the end (\`node is None\`). That's it
— that's the whole technique. What varies between methods is only:

- **What you do at each node.** \`search\` compares \`node.val\` to a target
  and returns early. \`to_list\` appends \`node.val\` to a result list.
- **Whether you need to look one step ahead.** \`delete\` needs a pointer to
  the node *before* the one you're removing, so you can rewire its
  \`.next\` — that means checking \`node.next\` inside the loop instead of
  \`node\` itself.
- **Whether you track more than one pointer.** \`reverse\` tracks a
  \`prev\` alongside \`node\` so it can rewire \`.next\` backward as it goes.
  \`find_middle\` and \`detect_cycle\` both use a *slow* and a *fast* pointer
  moving at different speeds through the same walk.

If a method feels unfamiliar, come back to this: it's still the same walk,
just with a different thing happening at each step. The Guided Build stage
that follows has you write \`append\`, \`prepend\`, \`delete\`, and \`search\`
back-to-back specifically so this pattern stops feeling like four separate
tricks and starts feeling like one.`,
};
