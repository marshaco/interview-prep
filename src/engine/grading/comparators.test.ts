import { describe, expect, it } from 'vitest';
import { COMPARATOR_DISPATCH_PY, DEEP_COMPARATOR_PY, UNORDERED_COMPARATOR_PY } from './comparators';

/**
 * These tests only assert the *shape of the generated Python source* — they
 * do not execute Python. Real behavioural verification of the comparators
 * (that `_deep_eq`/`_unordered_eq` actually do the right thing inside
 * Pyodide) arrives in Phase 1's Node-side Pyodide CI, which runs every
 * canonical solution through its own harness. Do not read more confidence
 * into these tests than that.
 */
describe('comparator Python source (string-level only, not executed)', () => {
  it('defines _deep_eq using structural equality', () => {
    expect(DEEP_COMPARATOR_PY).toContain('def _deep_eq(a, b):');
    expect(DEEP_COMPARATOR_PY).toContain('return a == b');
  });

  it('defines _unordered_eq comparing sorted sequences and tolerating unsortable input', () => {
    expect(UNORDERED_COMPARATOR_PY).toContain('def _unordered_eq(a, b):');
    expect(UNORDERED_COMPARATOR_PY).toContain('sorted(a) == sorted(b)');
    expect(UNORDERED_COMPARATOR_PY).toContain('except TypeError:');
  });

  it('dispatch table maps both comparator names to their functions', () => {
    expect(COMPARATOR_DISPATCH_PY).toBe("_COMPARATORS = {'deep': _deep_eq, 'unordered': _unordered_eq}");
  });
});
