import { describe, expect, it } from 'vitest';
import { highlightPython } from './pythonHighlight';

function classesFor(text: string, tokens: ReturnType<typeof highlightPython>): string[] {
  return tokens.filter((t) => t.text === text).map((t) => t.className ?? '');
}

describe('highlightPython', () => {
  it('reassembles to the original source', () => {
    const code = 'def append(head, value):\n    return head';
    expect(highlightPython(code).map((t) => t.text).join('')).toBe(code);
  });

  it('colors keywords', () => {
    const tokens = highlightPython('def f():\n    return None');
    expect(classesFor('def', tokens)[0]).toContain('#569cd6');
    expect(classesFor('return', tokens)[0]).toContain('#569cd6');
    expect(classesFor('None', tokens)[0]).toContain('#569cd6');
  });

  it('colors comments to end of line', () => {
    const tokens = highlightPython('x = 1  # a comment\ny = 2');
    expect(classesFor('# a comment', tokens)[0]).toContain('#6a9955');
  });

  it('colors string literals, single and double quoted', () => {
    const tokens = highlightPython(`a = 'hi'\nb = "there"`);
    expect(classesFor("'hi'", tokens)[0]).toContain('#ce9178');
    expect(classesFor('"there"', tokens)[0]).toContain('#ce9178');
  });

  it('colors numbers', () => {
    const tokens = highlightPython('x = 42');
    expect(classesFor('42', tokens)[0]).toContain('#b5cea8');
  });

  it('colors a called identifier distinctly from an uncalled one', () => {
    const tokens = highlightPython('result = compute(value)');
    expect(classesFor('compute', tokens)[0]).toContain('#dcdcaa');
    expect(classesFor('value', tokens)[0]).toBe('');
  });

  it('colors a class name after the class keyword', () => {
    const tokens = highlightPython('class ListNode:\n    pass');
    expect(classesFor('ListNode', tokens)[0]).toContain('#4ec9b0');
  });

  it('colors parameter names, including self, but not their default values', () => {
    const tokens = highlightPython('def __init__(self, val=0, next=None):\n    pass');
    expect(classesFor('self', tokens)[0]).toContain('#9cdcfe');
    expect(classesFor('val', tokens)[0]).toContain('#9cdcfe');
    expect(classesFor('next', tokens)[0]).toContain('#9cdcfe');
    // Defaults are a number (already covered) and the None keyword — neither
    // should pick up the parameter color.
    expect(classesFor('None', tokens)[0]).toContain('#569cd6');
  });

  it('colors a parameter reference in the body, but not the attribute it is assigned to', () => {
    const tokens = highlightPython('def __init__(self, val):\n    self.val = val');
    const dotVal = classesFor('val', tokens);
    // First 'val' occurrence is the parameter (signature); the last is the
    // right-hand-side reference — both parameter-blue. The attribute name
    // right after `self.` must stay uncolored (plain, like real VS Code).
    expect(dotVal[0]).toContain('#9cdcfe'); // signature parameter
    expect(dotVal[dotVal.length - 1]).toContain('#9cdcfe'); // `= val` reference
    expect(dotVal.some((c) => c === '')).toBe(true); // the `self.val` attribute itself
  });
});
