/**
 * Python source fragments inlined into every generated harness (see
 * harness.ts). Both comparators are always defined, regardless of which
 * ones a given question's tests actually use — they're a handful of lines
 * each and conditional inclusion isn't worth the bookkeeping.
 */

export const DEEP_COMPARATOR_PY = `def _deep_eq(a, b):
    return a == b`;

export const UNORDERED_COMPARATOR_PY = `def _unordered_eq(a, b):
    try:
        return sorted(a) == sorted(b)
    except TypeError:
        return False`;

export const COMPARATOR_DISPATCH_PY = `_COMPARATORS = {'deep': _deep_eq, 'unordered': _unordered_eq}`;
