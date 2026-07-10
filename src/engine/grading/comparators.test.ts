import { describe, expect, it } from 'vitest';
import { COMPARATOR_DISPATCH_PY, DEEP_COMPARATOR_PY, FLOAT_CLOSE_COMPARATOR_PY, UNORDERED_COMPARATOR_PY } from './comparators';

/**
 * These tests only assert the *shape of the generated Python source* — they
 * do not execute Python themselves. Real behavioural verification of the
 * comparators now happens indirectly via canonicalSolutions.test.ts (Node-side
 * Pyodide), which runs real questions' canonical solutions — and therefore
 * these comparator functions — through a real interpreter. Don't read more
 * confidence into *these* string-level tests than that.
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

  it('defines _float_close_eq using math.isclose with a tight tolerance', () => {
    expect(FLOAT_CLOSE_COMPARATOR_PY).toContain('def _float_close_eq(a, b):');
    expect(FLOAT_CLOSE_COMPARATOR_PY).toContain('math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-9)');
    expect(FLOAT_CLOSE_COMPARATOR_PY).toContain('except TypeError:');
  });

  it('dispatch table maps deep/unordered/float_close to their functions', () => {
    expect(COMPARATOR_DISPATCH_PY).toBe(
      "_COMPARATORS = {'deep': _deep_eq, 'unordered': _unordered_eq, 'float_close': _float_close_eq}",
    );
  });
});
