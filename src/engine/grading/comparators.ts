/**
 * Python source fragments inlined into every generated harness (see
 * harness.ts). These three are always defined, regardless of which ones a
 * given question's tests actually use — they're a handful of lines each and
 * conditional inclusion isn't worth the bookkeeping.
 *
 * 'checker' is deliberately not one of these: it's a per-test custom Python
 * function body authored by the question, so harness.ts builds it dynamically
 * from each TestCase's own `checker` field rather than sharing one static
 * definition here.
 */

export const DEEP_COMPARATOR_PY = `def _deep_eq(a, b):
    return a == b`;

export const UNORDERED_COMPARATOR_PY = `def _unordered_eq(a, b):
    try:
        return sorted(a) == sorted(b)
    except TypeError:
        return False`;

export const FLOAT_CLOSE_COMPARATOR_PY = `def _float_close_eq(a, b):
    try:
        return math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-9)
    except TypeError:
        return False`;

export const COMPARATOR_DISPATCH_PY =
  "_COMPARATORS = {'deep': _deep_eq, 'unordered': _unordered_eq, 'float_close': _float_close_eq}";
