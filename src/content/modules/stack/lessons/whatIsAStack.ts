import type { LessonSection } from '../../../types';

export const whatIsAStack: LessonSection = {
  id: 'stack/lesson/what-is-a-stack',
  title: 'What is a stack?',
  diagram: {
    nodes: [{ value: 1 }, { value: 2 }, { value: 3, label: 'top', highlight: true }],
    connected: false,
    caption: 'A stack, drawn left-to-right in push order: only the top (most recently pushed) is reachable.',
  },
  body: `## What is a stack?

A stack is a collection where the only thing you can add or remove is
the most recently added item — **Last In, First Out (LIFO)**. Picture a
stack of plates: you place a new plate on top, and you can only ever take
the top plate off. You can't reach into the middle without first removing
everything above it.

Three operations define it:

- \`push(value)\` — add a new item on top.
- \`pop()\` — remove and return the top item.
- \`peek()\` — look at the top item without removing it.

This shows up everywhere in real systems, not just interviews:

- Your browser's back button — each page you visit is pushed; back
  pops the most recent one off.
- Undo in a text editor — each edit is pushed; undo pops the last one.
- The call stack itself — every function call is pushed when it starts
  and popped when it returns, which is exactly why deep recursion can
  overflow it.

A stack is deliberately less flexible than an array — you give up
random access to gain a guarantee: whatever you look at is always the most
recent thing you added. That guarantee is what makes it the right tool for
"undo the last thing," "match the innermost pair," or "backtrack to where
I just came from."`,
};
