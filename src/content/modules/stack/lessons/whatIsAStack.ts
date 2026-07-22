import type { LessonSection } from '../../../types';

export const whatIsAStack: LessonSection = {
  id: 'stack/lesson/what-is-a-stack',
  title: 'What is a stack?',
  interactiveFigure: { kind: 'stack_push_pop' },
  body: `## What is a stack?

A stack only lets you touch one end of a collection: the item you added
most recently. Add something and it goes on top. Remove something and it
comes off the top. That's **LIFO** — last in, first out. Think of a stack
of plates: you can grab the top one, but you can't pull one from the
middle without moving everything above it first.

Three operations, and that's the whole interface:

- \`push(value)\` adds a new item on top.
- \`pop()\` removes and returns the top item.
- \`peek()\` looks at the top item without touching it.

You've already used stacks without thinking about it. Your browser's back
button pushes every page you visit; hitting back pops the most recent one.
Undo in a text editor works the same way. Even function calls behave like
this — each call gets pushed onto the call stack when it starts and popped
when it returns. That's the actual mechanism behind a stack overflow from
deep recursion: you're pushing faster than anything pops.

Giving up random access is the whole point. You can't jump to the middle,
but in exchange you always know exactly what the most recent thing was.
That's enough to solve "undo the last action," "match this bracket to the
one it opens," or "get back to where I came from" — problems where the
order things arrived in is all that matters.`,
};
